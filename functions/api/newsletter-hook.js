/**
 * beehiiv publish hook — Cloudflare Pages Function (POST /api/newsletter-hook)
 *
 * beehiiv calls this when a post is sent. It asks GitHub to run the
 * sync-newsletter workflow, which pulls the new issue, rebuilds /blog and
 * deploys. Without it the archive still updates, just on the three-hourly
 * schedule instead of within a minute.
 *
 * beehiiv webhooks cannot send custom headers and carry no signature, so the
 * shared secret lives in the query string of the registered URL. That is
 * weaker than a signed body — the URL appears in logs — so this endpoint is
 * built to be dull if it leaks: it reads nothing from the request body, takes
 * no parameters, and does exactly one idempotent thing. The workflow it
 * triggers commits only when beehiiv actually has something new, so the worst
 * an attacker gets is wasted CI minutes, and the cooldown caps even that.
 *
 * Required bindings (Cloudflare Pages → Settings → Environment variables):
 *   NEWSLETTER_HOOK_SECRET   secret   matches ?key= on the registered URL
 *   GITHUB_DISPATCH_TOKEN    secret   fine-grained PAT, Actions: read+write
 *                                     on this repo only. Do not use a broad
 *                                     classic token: this endpoint is public.
 * Optional:
 *   SCAN_KV                  KV       reused for the cooldown; absent = none
 *
 * Health: GET /api/newsletter-hook?health=1 → { ok, secret_set, token_set, kv }
 */

const REPO = "shanegringcertainlycoop/shanegring.com";
const WORKFLOW = "sync-newsletter.yml";
const COOLDOWN_SECONDS = 120;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

// Length-independent compare. The secret is in a URL rather than a signature,
// so this is not the weak link, but timing leaks are free to avoid.
function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * beehiiv can retry, and a burst of events (a post sent to several lists)
 * should not mean a burst of deploys. One dispatch per cooldown window is
 * plenty: the workflow re-reads everything from beehiiv each run, so a single
 * late run catches every event that happened during the window.
 */
async function recentlyDispatched(env) {
  if (!env.SCAN_KV) return false;
  try {
    if (await env.SCAN_KV.get("hook:newsletter:last")) return true;
    await env.SCAN_KV.put("hook:newsletter:last", "1", { expirationTtl: COOLDOWN_SECONDS });
    return false;
  } catch (e) {
    console.log("hook-health: KV check failed, allowing through: " + e);
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.NEWSLETTER_HOOK_SECRET || !env.GITHUB_DISPATCH_TOKEN) {
    console.log("hook-health: not configured");
    // 200, not 503: beehiiv disables a webhook that keeps failing, and the
    // scheduled sync already covers this. Silence beats a dead hook.
    return json({ ok: true, dispatched: false, reason: "not configured" });
  }

  const key = new URL(request.url).searchParams.get("key") || "";
  if (!sameSecret(key, env.NEWSLETTER_HOOK_SECRET)) {
    return json({ error: "no" }, 401);
  }

  if (await recentlyDispatched(env)) {
    return json({ ok: true, dispatched: false, reason: "cooldown" });
  }

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.GITHUB_DISPATCH_TOKEN,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "shanegring.com-newsletter-hook",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (res.status !== 204) {
    const body = await res.text();
    console.log("hook-health: dispatch failed " + res.status + " " + body.slice(0, 200));
    return json({ ok: false, dispatched: false, status: res.status }, 502);
  }

  return json({ ok: true, dispatched: true });
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    const url = new URL(context.request.url);
    if (url.searchParams.get("health") === "1") {
      return json({
        ok: true,
        secret_set: Boolean(context.env.NEWSLETTER_HOOK_SECRET),
        token_set: Boolean(context.env.GITHUB_DISPATCH_TOKEN),
        kv: Boolean(context.env.SCAN_KV),
      });
    }
  }
  return json({ error: "POST only." }, 405);
}
