#!/usr/bin/env node
/**
 * Builds /notes from the LinkedIn posts in notes/_data/posts.json, and
 * refreshes the "Lately" strip on the homepage.
 *
 *   node tools/build-notes.mjs
 *
 * Source of truth is Ordinal, which is where these are written and scheduled
 * from. Reading them there rather than from LinkedIn matters: LinkedIn has no
 * public API for your own posts and no feed, and scraping it breaks their
 * terms. Ordinal has the copy, the dates, the labels and the images, and it
 * is Shane's own account.
 *
 * The whole archive is one page rather than a page per post. At a weekday
 * cadence that is ~250 posts a year; as individual URLs that is 250 thin
 * pages competing with the guides and the newsletter for the same attention.
 * As one page it reads the way a feed is meant to be read.
 *
 * Ordinal does not store the LinkedIn permalink, so individual posts cannot
 * link back to the original — only the profile can.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GTM_HEAD, GTM_BODY, ANNOUNCE, NAV, footerHtml, subscribeForm, esc,
} from './chrome.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'notes/_data/posts.json');
const OUT = resolve(ROOT, 'notes');
const SITE = 'https://shanegring.com';
const LINKEDIN = 'https://www.linkedin.com/in/shanegring/';

const posts = JSON.parse(readFileSync(DATA, 'utf8')).sort((a, b) =>
  b.date === a.date ? 0 : b.date < a.date ? -1 : 1
);

const longDate = (d) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });

const shortDate = (d) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  });

/**
 * A LinkedIn post is plain text with blank lines between paragraphs. Turning
 * that into markup means paragraphs, and nothing else — no headings to infer,
 * no lists to guess at. Bare URLs are linked, because Shane writes them as
 * shanegring.com/guides/x rather than as anchors, and an unlinked link on a
 * web page is just friction.
 */
function toParagraphs(copy) {
  return copy
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const html = esc(block)
        .replace(/\n/g, '<br>')
        // Match bare domains as well as full URLs; anchor on shanegring.com so
        // a stray sentence containing a full stop is not turned into a link.
        .replace(
          /\b((?:https?:\/\/)?shanegring\.com\/[^\s<),]*)/g,
          (m) => `<a href="${m.startsWith('http') ? m : 'https://' + m}">${m}</a>`
        );
      return `        <p>${html}</p>`;
    })
    .join('\n');
}

function noteArticle(p) {
  const art = p.images
    .map(
      (i) =>
        `        <img class="note-art" src="/images/notes/${i.asset}.jpg" alt="" width="${i.w}" height="${i.h}" loading="lazy">`
    )
    .join('\n');

  const labels = p.labels.length
    ? `\n        <p class="note-labels">${p.labels.map((l) => `<span>${esc(l)}</span>`).join('')}</p>`
    : '';

  return `      <article class="note" id="${p.id.slice(0, 8)}">
        <p class="note-date"><time datetime="${p.date}">${longDate(p.date)}</time></p>
        <h2 class="note-title">${esc(p.title)}</h2>
${toParagraphs(p.copy)}
${art}${labels}
      </article>`;
}

/* ------------------------------------------------------------------ *
 * The page
 * ------------------------------------------------------------------ */

const graph = posts
  .slice(0, 20)
  .map(
    (p) =>
      `{"@type":"SocialMediaPosting","headline":${JSON.stringify(p.title)},"datePublished":"${p.date}","author":{"@id":"${SITE}/#person"},"url":"${SITE}/notes/#${p.id.slice(0, 8)}"}`
  )
  .join(',\n');

