#!/usr/bin/env node
/**
 * Builds /blog from beehiiv newsletter posts.
 *
 * Source of truth is blog/_data/posts.json. That file is written either by
 * hand or by tools/sync-beehiiv.mjs, which pulls it from the beehiiv API.
 * This script turns it into static pages that match the /guides design, so
 * the newsletter archive lives on shanegring.com rather than on a subdomain
 * and the ranking signal lands on the root domain.
 *
 *   node tools/build-blog.mjs
 *
 * Every page is regenerated from scratch on each run. Do not hand-edit
 * anything in blog/ except _data/posts.json — your edits will be erased.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'blog/_data/posts.json');
const NOTES = resolve(ROOT, 'blog/_data/notes.json');
const OUT = resolve(ROOT, 'blog');

const SITE = 'https://shanegring.com';
const PUB_NAME = 'Seeking Certainty';

/* ------------------------------------------------------------------ *
 * beehiiv markup -> site markup
 * ------------------------------------------------------------------ */

// beehiiv's editor_html carries a lot of editor bookkeeping. None of it
// means anything outside their editor, and some of it (inline font-weight,
// mobile font sizes) actively fights this site's stylesheet.
const NOISE_ATTRS = [
  /\s+xmlns="[^"]*"/g,
  /\s+data-node-hash="[^"]*"/g,
  /\s+data-anchor-[a-z-]+="[^"]*"/g,
  /\s+data-mobile-font-size="[^"]*"/g,
  /\s+data-id="[^"]*"/g,
  /\s+data-variant="[^"]*"/g,
  /\s+data-type="(?:quoteCaption|emoji)"/g,
  /\s+style="font-weight:\s*700;?"/g,
  /\s+class="link"/g,
];

function stripNoise(html) {
  let out = html;
  for (const re of NOISE_ATTRS) out = out.replace(re, '');
  return out;
}

function convert(rawHtml) {
  let h = rawHtml;

  // The publication logo is stamped at the top of every issue as an image
  // block. It is masthead furniture for the email, not part of the piece,
  // and the site already has its own header.
  h = h.replace(/<figure[^>]*data-type="imageBlock"[\s\S]*?<\/figure>/g, '');

  // Pull quotes: beehiiv wraps them in a figure with an always-empty
  // caption. The site's own pull quote is the same figure/blockquote shape
  // under .cs-quote, so this is a class swap and a dropped caption.
  h = h.replace(
    /<figure[^>]*data-type="blockquoteFigure"[^>]*>\s*<blockquote>([\s\S]*?)<\/blockquote>\s*<figcaption[^>]*>\s*<\/figcaption>\s*<\/figure>/g,
    (_m, inner) => `<figure class="cs-quote"><blockquote>${inner}</blockquote></figure>`
  );

  // Emoji spans arrive empty (the glyph lives in beehiiv's renderer), so
  // they would render as stray gaps.
  h = h.replace(/<span[^>]*data-type="emoji"[^>]*>\s*<\/span>/g, '');

  h = stripNoise(h);

  // Bare <span> left over once its only attribute was inline boldness.
  h = h.replace(/<span>([\s\S]*?)<\/span>/g, '$1');

  // beehiiv nests a paragraph inside every list item; the site's list
  // styles expect the text directly.
  h = h.replace(/<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/g, '<li>$1</li>');

  // Headings all become the site's section title, whatever level beehiiv
  // used. Levels were chosen for the email's visual rhythm, not for an
  // outline, and h2 is what /guides uses under the h1.
  h = h.replace(/<h[234]([^>]*)>([\s\S]*?)<\/h[234]>/g, (_m, _attrs, text) => {
    const clean = text.replace(/<\/?strong>/g, '').trim();
    return `<h2 class="cs-section-title">${clean}</h2>`;
  });

  h = h.replace(/<ul>/g, '<ul class="cs-bullets">');
  h = h.replace(/<ol>/g, '<ol class="cs-bullets">');

  // Empty paragraphs are spacers in the email. The stylesheet handles
  // rhythm here.
  h = h.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/g, '');

  // beehiiv marks outbound links nofollow by default, including links to
  // Shane's own properties.
  h = h.replace(/\s+rel="noopener noreferrer nofollow"/g, ' rel="noopener noreferrer"');

  // Each issue opens by greeting the inbox it landed in. On an archive page
  // the reader has arrived by link or search, so the greeting addresses a
  // moment that is not happening.
  h = h.replace(/^\s*<p>(?:Hey|Hi|Hello)\b[^<]{0,40},\s*<\/p>/, '');

  // The sign-off ends with the certainly.coop URL spelled out, which is how
  // you close an email and not how you close a page that already carries
  // the site's footer.
  h = h.replace(
    /(?:<br\s*\/?>)?\s*<a [^>]*href="https:\/\/www\.certainly\.coop\/?"[^>]*>\s*www\.certainly\.coop\s*<\/a>/g,
    ''
  );

  return h.trim();
}

