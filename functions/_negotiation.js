// Pure request-routing decisions for the Pages middleware, with no dependency on
// the Cloudflare runtime (no env, fetch, or Response). _middleware.js is a thin
// adapter that turns these decisions into responses; the tests exercise this
// module directly against the real route manifest.
//
// Files prefixed with "_" are excluded from Pages routing but remain importable,
// so this never becomes an endpoint.

// Build the lookup structures once from a routes manifest
// ({ pages, assets, redirects }).
export function prepare(manifest) {
  const pages = manifest.pages || {};
  const known = new Set([
    ...(manifest.assets || []),
    ...(manifest.redirects || []),
    ...Object.keys(pages),
    ...Object.values(pages),
  ]);
  return { pages, known };
}

// Decide what to do with a GET/HEAD-able request.
// Returns one of:
//   { action: 'passthrough' }                     serve normally, untouched
//   { action: 'md-asset' }                         a .md file: force text/markdown
//   { action: 'markdown-page', mdPath }            serve the page's .md sibling
//   { action: 'html-page' }                        serve HTML, add Vary: Accept
//   { action: 'not-acceptable' }                   406
//   { action: 'not-found', pref }                  real 404 (pref: 'markdown'|'html')
export function decide({ path, method = 'GET', accept = '' }, ctx) {
  const { pages, known } = ctx;

  if (path.startsWith('/api/') || (method !== 'GET' && method !== 'HEAD')) {
    return { action: 'passthrough' };
  }

  const mdPath = pageMarkdown(path, pages);
  const isPage = mdPath !== null;
  const isKnown = isPage || known.has(path) || known.has(stripSlash(path));

  if (path.endsWith('.md') && isKnown) {
    return { action: 'md-asset' };
  }

  const pref = negotiate(accept);

  if (isPage) {
    if (pref === 'markdown') return { action: 'markdown-page', mdPath };
    if (pref === 'none') return { action: 'not-acceptable' };
    return { action: 'html-page' };
  }

  if (!isKnown) {
    const wantsMd = pref === 'markdown' || !acceptsHtmlPage(accept);
    return { action: 'not-found', pref: wantsMd ? 'markdown' : 'html' };
  }

  return { action: 'passthrough' };
}

// Resolve a request path to its Markdown sibling, tolerating a trailing slash.
export function pageMarkdown(path, pages) {
  if (path in pages) return pages[path];
  const alt = stripSlash(path);
  if (alt !== path && alt in pages) return pages[alt];
  const withSlash = path.endsWith('/') ? path : path + '/';
  if (withSlash in pages) return pages[withSlash];
  return null;
}

export function stripSlash(p) {
  return p.length > 1 && p.endsWith('/') ? p.replace(/\/+$/, '') : p;
}

// Decide the preferred representation for a page request.
//   'markdown' — client explicitly asked for Markdown at >= HTML quality
//   'none'     — client accepts neither HTML nor Markdown nor a wildcard
//   'html'     — default
export function negotiate(accept) {
  if (!accept || !accept.trim()) return 'html';
  const ranges = accept.split(',').map(parseRange).filter(Boolean);
  if (!ranges.length) return 'html';

  const htmlQ = qFor(ranges, 'text/html');
  const mdQ = qFor(ranges, 'text/markdown');
  const mdExact = ranges.some(
    (r) => (r.type === 'text/markdown' || r.type === 'text/x-markdown') && r.q > 0
  );

  if (mdExact && mdQ >= htmlQ) return 'markdown';
  if (htmlQ === 0 && mdQ === 0) return 'none';
  return 'html';
}

// True when the client explicitly lists an HTML-bearing range (text/html or
// text/*), as browsers do — but not for a bare `*/*`, which agents send.
export function acceptsHtmlPage(accept) {
  if (!accept || !accept.trim()) return false;
  return accept
    .split(',')
    .map(parseRange)
    .filter(Boolean)
    .some((r) => (r.type === 'text/html' || r.type === 'text/*') && r.q > 0);
}

export function parseRange(part) {
  const bits = part.trim().split(';');
  const type = bits[0].trim().toLowerCase();
  if (!type) return null;
  let q = 1;
  for (const p of bits.slice(1)) {
    const m = p.trim().match(/^q=([0-9.]+)$/i);
    if (m) q = parseFloat(m[1]);
  }
  if (!Number.isFinite(q)) q = 0;
  return { type, q };
}

export function qFor(ranges, target) {
  const [tt] = target.split('/');
  let q = 0;
  for (const r of ranges) {
    if (r.type === '*/*' || r.type === target || r.type === `${tt}/*`) {
      q = Math.max(q, r.q);
    }
  }
  return q;
}