const page = `<!DOCTYPE html>
<html lang="en">
<head>
${GTM_HEAD}

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Notes: what I'm posting most weekdays | Shane Gring</title>
<meta name="description" content="Short notes on running and rebuilding businesses — websites as operations, getting the founder's judgment out of their head, and what I keep seeing inside expert-led companies. Posted most weekdays.">
<meta name="author" content="Shane Gring">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE}/notes/">

<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<meta name="theme-color" content="#ffffff">

<meta property="og:type" content="website">
<meta property="og:title" content="Notes: what I'm posting most weekdays">
<meta property="og:description" content="Short notes on running and rebuilding businesses, posted most weekdays.">
<meta property="og:url" content="${SITE}/notes/">
<meta property="og:site_name" content="Shane Gring">
<meta property="og:image" content="${SITE}/og-social.png">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Notes | Shane Gring">
<meta name="twitter:description" content="Short notes on running and rebuilding businesses, posted most weekdays.">
<meta name="twitter:image" content="${SITE}/og-social.png">

<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
{"@type":"CollectionPage","@id":"${SITE}/notes/#page","name":"Notes","description":"Short notes on running and rebuilding businesses, posted most weekdays.","url":"${SITE}/notes/","author":{"@id":"${SITE}/#person"},"hasPart":[
${graph}]},
{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE}/"},{"@type":"ListItem","position":2,"name":"Notes","item":"${SITE}/notes/"}]}]}
</script>
</head>

<body>
${GTM_BODY}

<!--
  Generated by tools/build-notes.mjs from notes/_data/posts.json.
  Do not hand-edit: the next build overwrites this file.
-->

${ANNOUNCE}

${NAV}

<main>
  <section class="om-hero">
    <div class="container">
      <span class="section-eyebrow">Notes &middot; ${posts.length} of them</span>
      <h1 class="cs-hook">What I'm working through, most weekdays.</h1>

      <p class="om-lede">
        Short pieces I post as I go — what I'm seeing inside expert-led
        businesses, what broke, what I'd do differently.
        <strong>The guides are the worked answers; these are the thinking
        on the way there.</strong> Also on
        <a href="${LINKEDIN}" target="_blank" rel="noopener noreferrer">LinkedIn</a>,
        which is where they start.
      </p>
    </div>
  </section>

  <section class="om-section">
    <div class="container notes-list">
${posts.map(noteArticle).join('\n\n')}
    </div>
  </section>

  <section class="om-section om-investment">
    <div class="container">
      <h2 class="cs-section-title">These usually start as something I ran into</h2>

      <p class="guide-cta-line">
        If one of them sounds like your week, <strong>the Scan is the fastest
        way to get a read on where you stand</strong> — free, about half a
        minute.
      </p>

      <a class="btn-primary" href="/scan">
        Run the free Scan <span class="btn-arrow">&rarr;</span>
      </a>
    </div>
  </section>
</main>

${footerHtml()}
`;

mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'index.html'), page);
console.log(`  /notes/  (${posts.length} notes)`);

/* ------------------------------------------------------------------ *
 * Homepage strip
 *
 * Replaces whatever sits between the two marker comments on the homepage,
 * so the strip is regenerated rather than maintained by hand. If the
 * markers are missing the homepage is left alone and this says so, rather
 * than guessing where the block belongs.
 * ------------------------------------------------------------------ */

const HOME = resolve(ROOT, 'index.html');
const START = '<!-- notes:start -->';
const END = '<!-- notes:end -->';

if (existsSync(HOME)) {
  const home = readFileSync(HOME, 'utf8');
  if (!home.includes(START) || !home.includes(END)) {
    console.log('  index.html: no notes markers found, homepage left alone');
  } else {
    const strip = posts
      .slice(0, 3)
      .map(
        (p) => `        <li>
          <a href="/notes/#${p.id.slice(0, 8)}">
            <span class="home-note-date">${shortDate(p.date)}</span>
            <span class="home-note-title">${esc(p.title)}</span>
          </a>
        </li>`
      )
      .join('\n');

    // The homepage has its own section conventions (section-title, fade-in)
    // rather than the om- classes the generated sections use.
    const block = `${START}
<section class="home-notes fade-in">
  <div class="container">
    <span class="section-eyebrow">Lately</span>
    <h2 class="section-title">Notes from the work.</h2>
    <ul class="home-note-list">
${strip}
    </ul>
    <a class="cs-back" href="/notes/">All notes <span class="btn-arrow">&rarr;</span></a>
  </div>
</section>
${END}`;

    const next = home.replace(
      new RegExp(`${START}[\\s\\S]*?${END}`),
      () => block
    );
    writeFileSync(HOME, next);
    console.log('  index.html: Lately strip refreshed');
  }
}
