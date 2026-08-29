/**
 * Shared Attio CRM capture for shanegring.com Pages Functions.
 *
 * Policy (Shane, 2026-08-29): anything captured on shanegring.com drops into
 * Attio. Every caller is best-effort — Attio being down or unconfigured must
 * never block the visitor-facing response. Callers wrap attioCapture in a
 * catch and run it under ctx.waitUntil.
 *
 * Requires the ATTIO_API_KEY secret. Workspace: shane-gring; list slug
 * "leads" (parent object: people) with entry attributes stage / source /
 * next_action.
 */

const BASE = "https://api.attio.com/v2";

async function api(env, method, path, body) {
  const r = await fetch(BASE + path, {
    method: method,
    headers: {
      "Authorization": "Bearer " + env.ATTIO_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const b = await r.text().catch(function () { return ""; });
    throw new Error("attio " + method + " " + path + " -> " + r.status + " " + b.slice(0, 200));
  }
  return r.json();
}

/**
 * Upsert a person by email, ensure a Leads-list entry exists (never touching
 * an existing entry — its stage and next_action are Shane's to manage), and
 * optionally attach a markdown note.
 *
 * opts: {
 *   email           required
 *   name            optional display name for a newly created person
 *   stage           list stage for a NEW entry (default "New")
 *   source          list source for a NEW entry (default "Website")
 *   offer           optional offer select for a NEW entry (set only when certain)
 *   nextActionDays  days from now for a NEW entry's next_action (default 1)
 *   noteTitle, noteContent   optional note (markdown)
 *   advance         optional { stage, ifIn: [stages], nextAction: "YYYY-MM-DD" } —
 *                   when the person ALREADY has a list entry, move it to `stage`
 *                   (and set next_action) but only if its current stage is in
 *                   `ifIn`. Used by call bookings: a booked call advances New/
 *                   Contacted/Replied/Nurture leads, but never touches Won/Lost/
 *                   Proposal sent. New entries are unaffected by this option.
 * }
 */
export async function attioCapture(env, opts) {
  if (!env.ATTIO_API_KEY) {
    console.log("attio: ATTIO_API_KEY not configured; capture skipped");
    return;
  }

  const values = { email_addresses: [opts.email] };
  if (opts.name) values.name = opts.name;
  const person = await api(env, "PUT", "/objects/people/records?matching_attribute=email_addresses", {
    data: { values: values },
  });
  const recordId = person.data.id.record_id;

  const existing = await api(env, "POST", "/lists/leads/entries/query", {
    filter: { parent_record: { target_object: "people", target_record_id: recordId } },
    limit: 1,
  });
  if (existing.data && existing.data.length > 0 && opts.advance) {
    const entry = existing.data[0];
    const cur = entry.entry_values && entry.entry_values.stage;
    const curTitle = Array.isArray(cur) && cur[0] ? (cur[0].status && cur[0].status.title) || cur[0].value || "" : "";
    if (opts.advance.ifIn.includes(curTitle)) {
      const values = { stage: opts.advance.stage };
      if (opts.advance.nextAction) values.next_action = opts.advance.nextAction;
      await api(env, "PATCH", "/lists/leads/entries/" + entry.id.entry_id, {
        data: { entry_values: values },
      });
    }
  }
  if (!existing.data || existing.data.length === 0) {
    const days = opts.nextActionDays == null ? 1 : opts.nextActionDays;
    const nextAction = opts.nextActionDate ||
      new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const entryValues = {
      stage: opts.stage || "New",
      source: opts.source || "Website",
      next_action: nextAction,
    };
    if (opts.offer) entryValues.offer = opts.offer;
    await api(env, "POST", "/lists/leads/entries", {
      data: {
        parent_object: "people",
        parent_record_id: recordId,
        entry_values: entryValues,
      },
    });
  }

  if (opts.noteTitle && opts.noteContent) {
    await api(env, "POST", "/notes", {
      data: {
        parent_object: "people",
        parent_record_id: recordId,
        title: opts.noteTitle,
        format: "markdown",
        content: opts.noteContent,
      },
    });
  }
}
