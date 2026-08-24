// Tests for the HTML -> Markdown converter (tools/html-to-markdown.mjs),
// run with `node --test`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { htmlToMarkdown } from '../tools/html-to-markdown.mjs';

const page = (main, { title = 'T | Shane Gring', description = 'Desc.' } = {}) => `
<!DOCTYPE html><html><head>
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="https://shanegring.com/x">
</head><body>
<nav>NAV JUNK</nav>
<main>${main}</main>
<footer>FOOTER JUNK</footer>
</body></html>`;

test('drops nav/footer and keeps only <main>', () => {
  const md = htmlToMarkdown(page('<h1>Hello</h1><p>Body.</p>'));
  assert.ok(!md.includes('NAV JUNK'));
  assert.ok(!md.includes('FOOTER JUNK'));
  assert.ok(md.includes('# Hello'));
  assert.ok(md.includes('Body.'));
});

test('uses the in-page H1 as title (exactly one H1) and inserts the description', () => {
  const md = htmlToMarkdown(page('<h1>Real Title</h1><p>Body.</p>'));
  const h1s = md.split('\n').filter((l) => /^#\s/.test(l));
  assert.equal(h1s.length, 1);
  assert.equal(h1s[0], '# Real Title');
  assert.ok(md.indexOf('Desc.') > md.indexOf('# Real Title'));
});

test('falls back to <title> when <main> has no H1', () => {
  const md = htmlToMarkdown(page('<p>Just a paragraph.</p>', { title: 'Fallback | X' }));
  assert.ok(md.startsWith('# Fallback | X'));
});

test('converts headings, lists, emphasis, and code', () => {
  const md = htmlToMarkdown(
    page('<h1>H</h1><h2>Section</h2><ul><li>one</li><li>two</li></ul><p><strong>b</strong> and <em>i</em> and <code>c</code></p>')
  );
  assert.ok(md.includes('## Section'));
  assert.ok(md.includes('- one'));
  assert.ok(md.includes('- two'));
  assert.ok(md.includes('**b**'));
  assert.ok(md.includes('*i*'));
  assert.ok(md.includes('`c`'));
});

test('absolutizes root-relative links and keeps external ones', () => {
  const md = htmlToMarkdown(
    page('<h1>H</h1><p><a href="/map">Map</a> and <a href="https://x.com/a">Ext</a></p>')
  );
  assert.ok(md.includes('[Map](https://shanegring.com/map)'));
  assert.ok(md.includes('[Ext](https://x.com/a)'));
});

test('collapses a fragment-only or empty link to plain text', () => {
  const md = htmlToMarkdown(page('<h1>H</h1><p><a href="#book">book a call</a></p>'));
  assert.ok(md.includes('book a call'));
  assert.ok(!md.includes('](#book)'));
});

test('strips scripts, styles, svg, images, and form controls', () => {
  const md = htmlToMarkdown(
    page('<h1>H</h1><script>alert(1)</script><style>.a{}</style><svg><path/></svg><img src="x.png"><form><input name="a"><button>Send</button></form><p>Kept.</p>')
  );
  assert.ok(!/alert|\.a\{|<path|x\.png|Send/.test(md));
  assert.ok(md.includes('Kept.'));
});

test('decodes HTML entities', () => {
  const md = htmlToMarkdown(page('<h1>H</h1><p>Tom &amp; Jerry &mdash; 90&deg; &rarr; done &#39;ok&#39;</p>'));
  assert.ok(md.includes('Tom & Jerry — 90° → done \'ok\''));
});

test('always ends with a canonical source link', () => {
  const md = htmlToMarkdown(page('<h1>H</h1><p>x</p>'));
  assert.ok(md.trimEnd().endsWith('[View this page on shanegring.com](https://shanegring.com/x)'));
});
