/**
 * RB2B webhook receiver — Cloudflare Pages Function (POST /api/rb2b-lead)
 *
 * RB2B's Webhook integration POSTs one JSON object per identified visitor
 * (person-level, US only). Profiles with a business email are dropped into
 * Attio like every other shanegring.com capture: person upserted by email,
 * Leads-list entry ensured, profile attached as a note. Profiles without an
 * email have no upsert key, so they stay Slack-only and are just logged.
 *
 * RB2B does not sign requests, so the webhook URL carries a secret:
 *   https://shanegring.com/api/rb2b-lead?key=<RB2B_WEBHOOK_SECRET>
 *
 * Required bindings (Cloudflare Pages → Settings):
 *   ATTIO_API_KEY          secret   see functions/lib/attio.js
 *   RB2B_WEBHOOK_SECRET    secret   random string shared only with RB2B
 *
 * Payload keys use spaces ("LinkedIn URL", "Business Email", ...) per
 * https://support.rb2b.com/en/articles/9483979
 */

import { attioCapture } from "../lib/attio.js";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RB2B_WEBHOOK_SECRET) {
    console.log("rb2b-lead: RB2B_WEBHOOK_SECRET missing — rejecting");
    return json({ error: "not configured" }, 503);
  }
  const url = new URL(request.url);
  if (url.searchParams.get("key") !== env.RB2B_WEBHOOK_SECRET) {
    console.log("rb2b-lead: bad key");
    return json({ error: "unauthorized" }, 401);
  }

  let p;
  try { p = await request.json(); } catch (e) { return json({ error: "bad json" }, 400); }

  const email = String(p["Business Email"] || "").trim().toLowerCase();
  const linkedin = String(p["LinkedIn URL"] || "").trim();
  if (!email) {
    console.log("rb2b-lead: no business email for " + (linkedin || "unknown profile") + "; Slack-only");
    return json({ ok: true, skipped: "no email" });
  }

  const name = [p["First Name"], p["Last Name"]].filter(Boolean).join(" ").trim();

  const detail = [
    ["LinkedIn", linkedin],
    ["Title", p["Title"]],
    ["Company", p["Company Name"]],
    ["Website", p["Website"]],
    ["Industry", p["Industry"]],
    ["Employees", p["Employee Count"]],
    ["Est. revenue", p["Estimate Revenue"]],
    ["Location", [p["City"], p["State"]].filter(Boolean).join(", ")],
    ["Page visited", p["Captured URL"]],
    ["Referrer", p["Referrer"]],
    ["Tags", p["Tags"]],
  ]
    .filter(function (row) { return row[1] != null && String(row[1]).trim() !== ""; })
    .map(function (row) { return "**" + row[0] + ":** " + row[1]; });
  const note = "Identified " + (p["Seen At"] || "") + " by RB2B visitor identification.\n\n" +
    detail.join("\n\n");

  // A return visit from an active lead pulls their next_action to tomorrow
  // (never pushing an already-sooner date back, never touching stage) — being
  // back on the site is the strongest signal RB2B produces. Won/Lost/Proposal
  // sent are Shane's to manage and stay untouched.
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);

  const task = attioCapture(env, {
    email: email,
    name: name || undefined,
    stage: "New",
    source: "Website",
    nextActionDays: 1,
    noteTitle: "Site visitor identified — RB2B",
    noteContent: note,
    touch: { ifIn: ["New", "Contacted", "Replied", "Nurture"], nextAction: tomorrow },
  }).catch(function (e) { console.log("rb2b-lead attio error: " + e); });

  if (context.waitUntil) context.waitUntil(task); else await task;
  return json({ ok: true });
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    const url = new URL(context.request.url);
    if (url.searchParams.get("health") === "1") {
      return json({
        ok: true,
        webhook_secret_present: Boolean(context.env.RB2B_WEBHOOK_SECRET),
        attio_key_present: Boolean(context.env.ATTIO_API_KEY),
      });
    }
  }
  return json({ error: "POST only" }, 405);
}
