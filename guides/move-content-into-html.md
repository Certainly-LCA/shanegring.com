[← All guides](https://shanegring.com/guides/)

Guide · feeds The Scan

# Your site works in a browser. Machines get a blank page.

Client-side rendering ships a nearly empty document and lets the browser build the page. People never notice. AI engines and many crawlers do. The ten-second check, who it happens to, and the fixes ranked by effort.

There's a way of building websites where the page your buyers
see and the document machines read are two different things —
one finished, one nearly empty. Nobody notices, because in a
browser the site looks perfect. This guide shows you what
client-side rendering is, how to check your site in ten
seconds, and the fixes ranked by effort.

## The two versions of your website

**Every website is a document first.** When a visitor arrives, your
server hands over an HTML file, and everything anyone learns
about your business starts from what's in that file.

Client-side rendering changes the deal. The server hands over **a
nearly empty file** — a shell — plus a load of JavaScript. The
visitor's browser runs the JavaScript, and the JavaScript builds
the page: the words, the offers, the proof, all painted in after
the fact. A person watching the screen sees a finished site. A
machine reading the document as delivered sees the scaffolding
with the lights off.

**Same address, two versions: **the one your buyers see and
the one machines read**.** The whole problem — and the
whole fix — lives in that gap.

## Who this happens to

Not cheap sites. Mostly the opposite. This is the signature of a
modern build: React, Vue, and their frameworks render
client-side unless someone chose otherwise. Some site builders
do it in their app-like modes. Headless setups land here when
the "connect the front end" step got done halfway. The
businesses affected usually paid well for their sites, and the
sites are genuinely good — in a browser.

That's why nobody catches it. The founder checks the site: it
looks right. The designer checks it: it looks right. Every
check happens in a browser, and the browser is the one place
the problem doesn't exist. Like the other failures covered in
[Can AI read your website?](https://shanegring.com/guides/can-ai-read-my-website), this one is invisible from the founder's chair.
It fails silently, and it fails only where you never look.

## Why this matters more now than last year

For years the honest answer was "it mostly works out." Google
runs a rendering step that executes JavaScript, so
client-rendered pages usually make it into search — later than
plain pages, on a budget, but they get there. If Google was the
only machine that mattered, you could live with it.

Google is no longer the only machine that matters. A growing
share of your buyers ask ChatGPT, Claude, or Perplexity the
question they used to type into a search box — and the engines
assembling those answers mostly read the raw HTML and move on.
No rendering step. No second visit. If your words aren't in the
document, you aren't in the answer.

So a client-rendered site can hold its Google rankings and
still be a blank page to the machines your next client asks
first. That's the trap in plain terms: **you can pass
the old test and fail the new one without anything on your
site changing.**

## The ten-second check

Open your site. Right-click, choose **View Page
Source**, and search for a sentence from the middle of
your page — your own words, something specific. If it's there,
your content ships in the document. If it's not — if the source
is a short stub full of script tags — your site is
client-rendered, and machines reading the raw HTML are getting
the empty version.

The technical-minded can do the same from a terminal:
`curl yoursite.com` shows exactly what a machine
receives. And the free [Site Readiness Scan](https://shanegring.com/scan)
checks this among its signals: a page with almost no visible
words and a pile of scripts is the fingerprint of a
client-rendered site, and the scan will say so.

## The fixes, ranked by effort

**1. Flip the switch your framework already has.**
Most client-rendering frameworks can render on the server or
generate plain pages at build time — Next, Nuxt, Astro, and
their peers all do it. For many sites this is a build setting
and a deploy, not a rebuild. Ask whoever runs your site one
question: "do our pages ship their content in the HTML, and
if not, what would server-side rendering take?" The answer
tells you whether this is an afternoon or a project.

**2. Put a prerenderer in front.** Prerendering
services run your JavaScript once, snapshot the finished
page, and hand that snapshot to crawlers. It's a patch, not a
cure — one more moving part, and the snapshots can drift
stale — but it beats being invisible while you plan the real
fix.

**3. Move the pages that earn buyers into plain
HTML.** Often the smartest move is the smallest. Your
homepage, your service pages, your pricing, your guides —
the pages that answer buyer questions — become plain,
fast-loading documents. The app stays an app behind them.
Pages that sell should be documents; software can stay
software.

Whichever path fits, the finish line is the same: **your own
sentences visible in View Source**. Once they are, the cheap
signals start paying — the [headings, titles, and labels that cost nothing](https://shanegring.com/guides/seo-basics-that-cost-nothing) only work on words machines
can actually see.

## When to leave it alone

Some things should be client-rendered. A dashboard behind a
login. A booking tool. A calculator. Software that people
operate — machines don't need to read it, and no buyer decision
rides on a crawler seeing your app's interior. The line is
simple: **anything a stranger should learn about your
business must live in the document; anything a customer
operates can live in the app.** If your marketing
surface is plain and readable, the app behind it can be as
JavaScript-heavy as it wants.

## Find out which version machines get

**The free Site Readiness Scan reads your site the way a
machine does** — the document as delivered, not the page
in a browser. If your content is painted on after, the scan
sees the empty shell and says so, along with what else machines
can and can't read.

[Run the free Scan →](https://shanegring.com/scan)

If the scan confirms the gap and you want the fix ranked
against everything else your site needs, that's
[the Read](https://shanegring.com/read) ($450): a recorded walkthrough and
a memo that puts every fix in effort-versus-impact order. It
credits in full toward the [Map](https://shanegring.com/map) if you keep going.

---

[View this page on shanegring.com](https://shanegring.com/guides/move-content-into-html)
