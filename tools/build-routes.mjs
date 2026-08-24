#!/usr/bin/env node
/**
 * Generates functions/routes.json — the manifest the 404 + markdown-negotiation
 * middleware reads at the edge.
 *
 *   node tools/build-routes.mjs [--check]
 *
 * Why this exists: the Cloudflare Pages project serves an SPA-style fallback,
 * so any unknown path returns index.html with HTTP 200 (a "soft 404"). Agents
 * probing for resources then conclude every path exists. The middleware turns
 * unknown paths into real 404s, but to do that it needs to know which paths are
 * real. It can't read the filesystem at the edge, so we bake the list here.
 *
 * The manifest mirrors exactly what CI deploys: the git-tracked files (CI checks
 * out from git, so gitignored dirs like docs/ and screenshots/ never ship),
 * minus functions/ (compiled into Workers, not served as assets) and .github/.
 *
 * Output shape:
 *   {
 *     "pages":     { "/about": "/about.md", "/about.html": "/about.md", ... },
 *     "assets":    ["/styles.css", "/images/cloud-1.svg", ...],
 *     "redirects": ["/operating-map", "/find-out", ...]
 *   }
 *
 * `pages` maps every servable HTML-page URL (clean URL, .html URL, and the
 * directory forms for index pages) to its Markdown sibling. `assets` is every
 * other servable file. `redirects` is every source path in _redirects, so the
 * middleware lets those through to Pages rather than 404ing them.
 *
 * Runs in CI before deploy (.github/workflows/deploy.yml), so it can't drift
 * from what actually ships. --check exits non-zero if the committed manifest is
 * stale, without writing.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const OUT = resolve(ROOT, 'functions/routes.json');

// The deploy set: tracked files plus untracked-not-ignored files. That mirrors
// what ships — `actions/checkout` writes tracked files, and `wrangler pages
// deploy .` uploads everything not gitignored — while also picking up new files
// that are about to be committed during a local run.
const tracked = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { cwd: ROOT, encoding: 'utf8' }
)
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

// Not served as static assets: functions/ becomes Workers, .github/ is CI only.
const EXCLUDE = [/^functions\//, /^\.github\//];
const served = tracked.filter((p) => !EXCLUDE.some((re) => re.test(p)));

const pages = {};
const assets = [];

for (const file of served) {
  const url = '/' + file;
  if (file.endsWith('.html')) {
    const md = url.replace(/\.html$/, '.md');
    const isIndex = /(^|\/)index\.html$/.test(file);
    if (isIndex) {
      const dir = url.replace(/index\.html$/, ''); // "/" or "/blog/"
      pages[dir] = md; // "/blog/"
      if (dir.length > 1) pages[dir.replace(/\/$/, '')] = md; // "/blog"
      pages[url] = md; // "/blog/index.html"
    } else {
      pages[url.replace(/\.html$/, '')] = md; // "/about"
      pages[url] = md; // "/about.html"
    }
  } else {
    assets.push(url);
  }
}

// _redirects sources must pass through to Pages so the 301s still fire.
const redirects = [];
const redirectsFile = resolve(ROOT, '_redirects');
if (existsSync(redirectsFile)) {
  for (const line of readFileSync(redirectsFile, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const from = t.split(/\s+/)[0];
    if (from && from.startsWith('/')) redirects.push(from);
  }
}

const manifest = {
  pages: sortKeys(pages),
  assets: [...new Set(assets)].sort(),
  redirects: [...new Set(redirects)].sort(),
};

const json = JSON.stringify(manifest, null, 2) + '\n';

if (CHECK) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (current !== json) {
    console.error('routes.json is stale — run `node tools/build-routes.mjs`');
    process.exit(1);
  }
  console.log('routes.json is up to date');
} else {
  writeFileSync(OUT, json);
  console.log(
    `Wrote ${relative(ROOT, OUT)}: ${Object.keys(manifest.pages).length} page keys, ` +
      `${manifest.assets.length} assets, ${manifest.redirects.length} redirects`
  );
}

function sortKeys(obj) {
  return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
}
