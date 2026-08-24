// Dependency-free HTML -> Markdown converter for the site's hand-authored pages.
// Extracted so both build-markdown.mjs and the tests can use it. See
// build-markdown.mjs for why a bespoke converter (rather than a DOM library) is
// the right call here.

const ORIGIN = 'https://shanegring.com';

// HTML entities that appear in the hand-authored pages.
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®',
  trade: '™', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”',
  ldquo: '“', rarr: '→', larr: '←', times: '×', deg: '°', eacute: 'é', middot: '·',
  bull: '•', prime: '′', Prime: '″', frac12: '½', frac14: '¼', frac34: '¾',
};

export function htmlToMarkdown(html, file = '') {
  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim());
  const description = decode(
    (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || '').trim()
  );
  const canonical =
    html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i)?.[1] || urlForFile(file);

  let main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';

  // Strip elements whose content should never reach Markdown, content and all.
  main = main
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<template[\s\S]*?<\/template>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<form[^>]*>/gi, '')
    .replace(/<\/form>/gi, '')
    .replace(/<(button|textarea|select|label)[\s\S]*?<\/\1>/gi, '')
    .replace(/<input[^>]*>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<(picture|source)[^>]*>/gi, '');

  // Links first, while their inner markup is still intact.
  main = main.replace(/<a\b[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, inner) => {
    const text = stripTags(inner).replace(/\s+/g, ' ').trim();
    if (!text) return '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return text;
    return `[${text}](${absolutize(href)})`;
  });

  // Headings.
  for (let n = 6; n >= 1; n--) {
    main = main
      .replace(new RegExp(`<h${n}[^>]*>`, 'gi'), `\n\n${'#'.repeat(n)} `)
      .replace(new RegExp(`</h${n}>`, 'gi'), '\n\n');
  }

  // Emphasis and inline code.
  main = main
    .replace(/<(strong|b)\b[^>]*>/gi, '**')
    .replace(/<\/(strong|b)>/gi, '**')
    .replace(/<(em|i)\b[^>]*>/gi, '*')
    .replace(/<\/(em|i)>/gi, '*')
    .replace(/<code\b[^>]*>/gi, '`')
    .replace(/<\/code>/gi, '`');

  // Lists.
  main = main.replace(/<li[^>]*>/gi, '\n- ').replace(/<\/li>/gi, '');

  // Block breaks.
  main = main
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/(p|div|section|ul|ol|blockquote|figure|figcaption|header|article|aside|details|summary)>/gi, '\n\n');

  // Everything else is a wrapper; keep its text.
  main = decode(stripTags(main));

  // Whitespace normalisation.
  let body = main
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/^-$/gm, '') // empty bullets
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Prefer the page's own H1 as the document title so the Markdown has exactly
  // one — stacking the <title> on top of the in-page H1 would give two.
  const h1 = body.match(/^#\s+(.+)$/m);
  let out;
  if (h1) {
    if (description) body = body.replace(/^(#\s+.+)$/m, `$1\n\n${description}`);
    out = body;
  } else {
    const parts = [`# ${title}`];
    if (description) parts.push(description);
    if (body) parts.push(body);
    out = parts.join('\n\n');
  }
  out += `\n\n---\n\n[View this page on shanegring.com](${canonical})\n`;
  return out;
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '');
}

function absolutize(href) {
  if (/^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }
  if (href.startsWith('/')) return ORIGIN + href;
  return href;
}

function urlForFile(file) {
  let u = '/' + file.replace(/\.html$/, '');
  u = u.replace(/\/index$/, '/');
  return ORIGIN + (u === ORIGIN ? '/' : u);
}

function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&([a-z0-9]+);/gi, (m, name) => (name in NAMED ? NAMED[name] : m));
}

function safeCodePoint(cp) {
  try {
    return String.fromCodePoint(cp);
  } catch {
    return '';
  }
}
