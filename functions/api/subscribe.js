/**
 * Newsletter signup — Cloudflare Pages Function (POST /api/subscribe)
 *
 * Takes an email from the form on /blog and creates the subscription on
 * beehiiv. The point of doing it here rather than linking out is that the
 * reader never leaves the site and the form is ours to style; the API key
 * stays server-side and is never shipped to the browser.
 *
 * Required bindings (Cloudflare Pages → Settings → Environment variables):
 *   BEEHIIV_API_KEY       secret   beehiiv API key (server-side only)
 * Optional:
 *   BEEHIIV_PUBLICATION   var      publication id (defaults to Seeking Certainty)
 *   SCAN_KV               KV       reused for rate limiting; absent = no limit
 *   SUBSCRIBE_IP_HOURLY   var      max signups per IP per hour (default 5)
 *
 * Health: GET /api/subscribe?health=1 → { ok, key_present, kv }.
 */

const DEFAULT_PUBLICATION = "pub_032815a3-09de-4fe3-8ddd-29887c80a61d";
const DEFAULT_IP_HOURLY = 5;
const BEEHIIV_TIMEOUT_MS = 8000;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function fail(message, status) {
  return json({ error: message }, status || 400);
}

function isValidEmail(e) {
  return typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
}

/**
 * Signup is cheap to abuse, so it is capped per IP per hour. This reuses
 * the scan's KV namespace rather than asking for a second one; the key
 * prefix keeps the two apart. No KV bound means no limit, which is the
 * same fail-open choice the scan makes — a missing binding should not stop
 * real people subscribing.
 */
async function rateLimit(env, ip) {
  if (!env.SCAN_KV) return { ok: true };
  try {
    const now = new Date();
    const bucket =
      now.getUTCFullYear() +
      "-" +
      String(now.getUTCMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getUTCDate()).padStart(2, "0") +
      "-" +
      String(now.getUTCHours()).padStart(2, "0");
    const key = "sub:ip:" + ip + ":" + bucket;
    const limit = parseInt(env.SUBSCRIBE_IP_HOURLY, 10) || DEFAULT_IP_HOURLY;
    const n = parseInt(await env.SCAN_KV.get(key), 10) || 0;
    if (n >= limit) return { ok: false, rateLimited: true };
    return { ok: true, key: key, n: n };
  } catch (e) {
    console.log("subscribe-health: KV check failed, failing open: " + e);
    return { ok: true };
  }
}

async function countSignup(env, gate) {
  if (!env.SCAN_KV || !gate.key) return;
  try {
    await env.SCAN_KV.put(gate.key, String(gate.n + 1), { expirationTtl: 7200 });
  } catch (e) {
    console.log("subscribe-health: KV write failed: " + e);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.BEEHIIV_API_KEY) {
    console.log("subscribe-health: BEEHIIV_API_KEY missing");
    return fail("Signup isn't wired up yet — try the newsletter page directly.", 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return fail("Send an email address.");
  }

  // Honeypot. A field named for something a person would never be shown is
  // left empty by anyone using the form and filled by anything walking the
  // DOM. Bots get the same success shape a person gets, so a filled trap
  // reveals nothing about why nothing happened.
  if (payload && typeof payload.company === "string" && payload.company.trim() !== "") {
    return json({ ok: true, status: "active" });
  }

  const email = ((payload && payload.email) || "").trim().toLowerCase();
  if (!isValidEmail(email)) return fail("That email doesn't look right.");

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const gate = await rateLimit(env, ip);
  if (gate.rateLimited) {
    return fail("That's a few signups from here already — give it an hour.", 429);
  }

  const publication = env.BEEHIIV_PUBLICATION || DEFAULT_PUBLICATION;
  const source = (payload && typeof payload.source === "string" ? payload.source : "").slice(0, 120);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BEEHIIV_TIMEOUT_MS);

  let res, body;
  try {
    res = await fetch("https://api.beehiiv.com/v2/publications/" + publication + "/subscriptions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: "Bearer " + env.BEEHIIV_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: email,
        // Someone typing their address into the form is asking to be on the
        // list again, whatever happened last time.
        reactivate_existing: true,
        send_welcome_email: true,
        utm_source: "shanegring.com",
        utm_medium: "website",
        utm_campaign: source || "blog",
        referring_site: "https://shanegring.com/blog/",
      }),
    });
    body = await res.json().catch(() => null);
  } catch (e) {
    console.log("subscribe-health: beehiiv request failed: " + e);
    return fail("Couldn't reach the newsletter service — try again in a moment.", 502);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    console.log("subscribe-health: beehiiv returned " + res.status + " " + JSON.stringify(body).slice(0, 300));
    if (res.status === 429) return fail("The newsletter service is busy — try again shortly.", 503);
    return fail("Couldn't complete the signup. Try again, or email me and I'll add you.", 502);
  }

  await countSignup(env, gate);

  // beehiiv reports "validating" for a fresh address and "active" for one it
  // already knows. Both mean the reader is done; only the wording changes.
  const status = (body && body.data && body.data.status) || "validating";
  return json({ ok: true, status: status });
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    const url = new URL(context.request.url);
    if (url.searchParams.get("health") === "1") {
      return json({
        ok: true,
        key_present: Boolean(context.env.BEEHIIV_API_KEY),
        kv: Boolean(context.env.SCAN_KV),
      });
    }
  }
  return fail("POST a JSON body with an email.", 405);
}
