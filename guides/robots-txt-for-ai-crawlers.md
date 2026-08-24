[← All guides](https://shanegring.com/guides/)

Guide · feeds The Scan

# Declare your AI crawl policy. Here are the exact lines.

The exact robots.txt lines to allow or block GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, and Google-Extended — plus a minimal llms.txt. Ten minutes, and your AI crawl policy is stated instead of implied.

Right now your site has an AI crawl policy whether you wrote
one or not — silence just means "whatever each bot decides."
This guide is the ten-minute fix: the exact robots.txt lines
for the AI crawlers that matter, the allow and the block
variants, how to check they took, and the minimal llms.txt
that goes with them. If you're still deciding *whether*
to open or close the door, start with
[the trade behind blocking AI crawlers](https://shanegring.com/guides/should-i-block-ai-crawlers) — this page is for when you've
decided and want it written down.

## Where the file lives, and how the rules work

robots.txt is one plain-text file at the root of your host:
`yoursite.com/robots.txt`. Not in a folder, not
one per page — **one file, at the root, per host** (a
`www` and non-`www` version each read
their own).

The format is blocks. Each block names an agent, then lists
what it may or may not read. A crawler looks for the block
that names it; if none does, it falls back to the
`User-agent: *` block; if there's no file at all,
everything is allowed by default. That default is why most
sites' policy is implied — the bots are reading you because
you never said anything.

Implied and stated are different things. **A stated policy
survives the next developer**, the next replatform, the next
security plugin. An implied one lasts until someone pastes a
template over it.

## The five agents worth naming

**GPTBot** — OpenAI. Feeds model training and
the reading ChatGPT does.

**ClaudeBot** — Anthropic's crawler, the one
that fetches pages.

**anthropic-ai** — Anthropic's training
token. Name both to cover Anthropic fully.

**PerplexityBot** — Perplexity, the answer
engine that cites sources.

**Google-Extended** — not a crawler but a
switch: it controls whether Google may use your content for
AI training and AI features. Blocking it does
*not* touch regular Google search — that's
Googlebot, a different name, and you almost certainly want
it left alone.

## The open door, written down

For most expert-led services businesses — where the site is
marketing for judgment you sell in engagements — the right
policy is **open, on purpose**. Yes, no rule already means
allowed. Writing the allows anyway is the point: the file now
says what you decided, and a future template can't silently
reverse it without someone noticing the difference.

# AI crawlers: allowed, on purpose.
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: *
Allow: /

Sitemap: https://yoursite.com/sitemap.xml

Want the door open but one room private? Rules within a block
stack — disallow the directory, allow the rest:

User-agent: GPTBot
Disallow: /members/
Allow: /

## The closed door, written down

If your content is the product — you sell the words, the
data, the course material — the block looks like this. Note
what's missing: no `User-agent: *` disallow, and
no Googlebot block. You're turning away AI readers, not
leaving search.

# AI crawlers: blocked, on purpose.
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Google-Extended
Disallow: /

One honest caveat, stated once: robots.txt is a convention.
Reputable crawlers honor it; hostile scrapers ignore it. That
doesn't weaken the file — the crawlers that decide your
visibility are the reputable ones — it just means robots.txt
is policy, not security.

## Check it took

Open `yoursite.com/robots.txt` in a browser and
read what's actually there. Not what you uploaded — **what the
server serves**. On site builders (Wix, Squarespace, Webflow,
Shopify) the file is generated from a settings screen, so
edit it there, then check the URL again.

Three things that quietly break the file: it isn't at the
root; the agent name is misspelled (they're case-insensitive,
but `GPT-Bot` matches nothing); or a stray
`Disallow: /` sits under
`User-agent: *` from staging and outranks
everything you just wrote. Crawlers refetch the file on their
own schedule — figure a day before behavior changes.

## The llms.txt that goes with it

robots.txt says who may read. llms.txt says what to read
first — a briefing you write so machines stop assembling one
from scraps. The minimal version is four parts, plain text,
at `yoursite.com/llms.txt`:

# Your Business Name

> One sentence: who you help, and with what.

## Offers
- [The Assessment](https://yoursite.com/assessment) — what it is, $X.
- [The Program](https://yoursite.com/program) — what it is, $Y/month.

## Contact
- Email: you@yourbusiness.com
- Site: https://yoursite.com

Facts, prices, links. No marketing language — machines quote
a briefing better than a brochure. An hour of writing, no
developer, and it compounds with everything else that makes
[your site readable to AI](https://shanegring.com/guides/can-ai-read-my-website): the same telling-instead-of-guessing that
[the free search signals](https://shanegring.com/guides/seo-basics-that-cost-nothing) do page by page.

## Ten minutes, then verify it

**The free Site Readiness Scan checks this exact
thing** — whether your robots.txt names the AI bots,
whether llms.txt exists, whether a leftover disallow is
overruling the policy you just wrote — along with the
structure and content signals machines read.

[Run the free Scan →](https://shanegring.com/scan)

If the doors are open and stated but the answers about your
business still come back wrong, the problem is deeper than
the front door — [the Read](https://shanegring.com/read) ($450) finds
where it lives and ranks the fixes.

---

[View this page on shanegring.com](https://shanegring.com/guides/robots-txt-for-ai-crawlers)
