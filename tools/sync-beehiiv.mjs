#!/usr/bin/env node
/**
 * Pulls published posts from beehiiv into blog/_data/posts.json.
 *
 *   BEEHIIV_API_KEY=... node tools/sync-beehiiv.mjs
 *   node tools/sync-beehiiv.mjs --dry-run      # show what would change
 *
 * The key comes from app.beehiiv.com -> Settings -> API. It is read from
 * the environment or from a .env file at the repo root (gitignored). It is
 * never written to disk by this script and must not be committed: the
 * deploy is `wrangler pages deploy .` from this directory, so anything
 * committed here is served publicly.
 *
 * Run tools/build-blog.mjs afterwards to regenerate the pages, or use
 * --build to do both.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'blog/_data/posts.json');

const PUBLICATION_ID = 'pub_032815a3-09de-4fe3-8ddd-29887c80a61d'; // Seeking Certainty
const API = 'https://api.beehiiv.com/v2';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ALSO_BUILD = args.includes('--build');

/* ---------------------------------------------------------------- */

function loadKey() {
  if (process.env.BEEHIIV_API_KEY) return process.env.BEEHIIV_API_KEY.trim();

  const envFile = resolve(ROOT, '.env');
  if (existsSync(envFile)) {
    const match = readFileSync(envFile, 'utf8').match(/^BEEHIIV_API_KEY\s*=\s*(.+)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  }

  console.error(
    'No beehiiv API key found.\n\n' +
      'Create one at app.beehiiv.com -> Settings -> API, then either:\n' +
      '  export BEEHIIV_API_KEY=...\n' +
      'or add this line to .env at the repo root (already gitignored):\n' +
      '  BEEHIIV_API_KEY=...\n'
  );
  process.exit(1);
}

async function fetchAllPosts(key) {
  const posts = [];
  let page = 1;

  for (;;) {
    // RSS content, not web content. free_web_content returns a complete
    // themed HTML document — fonts, beehiiv's CSS variables, a byline block,
    // share icons, scripts, inline styles on every element, ~21KB a post.
    // free_rss_content is the same words in semantic tags at a fifth the
    // size, and is what tools/build-blog.mjs normalizes.
    const url =
      `${API}/publications/${PUBLICATION_ID}/posts` +
      `?status=confirmed&limit=100&page=${page}` +
      `&expand[]=free_rss_content`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`beehiiv API ${res.status} ${res.statusText}\n${body.slice(0, 500)}`);
    }

    const json = await res.json();
    posts.push(...(json.data || []));

    const totalPages = json.total_pages ?? 1;
    if (page >= totalPages) break;
    page += 1;
  }

  return posts;
}

/**
 * beehiiv has shipped several shapes for expanded content across v2 point
 * releases, so each candidate is tried rather than assuming one.
 *
 * free_web_content is the *rendered* web HTML, which is not the same markup
 * as the editor's. Depending on the account it can arrive as a bare run of
 * block elements or as a whole themed document. Both are reduced to the
 * body blocks here so tools/build-blog.mjs only ever sees one shape.
 */
function extractContent(post) {
  const c = post.content;
  let html = typeof c === 'string' ? c : c ? c.free?.rss || c.free?.web || c.free?.email || c.web || '' : '';
  if (!html) return '';

  // A full document: keep what is inside <body>.
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (body) html = body[1];

  // beehiiv's web render wraps the piece in a content container and hangs
  // its own header, share bar, and subscribe footer outside it.
  const region = html.match(
    /<div[^>]*(?:id|class)="[^"]*(?:rendered-post|post-content|content-blocks)[^"]*"[^>]*>([\s\S]*)<\/div>/i
  );
  if (region) html = region[1];

  // Drop beehiiv's own "Powered by beehiiv" footer before storing.
  //
  // It carries a cache-busting ?v=<unix timestamp> on the logo URL, and that
  // timestamp changes daily. Kept verbatim it made every post look edited
  // every morning, so the sync committed thirteen unchanged posts and
  // triggered a deploy, every day, forever. The rendered pages never differed
  // because the converter discards this block anyway — which is exactly what
  // made it easy to miss.
  html = html.replace(/<div class=['"]beehiiv__footer['"][\s\S]*?<\/a>\s*<\/div>/g, '');

  return html.trim();
}

function normalize(post) {
  // publish_date is a Unix timestamp in seconds on v2; displayed_date is an
  // ISO string when set. Prefer whichever is present.
  const stamp = post.publish_date ?? post.displayed_date ?? post.created;
  const published =
    typeof stamp === 'number'
      ? new Date(stamp * 1000).toISOString()
      : new Date(stamp).toISOString();

  return {
    id: post.id,
    title: post.title,
    subtitle: post.subtitle || '',
    slug: post.slug,
    status: 'published',
    published_at: published,
    beehiiv_url: post.web_url,
    content: extractContent(post),
  };
}

/* ---------------------------------------------------------------- */

const key = loadKey();

console.log('Fetching published posts from beehiiv...');
const raw = await fetchAllPosts(key);
const now = Date.now();

const normalized = raw.map(normalize);

// `status=confirmed` is not the same as "sent". It covers scheduled posts
// too, whose publish_date is in the future and whose beehiiv page still
// 404s. Publishing one here would put an issue on the site before it
// reaches the people who subscribed to receive it.
const scheduled = normalized.filter((p) => new Date(p.published_at).getTime() > now);
const sent = normalized.filter((p) => new Date(p.published_at).getTime() <= now);

const fresh = sent
  .filter((p) => p.content) // a post with no body would blank an existing page
  .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

for (const p of scheduled) {
  console.log(`  holding "${p.title}" — scheduled for ${p.published_at}, not sent yet`);
}

const missingContent = sent.length - fresh.length;
if (missingContent > 0) {
  console.warn(
    `  warning: ${missingContent} sent post(s) returned no content and were skipped.\n` +
      '  Check that the API key has content permissions.'
  );
}

const existing = existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : [];
const known = new Map(existing.map((p) => [p.id, p]));

const added = fresh.filter((p) => !known.has(p.id));
const changed = fresh.filter((p) => {
  const old = known.get(p.id);
  return old && (old.content !== p.content || old.title !== p.title);
});

console.log(`\n  ${fresh.length} published on beehiiv`);
console.log(`  ${added.length} new, ${changed.length} updated`);
for (const p of added) console.log(`    + ${p.title}`);
for (const p of changed) console.log(`    ~ ${p.title}`);

if (DRY_RUN) {
  console.log('\nDry run: nothing written.');
  process.exit(0);
}

// site_slug is a local override; carry it forward so a hand-chosen URL is
// never silently reverted to beehiiv's generated one.
for (const p of fresh) {
  const old = known.get(p.id);
  if (old?.site_slug) p.site_slug = old.site_slug;
}

writeFileSync(DATA, JSON.stringify(fresh, null, 2) + '\n');
console.log(`\nWrote ${DATA.replace(ROOT + '/', '')}`);

if (ALSO_BUILD) {
  console.log('\nBuilding pages...');
  await import('./build-blog.mjs');
}