/**
 * A horizontal rule in the newsletter is a beat change. On the site that
 * reads as a new <section>, which is how /guides is structured, so the
 * body is split on <hr> rather than rendering a literal line.
 */
function toSections(bodyHtml) {
  return bodyHtml
    .split(/<hr[^>]*\/?>/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map(
      (chunk) =>
        `  <section class="om-section">\n    <div class="container">\n${indent(chunk)}\n    </div>\n  </section>`
    )
    .join('\n\n');
}

function indent(html) {
  // One block-level tag per line, indented to match the hand-written pages.
  return html
    .replace(/></g, '>\n<')
    .split('\n')
    .map((line) => '      ' + line.trim())
    .filter((line) => line.trim())
    .join('\n');
}

/* ------------------------------------------------------------------ *
 * Text helpers
 * ------------------------------------------------------------------ */

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const stripTags = (s = '') => String(s).replace(/<[^>]*>/g, '');

// Smart quotes and dashes are fine in rendered copy but break JSON-LD and
// meta attributes in ways that are tedious to debug, so metadata gets the
// plain equivalents.
const plain = (s = '') =>
  stripTags(s)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isoDate = (d) => new Date(d).toISOString().slice(0, 10);

const longDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

/**
 * beehiiv slugs are generated from the subject line and some carry a random
 * hash suffix (…-a50d1a7a308fabe2) or an apostrophe split into loose
 * letters (you-re-not-…). Neither belongs in a URL on this site, but the
 * beehiiv slug is still recorded in posts.json so the two can be matched up
 * on the next sync.
 */
function siteSlug(post) {
  if (post.site_slug) return post.site_slug;
  return post.slug
    .replace(/-[0-9a-f]{16}$/, '')
    .replace(/^you-re-/, 'youre-')
    .replace(/-isn-t-/, '-isnt-')
    .replace(/-didn-t-/, '-didnt-')
    .replace(/-don-t-/, '-dont-')
    .replace(/-that-s-/, '-thats-')
    .replace(/-what-s-/, '-whats-')
    .replace(/-we-re-/, '-were-')
    .replace(/-i-m-/, '-im-')
    .replace(/-and-that-s-okay$/, '');
}

/* ------------------------------------------------------------------ *
 * Shared chrome, lifted from the hand-written pages so the blog cannot
 * drift away from the rest of the site.
 * ------------------------------------------------------------------ */

const GTM_HEAD = `<!-- Google Tag Manager: production host only, so local and preview work stays out of GA4 -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];
var h=w.location.hostname;if(h!=='shanegring.com'&&h!=='www.shanegring.com'&&w.location.search.indexOf('gtm_debug')<0)return;
w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WHSTF58T');</script>
<!-- End Google Tag Manager -->`;

const GTM_BODY = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WHSTF58T"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

const ANNOUNCE = `<a class="announce-bar" href="/work-with-me">
  <span class="announce-tag">New</span>
  <span class="announce-text">Nobody owns the digital side of your business.</span>
  <span class="announce-arrow btn-arrow">&rarr;</span>
</a>`;

const NAV = `<nav class="site-nav" aria-label="Site">
  <div class="container">
    <a class="logo" href="/" aria-label="Shane Gring, home"><img class="logo-cloud" src="/images/cloud-1.svg" alt="Shane Gring" width="224" height="80"><img class="logo-bolt" src="/images/cloud-bolt.svg" alt="" width="32" height="48" aria-hidden="true"></a>
    <button class="nav-toggle" aria-label="Menu" aria-expanded="false" onclick="var m=document.getElementById('nav-menu');this.setAttribute('aria-expanded',m.classList.toggle('open'))">&#9776;</button>
    <ul id="nav-menu">
      <li class="nav-drop">
        <a href="/work-with-me">Work with me <span class="nav-caret">&#9662;</span></a>
        <ul class="nav-dropdown nav-mega nav-mega-two">
          <li class="nav-mega-col"><a class="nav-mega-head" href="/work-with-me#help"><span class="nav-drop-text"><span class="nav-drop-name">What do you need someone for?</span><span class="nav-drop-desc">Getting started, through to your whole operation</span></span></a>
            <ul class="nav-mega-list">
              <li><a href="/session"><img class="nav-drop-icon" src="/images/icons/session.png" alt="" width="22" height="22"><span class="nav-drop-text"><span class="nav-drop-name">getting started</span><span class="nav-drop-desc">The Session</span></span></a></li>
              <li><a href="/install"><img class="nav-drop-icon" src="/images/icons/install.png" alt="" width="22" height="22"><span class="nav-drop-text"><span class="nav-drop-name">building your system</span><span class="nav-drop-desc">The Install</span></span></a></li>
              <li><a href="/autopilot"><img class="nav-drop-icon" src="/images/icons/autopilot.png" alt="" width="22" height="22"><span class="nav-drop-text"><span class="nav-drop-name">maintaining your site</span><span class="nav-drop-desc">The Autopilot</span></span></a></li>
              <li><a href="/seat"><img class="nav-drop-icon" src="/images/icons/seat.png" alt="" width="22" height="22"><span class="nav-drop-text"><span class="nav-drop-name">enhancing your operations</span><span class="nav-drop-desc">The Seat</span></span></a></li>
            </ul>
          </li>
          <li class="nav-mega-col"><a class="nav-mega-head" href="/work-with-me#programs"><span class="nav-drop-text"><span class="nav-drop-name">What do you want to walk away with?</span><span class="nav-drop-desc">A score, an opinion, a plan, the build</span></span></a>
            <ul class="nav-mega-list">
              <li><a href="/scan"><img class="nav-drop-icon" src="/images/icons/scan.png" alt="" width="22" height="22"><span class="nav-drop-text"><span class="nav-drop-name">a score</span><span class="nav-drop-desc">The Scan</span></span></a></li>
              <li><a href="/read"><img class="nav-drop-icon" src="/images/icons/read.png" alt="" width="22" height="22"><span class="nav-drop-text"><span class="nav-drop-name">an opinion</span><span class="nav-drop-desc">The Read</span></span></a></li>
              <li><a href="/map"><img class="nav-drop-icon" src="/images/icons/map.png" alt="" width="22" height="22"><span class="nav-drop-text"><span class="nav-drop-name">a plan</span><span class="nav-drop-desc">The Map</span></span></a></li>
              <li><a href="/site"><img class="nav-drop-icon" src="/images/icons/site.png" alt="" width="22" height="22"><span class="nav-drop-text"><span class="nav-drop-name">the thing built</span><span class="nav-drop-desc">The Site</span></span></a></li>
            </ul>
          </li>
          <li class="nav-mega-foot">
            <a href="/work-with-me">All eight, side by side</a>
            <a href="/approach">Why this works</a>
          </li>
        </ul>
      </li>
      <li class="nav-mobile-only"><a href="/approach">Approach</a></li>
      <li><a href="/work/">Recent work</a></li>
      <li><a href="/guides/">Guides</a></li>
      <li><a href="/blog/">Newsletter</a></li>
      <li><a class="nav-cta" href="/scan">Run the free Scan</a></li>
    </ul>
  </div>
</nav>`;

const FOOTER = `<footer>
  <img class="footer-city" src="/images/footer-city.png" alt="" width="2176" height="544" loading="lazy" aria-hidden="true">
  <div class="container">
    <p class="footer-tag">Operations that run beyond you.</p>

    <nav class="footer-nav" aria-label="All pages">
      <div class="footer-col">
        <h2 class="footer-col-title">What do you need someone for?</h2>
        <ul>
          <li><a href="/session">getting started</a></li>
          <li><a href="/install">building your system</a></li>
          <li><a href="/autopilot">maintaining your site</a></li>
          <li><a href="/seat">enhancing your operations</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-col-title">What do you want to walk away with?</h2>
        <ul>
          <li><a href="/scan">a score</a></li>
          <li><a href="/read">an opinion</a></li>
          <li><a href="/map">a plan</a></li>
          <li><a href="/site">the thing built</a></li>
          <li><a href="/work-with-me">All eight, side by side</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-col-title">Recent work</h2>
        <ul>
          <li><a href="/work/">All recent work</a></li>
          <li><a href="/work/iwbi">IWBI</a></li>
          <li><a href="/work/teambuildr">TeamBuildr</a></li>
          <li><a href="/work/seam">SEAM</a></li>
          <li><a href="/work/drvn-golf">DRVN Golf</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-col-title">About</h2>
        <ul>
          <li><a href="/about">About Shane Gring</a></li>
          <li><a href="/approach">The approach</a></li>
          <li><a href="/fractional-coo-rates">Fractional COO rates</a></li>
          <li><a href="/guides/">Guides</a></li>
          <li><a href="/blog/">Newsletter</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/sitemap">Sitemap</a></li>
        </ul>
      </div>
    </nav>

    <div class="footer-content">
      <span>&copy; 2026 Shane Gring</span>
      <span><a href="/about" class="footer-link">About Shane Gring</a></span>
      <span><a href="/contact" class="footer-link">Contact</a></span>
      <span><a href="https://certainly.coop" class="footer-link" target="_blank" rel="noopener noreferrer">Part of Certainly</a></span>
    </div>
  </div>
</footer>

<script src="/nav.js" defer></script>
<script src="/track.js" defer></script>
</body>
</html>`;

const SUBSCRIBE_URL = 'https://seeking-certainty.beehiiv.com/subscribe';

/* ------------------------------------------------------------------ *
 * Framing notes
 *
 * The archive is written for certification leaders, which is not who most
 * of this site is written for. Rather than rewrite what was actually sent,
 * each certification-framed issue carries a note saying who it was for and
 * which part carries over. Notes live in their own file so a sync from
 * beehiiv cannot overwrite them.
 * ------------------------------------------------------------------ */

const notesFile = JSON.parse(readFileSync(NOTES, 'utf8'));
const NOTE_LABEL = notesFile._label;

function note(post) {
  const body = notesFile[post.id];
  if (!body) return '';
  return `
  <section class="om-section">
    <div class="container">
      <aside class="blog-note">
        <span class="blog-note-label">${esc(NOTE_LABEL)}</span>
        <p>${body}</p>
      </aside>
    </div>
  </section>
`;
}

/* ------------------------------------------------------------------ *
 * Page templates
 * ------------------------------------------------------------------ */

function postPage(post, prev, next) {
  const slug = siteSlug(post);
  const url = `${SITE}/blog/${slug}`;
  const title = plain(post.title);
  const desc = plain(post.subtitle) || title;
  const published = isoDate(post.published_at);

  const nav = [];
  if (next) nav.push(`<a href="/blog/${siteSlug(next)}">&larr; ${esc(plain(next.title))}</a>`);
  if (prev) nav.push(`<a href="/blog/${siteSlug(prev)}">${esc(plain(prev.title))} &rarr;</a>`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
${GTM_HEAD}

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} | Shane Gring</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="Shane Gring">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">

<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<meta name="theme-color" content="#ffffff">

<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Shane Gring">
<meta property="og:image" content="${SITE}/og-social.png">
<meta property="article:published_time" content="${published}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/og-social.png">

<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
{"@type":"NewsArticle","@id":"${url}#article","headline":${JSON.stringify(title)},"description":${JSON.stringify(desc)},"author":{"@id":"${SITE}/#person"},"publisher":{"@id":"${SITE}/#person"},"datePublished":"${published}","dateModified":"${published}","mainEntityOfPage":"${url}","image":"${SITE}/og-social.png","isPartOf":{"@type":"Blog","@id":"${SITE}/blog/#blog","name":${JSON.stringify(PUB_NAME)}}},
{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE}/"},{"@type":"ListItem","position":2,"name":"Newsletter","item":"${SITE}/blog/"},{"@type":"ListItem","position":3,"name":${JSON.stringify(title)},"item":"${url}"}]}]}
</script>
</head>

<body>
${GTM_BODY}

<!--
  Generated by tools/build-blog.mjs from blog/_data/posts.json.
  Do not hand-edit: the next build overwrites this file.
  Source issue: ${post.beehiiv_url}
-->

${ANNOUNCE}

${NAV}

<main>
  <article>
  <section class="om-hero">
    <div class="container">
      <a href="/blog/" class="cs-back"><span class="btn-arrow">&larr;</span> All issues</a>

      <span class="section-eyebrow">${esc(PUB_NAME)} &middot; ${longDate(post.published_at)}</span>
      <h1 class="cs-hook">${esc(post.title)}</h1>
${post.subtitle ? `\n      <p class="om-lede">${esc(post.subtitle.trim())}</p>\n` : ''}    </div>
  </section>
${note(post)}

${toSections(convert(post.content))}

  <section class="om-section om-investment">
    <div class="container">
      <h2 class="cs-section-title">Get the next one</h2>

      <p class="guide-cta-line">
        <strong>${esc(PUB_NAME)} goes out every other week</strong> — what
        I'm learning about building certifications, and about the digital
        systems that carry them.
      </p>

      <a class="btn-primary" href="${SUBSCRIBE_URL}" target="_blank" rel="noopener noreferrer">
        Subscribe <span class="btn-arrow">&rarr;</span>
      </a>

      <p>
        Want the same eye on your own site? Start with the
        <a href="/scan">free Scan</a>.
      </p>
    </div>
  </section>
${
  nav.length
    ? `
  <section class="om-section">
    <div class="container">
      <p class="cs-back">${nav.join(' &nbsp;&middot;&nbsp; ')}</p>
    </div>
  </section>
`
    : ''
}  </article>
</main>

${FOOTER}
`;
}

function indexPage(posts) {
  // Same list shape as /guides, minus the thumbnail: newsletter issues have
  // no hero art, and .guide-item already suppresses the bullet.
  const items = posts
    .map((p) => {
      const sub = p.subtitle ? ` ${esc(p.subtitle.trim())}` : '';
      return `        <li class="guide-item">
          <div class="guide-item-text">
            <strong><a href="/blog/${siteSlug(p)}">${esc(p.title)}</a></strong>${sub}
            <span class="cs-quote-status">${longDate(p.published_at)}</span>
          </div>
        </li>`;
    })
    .join('\n');

  const graph = posts
    .map(
      (p) =>
        `{"@type":"NewsArticle","headline":${JSON.stringify(plain(p.title))},"url":"${SITE}/blog/${siteSlug(p)}","datePublished":"${isoDate(p.published_at)}"}`
    )
    .join(',\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
${GTM_HEAD}

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(PUB_NAME)}: the newsletter archive | Shane Gring</title>
<meta name="description" content="Every issue of Seeking Certainty, the every-other-week newsletter on building certifications that hold up and the digital systems that carry them.">
<meta name="author" content="Shane Gring">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE}/blog/">

<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<meta name="theme-color" content="#ffffff">

<meta property="og:type" content="website">
<meta property="og:title" content="${esc(PUB_NAME)}: the newsletter archive">
<meta property="og:description" content="Every issue of Seeking Certainty — on building certifications that hold up, and the digital systems that carry them.">
<meta property="og:url" content="${SITE}/blog/">
<meta property="og:site_name" content="Shane Gring">
<meta property="og:image" content="${SITE}/og-social.png">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(PUB_NAME)} | Shane Gring">
<meta name="twitter:description" content="Every issue of Seeking Certainty — on building certifications that hold up, and the digital systems that carry them.">
<meta name="twitter:image" content="${SITE}/og-social.png">

<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
{"@type":"Blog","@id":"${SITE}/blog/#blog","name":${JSON.stringify(PUB_NAME)},"description":"Every other week on building certifications that hold up, and the digital systems that carry them.","url":"${SITE}/blog/","author":{"@id":"${SITE}/#person"},"publisher":{"@id":"${SITE}/#person"},"blogPost":[
${graph}]},
{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE}/"},{"@type":"ListItem","position":2,"name":"Newsletter","item":"${SITE}/blog/"}]}]}
</script>
</head>

<body>
${GTM_BODY}

<!--
  Generated by tools/build-blog.mjs from blog/_data/posts.json.
  Do not hand-edit: the next build overwrites this file.
-->

${ANNOUNCE}

${NAV}

<main>
  <section class="om-hero">
    <div class="container">
      <span class="section-eyebrow">Newsletter &middot; ${posts.length} issues</span>
      <h1 class="cs-hook">${esc(PUB_NAME)}</h1>

      <p class="om-lede">
        Every other week I write about what it actually takes to build a
        certification that holds up — the standard, the market, and the
        systems underneath it. <strong>Every issue is archived here</strong>,
        in full. And if you don't run a certification, it still reads
        across: a credential is a promise a business has to keep in public,
        in front of several audiences at once, with
        <strong>the website doing most of the work</strong>.
      </p>

      <a class="btn-primary" href="${SUBSCRIBE_URL}" target="_blank" rel="noopener noreferrer">
        Subscribe <span class="btn-arrow">&rarr;</span>
      </a>
    </div>
  </section>

  <section class="om-section">
    <div class="container">
      <ul class="cs-bullets cs-bullets-rich">
${items}
      </ul>
    </div>
  </section>

  <section class="om-section om-investment">
    <div class="container">
      <h2 class="cs-section-title">Looking for the how-to instead?</h2>

      <p class="guide-cta-line">
        The newsletter is what I'm thinking about. <strong>The guides are
        the step-by-step</strong> — AI readability, content layers, service
        pages, schema, crawlers.
      </p>

      <a class="btn-primary" href="/guides/">
        Read the guides <span class="btn-arrow">&rarr;</span>
      </a>
    </div>
  </section>
</main>

${FOOTER}
`;
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

const posts = JSON.parse(readFileSync(DATA, 'utf8'))
  .filter((p) => p.status === 'published')
  .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

mkdirSync(OUT, { recursive: true });

posts.forEach((post, i) => {
  // Newest first, so the "previous" issue is the next one down the list.
  const prev = posts[i + 1] || null;
  const next = posts[i - 1] || null;
  const file = resolve(OUT, `${siteSlug(post)}.html`);
  writeFileSync(file, postPage(post, prev, next));
  console.log(`  /blog/${siteSlug(post)}`);
});

writeFileSync(resolve(OUT, 'index.html'), indexPage(posts));
console.log(`  /blog/`);
console.log(`\n${posts.length} issues built.`);

// Emitted so sitemap.xml can be regenerated without re-deriving slugs.
const urls = posts.map((p) => ({
  loc: `${SITE}/blog/${siteSlug(p)}`,
  lastmod: isoDate(p.published_at),
}));
writeFileSync(resolve(OUT, '_data/urls.json'), JSON.stringify(urls, null, 2));
