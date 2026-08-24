// Tests for the middleware's routing decisions (functions/_negotiation.js),
// run with `node --test`. Exercised against the real route manifest so the
// assertions track what actually ships.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  prepare,
  decide,
  negotiate,
  acceptsHtmlPage,
  pageMarkdown,
  stripSlash,
} from '../functions/_negotiation.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'functions/routes.json'), 'utf8'));
const ctx = prepare(manifest);

const d = (input) => decide({ method: 'GET', accept: '', ...input }, ctx);

test('negotiate() prefers markdown only when explicitly asked at >= html quality', () => {
  assert.equal(negotiate(''), 'html');
  assert.equal(negotiate('*/*'), 'html');
  assert.equal(negotiate('text/html'), 'html');
  assert.equal(negotiate('text/markdown'), 'markdown');
  assert.equal(negotiate('text/x-markdown'), 'markdown');
  assert.equal(negotiate('text/markdown, text/html;q=0.9'), 'markdown');
  assert.equal(negotiate('text/html, text/markdown;q=0.9'), 'html');
  assert.equal(negotiate('text/markdown;q=0'), 'none'); // refuses md, offers nothing else
  assert.equal(negotiate('text/markdown;q=0, text/html'), 'html'); // q=0 means "not markdown"
  assert.equal(negotiate('application/json'), 'none');
  assert.equal(negotiate('text/html,application/xhtml+xml,*/*;q=0.8'), 'html');
});

test('acceptsHtmlPage() is true for browsers, false for bare wildcard/agents', () => {
  assert.equal(acceptsHtmlPage('text/html,application/xhtml+xml,*/*;q=0.8'), true);
  assert.equal(acceptsHtmlPage('text/*'), true);
  assert.equal(acceptsHtmlPage('*/*'), false);
  assert.equal(acceptsHtmlPage('text/markdown'), false);
  assert.equal(acceptsHtmlPage(''), false);
});

test('stripSlash() trims a trailing slash except on root', () => {
  assert.equal(stripSlash('/'), '/');
  assert.equal(stripSlash('/blog/'), '/blog');
  assert.equal(stripSlash('/blog'), '/blog');
});

test('pageMarkdown() resolves clean, .html, and directory forms', () => {
  assert.equal(pageMarkdown('/about', ctx.pages), '/about.md');
  assert.equal(pageMarkdown('/about.html', ctx.pages), '/about.md');
  assert.equal(pageMarkdown('/', ctx.pages), '/index.md');
  assert.equal(pageMarkdown('/blog/', ctx.pages), '/blog/index.md');
  assert.equal(pageMarkdown('/blog', ctx.pages), '/blog/index.md');
  assert.equal(pageMarkdown('/nope', ctx.pages), null);
});

test('unknown path -> real 404, markdown body for agents, html for browsers', () => {
  assert.deepEqual(d({ path: '/does-not-exist', accept: '*/*' }), {
    action: 'not-found',
    pref: 'markdown',
  });
  assert.deepEqual(d({ path: '/does-not-exist', accept: '' }), {
    action: 'not-found',
    pref: 'markdown',
  });
  assert.deepEqual(
    d({ path: '/does-not-exist', accept: 'text/html,*/*;q=0.8' }),
    { action: 'not-found', pref: 'html' }
  );
  // The soft-404 vectors from the audit must all 404 now.
  assert.equal(d({ path: '/nope.png', accept: '*/*' }).action, 'not-found');
  assert.equal(d({ path: '/blog/missing-post', accept: '*/*' }).action, 'not-found');
  assert.equal(d({ path: '/privacy-policy', accept: '*/*' }).action, 'not-found');
});

test('known page serves html and opts the cache into Accept', () => {
  assert.deepEqual(d({ path: '/about', accept: 'text/html' }), { action: 'html-page' });
  assert.deepEqual(d({ path: '/', accept: '*/*' }), { action: 'html-page' });
  assert.deepEqual(d({ path: '/work-with-me', accept: 'text/html' }), { action: 'html-page' });
});

test('known page + Accept: text/markdown serves the .md sibling', () => {
  assert.deepEqual(d({ path: '/about', accept: 'text/markdown' }), {
    action: 'markdown-page',
    mdPath: '/about.md',
  });
  assert.deepEqual(d({ path: '/', accept: 'text/markdown' }), {
    action: 'markdown-page',
    mdPath: '/index.md',
  });
  assert.deepEqual(d({ path: '/guides/', accept: 'text/markdown' }), {
    action: 'markdown-page',
    mdPath: '/guides/index.md',
  });
});

test('page requested as an unsupported type -> 406', () => {
  assert.deepEqual(d({ path: '/about', accept: 'application/json' }), {
    action: 'not-acceptable',
  });
});

test('assets, redirects, api, .md, and writes pass through', () => {
  assert.equal(d({ path: '/styles.css', accept: '*/*' }).action, 'passthrough');
  assert.equal(d({ path: '/robots.txt', accept: '*/*' }).action, 'passthrough');
  assert.equal(d({ path: '/sitemap.xml', accept: '*/*' }).action, 'passthrough');
  assert.equal(d({ path: '/operating-map', accept: '*/*' }).action, 'passthrough'); // _redirects
  assert.equal(d({ path: '/api/scan', accept: '*/*' }).action, 'passthrough');
  assert.equal(
    decide({ path: '/about', method: 'POST', accept: 'text/markdown' }, ctx).action,
    'passthrough'
  );
});

test('a real .md file forces the correct content type', () => {
  assert.equal(d({ path: '/about.md', accept: '*/*' }).action, 'md-asset');
  assert.equal(d({ path: '/index.md', accept: 'text/markdown' }).action, 'md-asset');
});

test('every page key in the manifest resolves to a generated .md', () => {
  for (const [pagePath, md] of Object.entries(manifest.pages)) {
    assert.equal(pageMarkdown(pagePath, ctx.pages), md, `page ${pagePath}`);
    assert.ok(ctx.known.has(md), `missing md asset for ${pagePath}`);
  }
});
