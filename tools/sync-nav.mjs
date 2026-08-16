#!/usr/bin/env node
/**
 * Rewrites the <nav class="site-nav"> block in every tracked HTML file from
 * the single copy in tools/chrome.mjs.
 *
 *   node tools/sync-nav.mjs
 *   node tools/sync-nav.mjs --dry-run    # list what would change
 *
 * /blog and /notes are generated and pick the nav up from chrome.mjs already.
 * The other ~50 pages are hand-written and each carried its own copy, which
 * is how a site ends up with a link that exists on some pages and not others.
 * This makes a nav change one edit and one command instead of fifty edits.
 *
 * It is deliberately narrow: it replaces the nav element and nothing else,
 * and it refuses to touch a file where the block does not match exactly once.
 * A page with no nav (a bare landing page) is reported and left alone rather
 * than having one inserted at a guessed position.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAV } from './chrome.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DRY_RUN = process.argv.slice(2).includes('--dry-run');

const BLOCK = /<nav class="site-nav"[\s\S]*?<\/nav>/g;

const files = execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT })
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

let changed = 0;
let same = 0;
const skipped = [];

for (const rel of files) {
  const path = resolve(ROOT, rel);
  const html = readFileSync(path, 'utf8');
  const hits = html.match(BLOCK);

  // Zero means the page has no nav; more than one means something about this
  // page is not what this script assumes. Either way, do not guess.
  if (!hits || hits.length !== 1) {
    skipped.push(`${rel} (${hits ? hits.length : 0} nav blocks)`);
    continue;
  }

  if (hits[0] === NAV) {
    same += 1;
    continue;
  }

  if (!DRY_RUN) writeFileSync(path, html.replace(BLOCK, () => NAV));
  console.log(`  ${DRY_RUN ? 'would update' : 'updated'} ${rel}`);
  changed += 1;
}

console.log(
  `\n${changed} ${DRY_RUN ? 'to update' : 'updated'}, ${same} already current` +
    (skipped.length ? `, ${skipped.length} skipped` : '')
);
for (const s of skipped) console.log(`  skipped ${s}`);
