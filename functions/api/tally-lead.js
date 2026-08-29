/**
 * Tally webhook receiver — Cloudflare Pages Function (POST /api/tally-lead)
 *
 * Every Tally form on shanegring.com posts submissions here (webhooks are
 * registered per-form via the Tally API). Each submission is verified against
 * the shared signing secret, then dropped into Attio: person upserted by
 * email, Leads-list entry ensured, full answers attached as a note. Policy:
 * anything captured on shanegring.com lands in Attio.
 *
 * Required bindings (Cloudflare Pages → Settings):
 *   ATTIO_API_KEY          secret   see functions/lib/attio.js
 *   TALLY_SIGNING_SECRET   secret   HMAC key shared with the Tally webhooks
 *
 * Form routing (by Tally form id):
 *   MepBpY  Contact       → stage New,  source Website
 *   yP5L50  Work inquiry  → stage New,  source Website
 *   XxPXPO  Read intake   → stage Won,  source Website (they bought the Read)
 *   anything else         → stage New,  source Website (future forms just work)
 *
 * Tally signs each request: tally-signature header = base64(HMAC-SHA256(body)).
 */

import { attioCapture } from "../lib/attio.js";

const FORM_RULES = {
  MepBpY: { title: "Contact form — shanegring.com", stage: "New", nextActionDays: 1 },
  yP5L50: { title: "Work inquiry — shanegring.com", stage: "New", nextActionDays: 1 },
  XxPXPO: { title: "Read intake — shanegring.com", stage: "Won", nextActionDays: 1, offer: "Read" },
};

// The hidden `page` field says which page hosted the Work inquiry form; two of
// those pages are offer-specific. Only map when it's unambiguous — the generic
// pages leave offer for Shane to set.
const PAGE_OFFER = { autopilot: "Autopilot", site: "Site" };

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function validSignature(secret, rawBody, signatureHeader) {
  if (!signatureHeader) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  // Constant-time-ish compare; length check first keeps it honest.
  if (expected.length !== signatureHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  return diff === 0;
}

// Tally sends fields as [{key, label, type, value, ...}]. Values can be
// strings, arrays, or option ids; render everything to plain text.
function fieldText(f) {
  const v = f.value;
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(String).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.TALLY_SIGNING_SECRET) {
    console.log("tally-lead: TALLY_SIGNING_SECRET missing — rejecting so Tally retries later");
    return json({ error: "not configured" }, 503);
  }

  const raw = await request.text();
  const ok = await validSignature(env.TALLY_SIGNING_SECRET, raw, request.headers.get("tally-signature"));
  if (!ok) {
    console.log("tally-lead: bad signature");
    return json({ error: "bad signature" }, 401);
  }

  let event;
  try { event = JSON.parse(raw); } catch (e) { return json({ error: "bad json" }, 400); }
  if (event.eventType !== "FORM_RESPONSE" || !event.data) return json({ ok: true, ignored: true });

  const d = event.data;
  const fields = Array.isArray(d.fields) ? d.fields : [];
  const byLabel = {};
  for (const f of fields) byLabel[(f.label || f.key || "").toLowerCase()] = fieldText(f);

  const email = (byLabel["email"] || byLabel["checkout email"] || "").trim().toLowerCase();
  if (!email) {
    console.log("tally-lead: no email in submission " + (d.submissionId || "?") + "; skipping");
    return json({ ok: true, skipped: "no email" });
  }
  const name = (byLabel["name"] || "").trim();
  const rule = FORM_RULES[d.formId] || { title: (d.formName || "Tally form") + " — shanegring.com", stage: "New", nextActionDays: 1 };

  // Note body: every answer, in submission order, plus the hidden page field.
  const lines = fields
    .filter(function (f) { return fieldText(f) !== ""; })
    .map(function (f) { return "**" + (f.label || f.key) + ":** " + fieldText(f); });
  const note = "Submitted " + (d.createdAt || event.createdAt || "") + " via Tally (" + (d.formName || d.formId) + ").\n\n" +
    lines.join("\n\n");

  const offer = rule.offer || PAGE_OFFER[(byLabel["page"] || "").trim()] || undefined;

  const task = attioCapture(env, {
    email: email,
    name: name || undefined,
    stage: rule.stage,
    source: "Website",
    offer: offer,
    nextActionDays: rule.nextActionDays,
    noteTitle: rule.title,
    noteContent: note,
  }).catch(function (e) { console.log("tally-lead attio error: " + e); });

  if (context.waitUntil) context.waitUntil(task); else await task;
  return json({ ok: true });
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    const url = new URL(context.request.url);
    if (url.searchParams.get("health") === "1") {
      return json({
        ok: true,
        signing_secret_present: Boolean(context.env.TALLY_SIGNING_SECRET),
        attio_key_present: Boolean(context.env.ATTIO_API_KEY),
      });
    }
  }
  return json({ error: "POST only" }, 405);
}
