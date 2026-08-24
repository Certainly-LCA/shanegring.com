#!/usr/bin/env node
/**
 * Generates a Markdown sibling (foo.md) for every content page (foo.html), so
 * the middleware can answer `Accept: text/markdown` with clean, readable
 * Markdown of the page's <main> content — the acceptmarkdown.com convention.
 *
 *   node tools/build-markdown.mjs [--check]
 *
 * The site is hand-authored HTML with a consistent shell (nav + <main> + footer)
 * and a small, predictable vocabulary of tags. That lets a dependency-free
 * converter produce good Markdown without pulling a DOM library into CI: we take
 * the <main>, drop scripts/styles/SVG/forms/images, and map headings, lists,
 * links, and emphasis to Markdown. Decorative wrappers collapse to their text,
 * which is exactly what an agent wants. The converter itself lives in
 * tools/html-to-markdown.mjs so it can be unit-tested in isolation.
 *
 * Runs in CI before deploy alongside build-routes. --check exits non-zero if any
 * committed .md is stale, without writing.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlToMarkdown } from './html-to-markdown.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const htmlFiles = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '--', '*.html'],
  { cwd: ROOT, encoding: 'utf8' }
)
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)
  .filter((p) => !/^(functions|\.github)\//.test(p));

let stale = 0;
let wrote = 0;

for (const file of htmlFiles) {
  const html = readFileSync(resolve(ROOT, file), 'utf8');
  const md = htmlToMarkdown(html, file);
  const outRel = file.replace(/\.html$/, '.md');
  const outAbs = resolve(ROOT, outRel);
  const current = existsSync(outAbs) ? readFileSync(outAbs, 'utf8') : '';
  if (current === md) continue;
  if (CHECK) {
    console.error(`stale: ${outRel}`);
    stale++;
  } else {
    writeFileSync(outAbs, md);
    wrote++;
  }
}

if (CHECK) {
  if (stale) {
    console.error(`${stale} markdown file(s) stale — run \`node tools/build-markdown.mjs\``);
    process.exit(1);
  }
  console.log(`markdown up to date (${htmlFiles.length} pages)`);
} else {
  console.log(`Wrote ${wrote} markdown file(s) from ${htmlFiles.length} pages`);
}
