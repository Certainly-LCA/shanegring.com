/**
 * Cal.com webhook receiver — Cloudflare Pages Function (POST /api/cal-lead)
 *
 * Fires on BOOKING_CREATED from Shane's Cal.com account. The booker lands in
 * Attio as a lead: person upserted by email, Leads entry created at stage
 * "Call booked" with next_action = the call date — or, if they're already a
 * lead in an early stage (New/Contacted/Replied/Nurture), their entry is
 * advanced to "Call booked". Booking details are filed as a note. Won/Lost/
 * Proposal-sent leads are never touched by a booking.
 *
 * Cal signs each request: x-cal-signature-256 = hex(HMAC-SHA256(body)).
 *
 * Required bindings (Cloudflare Pages → Settings):
 *   ATTIO_API_KEY        secret   see functions/lib/attio.js
 *   CAL_WEBHOOK_SECRET   secret   the secret configured on the Cal.com webhook
 */

import { attioCapture } from "../lib/attio.js";

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
  const expected = [...new Uint8Array(mac)].map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  if (expected.length !== signatureHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  return diff === 0;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const raw = await request.text();

  let event;
  try { event = JSON.parse(raw); } catch (e) { return json({ error: "bad json" }, 400); }

  // Cal's UI ping test must succeed before a webhook can be created, and the
  // ping fires before the signing secret exists on either side. A ping has no
  // side effects here, so it's acknowledged unsigned and unconfigured;
  // everything else requires the secret and a valid signature.
  if (event.triggerEvent === "PING") return json({ ok: true, pong: true });

  if (!env.CAL_WEBHOOK_SECRET) {
    console.log("cal-lead: CAL_WEBHOOK_SECRET missing — rejecting so Cal retries later");
    return json({ error: "not configured" }, 503);
  }

  const ok = await validSignature(env.CAL_WEBHOOK_SECRET, raw, request.headers.get("x-cal-signature-256"));
  if (!ok) {
    console.log("cal-lead: bad signature");
    return json({ error: "bad signature" }, 401);
  }
  if (event.triggerEvent !== "BOOKING_CREATED" || !event.payload) {
    return json({ ok: true, ignored: event.triggerEvent || "no trigger" });
  }

  const p = event.payload;
  const attendee = Array.isArray(p.attendees) && p.attendees[0] ? p.attendees[0] : null;
  const email = ((attendee && attendee.email) || "").trim().toLowerCase();
  if (!email) return json({ ok: true, skipped: "no attendee email" });
  // Don't process Shane booking things on his own calendars.
  if (email === "shane@shanegring.com" || email === "shane.gring@certainly.coop") {
    return json({ ok: true, skipped: "self" });
  }

  const callDate = (p.startTime || "").slice(0, 10) || undefined;
  const answers = p.responses
    ? Object.keys(p.responses).map(function (k) {
        const r = p.responses[k];
        const v = r && typeof r === "object" && "value" in r ? r.value : r;
        if (v == null || v === "" || (typeof v === "object" && !Array.isArray(v))) return null;
        return "**" + (r && r.label ? r.label : k) + ":** " + (Array.isArray(v) ? v.join(", ") : String(v));
      }).filter(Boolean).join("\n")
    : "";

  const task = attioCapture(env, {
    email: email,
    name: (attendee && attendee.name) || undefined,
    stage: "Call booked",
    source: "Website",
    nextActionDate: callDate,
    noteTitle: "Call booked — " + (p.title || p.type || "Cal.com"),
    noteContent: "Booked via Cal.com for **" + (p.startTime || "?") + "**" +
      (attendee && attendee.timeZone ? " (" + attendee.timeZone + ")" : "") + ".\n\n" +
      (answers ? answers + "\n\n" : "") +
      "Event type: " + (p.type || "?"),
    advance: {
      stage: "Call booked",
      ifIn: ["New", "Contacted", "Replied", "Nurture"],
      nextAction: callDate,
    },
  }).catch(function (e) { console.log("cal-lead attio error: " + e); });

  if (context.waitUntil) context.waitUntil(task); else await task;
  return json({ ok: true });
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    const url = new URL(context.request.url);
    if (url.searchParams.get("health") === "1") {
      return json({
        ok: true,
        cal_secret_present: Boolean(context.env.CAL_WEBHOOK_SECRET),
        attio_key_present: Boolean(context.env.ATTIO_API_KEY),
      });
    }
  }
  return json({ error: "POST only" }, 405);
}
