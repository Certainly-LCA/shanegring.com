/**
 * Attio webhook → Slack ping — Cloudflare Pages Function (POST /api/attio-alert)
 *
 * Attio fires a webhook whenever an entry is added to the Leads list (from any
 * source: Tally forms, the scan, newsletter, /lead skill, manual). This
 * function enriches the event with the person's name/email and the entry's
 * stage/source/offer, then posts one line to Slack #leads via the buzz-alerts
 * Worker — so a hot lead pings Shane in minutes instead of waiting for the
 * next morning's pipeline brief.
 *
 * Attio webhooks are unsigned; the shared token in the URL query is the auth.
 *
 * Required bindings (Cloudflare Pages → Settings):
 *   ATTIO_API_KEY        secret   used to enrich the event
 *   ATTIO_WEBHOOK_TOKEN  secret   must match ?token= on the webhook URL
 *   BUZZ_NOTIFY_SECRET   secret   x-alert-secret for the buzz-alerts /notify route
 */

const WORKER_NOTIFY = "https://buzz-alerts.shane-gring.workers.dev/notify";
const LEADS_CHANNEL = "C0BTJ84CS9L"; // Slack #leads (public; bot posts via chat:write.public)
const LEADS_LIST_ID = "cfba0d31-4e69-47fa-91a1-239f9eba806a";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function attio(env, path) {
  const r = await fetch("https://api.attio.com/v2" + path, {
    headers: { "Authorization": "Bearer " + env.ATTIO_API_KEY },
  });
  if (!r.ok) throw new Error("attio GET " + path + " -> " + r.status);
  return r.json();
}

// Attio value payloads are arrays of {value|option|status|...}; flatten to text.
function attioValue(values, slug) {
  const v = values && values[slug];
  if (!Array.isArray(v) || v.length === 0) return "";
  const x = v[0];
  return x.option?.title || x.status?.title || x.currency_value || x.value ||
    x.full_name || x.email_address || "";
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.ATTIO_WEBHOOK_TOKEN || !env.BUZZ_NOTIFY_SECRET || !env.ATTIO_API_KEY) {
    return json({ error: "not configured" }, 503);
  }
  const url = new URL(request.url);
  if (url.searchParams.get("token") !== env.ATTIO_WEBHOOK_TOKEN) {
    return json({ error: "bad token" }, 401);
  }

  let payload;
  try { payload = await request.json(); } catch (e) { return json({ error: "bad json" }, 400); }
  const events = Array.isArray(payload.events) ? payload.events : [];

  const work = (async function () {
    for (const ev of events) {
      try {
        if (ev.event_type !== "list-entry.created") continue;
        const listId = ev.id && ev.id.list_id;
        const entryId = ev.id && ev.id.entry_id;
        if (listId !== LEADS_LIST_ID || !entryId) continue;

        const entry = await attio(env, "/lists/" + LEADS_LIST_ID + "/entries/" + entryId);
        const ent = entry.data || {};
        const personId = ent.parent_record_id;
        const evs = ent.entry_values || {};
        const stage = attioValue(evs, "stage") || "New";
        const source = attioValue(evs, "source") || "?";
        const offer = attioValue(evs, "offer");

        let who = "someone";
        if (personId) {
          const person = await attio(env, "/objects/people/records/" + personId);
          const pv = (person.data && person.data.values) || {};
          const name = attioValue(pv, "name");
          const email = attioValue(pv, "email_addresses");
          who = name && email ? name + " (" + email + ")" : name || email || personId;
        }

        const text = "🎯 New lead: **" + who + "** — " + stage + " / " + source +
          (offer ? " / " + offer : "") +
          "\nhttps://app.attio.com/shane-gring/collection/" + LEADS_LIST_ID;

        const r = await fetch(WORKER_NOTIFY, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-alert-secret": env.BUZZ_NOTIFY_SECRET,
          },
          body: JSON.stringify({ text: text, channel: LEADS_CHANNEL }),
        });
        if (!r.ok) console.log("attio-alert notify failed: " + r.status + " " + (await r.text()).slice(0, 200));
      } catch (e) {
        console.log("attio-alert event error: " + e);
      }
    }
  })();

  if (context.waitUntil) context.waitUntil(work); else await work;
  return json({ ok: true });
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    const url = new URL(context.request.url);
    if (url.searchParams.get("health") === "1") {
      return json({
        ok: true,
        token_present: Boolean(context.env.ATTIO_WEBHOOK_TOKEN),
        notify_secret_present: Boolean(context.env.BUZZ_NOTIFY_SECRET),
        attio_key_present: Boolean(context.env.ATTIO_API_KEY),
      });
    }
  }
  return json({ error: "POST only" }, 405);
}
