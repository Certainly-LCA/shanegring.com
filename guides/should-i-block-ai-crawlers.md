[← All guides](https://shanegring.com/guides/)

Guide · feeds The Scan

# Should you block AI crawlers? Here's the actual trade.

Blocking AI crawlers is a real decision with a real trade. Who should block, who shouldn't, what robots.txt actually controls, and what llms.txt gives the machines you let in.

You've seen the advice going both ways: block the bots, they're
stealing your work — or open everything, AI is the new front
door. Both are right, for different businesses. This guide lays
out the trade honestly, shows you what robots.txt and llms.txt
actually control, and helps you make the call on purpose
instead of by accident.

## The trade, stated plainly

AI engines read websites for two reasons: to train models, and
to answer questions in real time. When someone asks ChatGPT or
Perplexity "who helps businesses like mine with X," the answer
is assembled from sites the engines were allowed to read.

So the decision hangs on one question: **is your content
the product, or is it marketing for the product?**

If the content is the product — you sell subscriptions to your
writing, your data, your course material — letting AI engines
ingest and paraphrase it can genuinely cannibalize what people
pay you for. Publishers who block have a real case.

If the content is marketing for expertise you sell as services,
the math flips completely. An AI engine reading your site is
**briefing your next buyer**. Blocking it doesn't protect anything —
your "secret" is judgment applied in engagements, not the words
on your site — it just removes you from answers your
competitors stay in. For an expert-led services business,
blocking AI crawlers is unilateral disarmament.

## What robots.txt actually controls

robots.txt is a plain-text file at yoursite.com/robots.txt that
tells crawlers what they may read. It's a convention, not a
lock — reputable crawlers honor it, hostile ones ignore it —
but the crawlers that matter for visibility are the reputable
ones, so it's where the policy lives.

The AI agents worth knowing by name: **GPTBot**
(OpenAI), **ClaudeBot** and
**anthropic-ai** (Anthropic),
**PerplexityBot**, and
**Google-Extended** — that last one controls
whether Google may use your content in AI training and
AI-powered features, separately from regular search indexing.
Each can be allowed or disallowed individually, which means the
policy can be surgical: let answer engines read everything,
keep specific directories private, whatever matches your
actual position.

The point isn't a particular recipe. It's that **this file is a
decision**, and someone should have made it on purpose. When
you've made yours,
[the exact lines to write are here](https://shanegring.com/guides/robots-txt-for-ai-crawlers).

## The accidental block

Here's what the scan data behind this site keeps finding: most
businesses that block AI crawlers **never decided to**. The block
arrived by accident, in one of three vehicles:

**A copied robots.txt.** A template from a
developer's last project, a "best practices" blocklist from a
2023 blog post, pasted and forgotten. The business is
invisible to AI engines by its own instruction, and nobody
remembers writing it.

**A security plugin's defaults.** Bot-protection
tools that ship with "block AI scrapers" toggled on, sold as
protection, functioning as a gag order.

**A blanket disallow left over from staging.**
The `Disallow: /` that kept the unfinished site
out of Google in build week, still there three years later.

The check takes one minute: open yoursite.com/robots.txt and
read what it says. If GPTBot, ClaudeBot, or a blanket disallow
appears and you didn't put it there deliberately, you've found
money on the floor.

## llms.txt: writing the machine's briefing yourself

robots.txt decides *whether* machines read you. llms.txt
decides *what they read first*. It's a plain-text file
at yoursite.com/llms.txt that gives AI systems a clean, current
summary of the business: who you are, what you sell, what it
costs, who it's for, where to read more.

Without one, an AI engine assembles its briefing from whatever
it can piece together across your pages — plus whatever the
rest of the internet says about you, current or not. With one,
you wrote the briefing. Every fact is yours, dated, and linked
to its source page.

What belongs in it: the one-paragraph description of the
business you wish every answer engine used. Your offers with
prices and links. Who you serve. How to reach you. What doesn't
belong: marketing language. It's a briefing document, not a
brochure — machines quote it best when it reads like facts.

If you allow AI crawlers at all, this file is the cheapest
visibility improvement available. It's an hour of writing, it
requires no developer, and it compounds with everything else —
structure, schema, content — that makes
[your site readable to AI](https://shanegring.com/guides/can-ai-read-my-website) in the first place. (Schema does the same telling-vs-guessing
work inside each page — covered in
[schema for service businesses](https://shanegring.com/guides/schema-for-services).)

## Make it a policy, not an accident

The end state is small and boring, which is what good
infrastructure looks like: a robots.txt that says what you
decided, an llms.txt that says what you'd want repeated, and a
calendar note to re-read both when the business changes. Ten
lines of plain text, holding the front door.

The businesses that get this wrong aren't careless. The files
are just invisible from the founder's chair — the site looks
identical in a browser either way. That's exactly why it
belongs on a checklist a machine runs, not a memory a human
keeps.

## Check your doors in two minutes

**The free Site Readiness Scan checks this exact
thing** — whether robots.txt names AI bots, whether
llms.txt exists, whether a blanket disallow is hiding you —
along with the structure and content signals machines read.

[Run the free Scan →](https://shanegring.com/scan)

If the doors are open but the answers about your business are
still wrong, that's a legibility problem —
[the Read](https://shanegring.com/read) ($450) finds where it lives and
ranks the fixes.

---

[View this page on shanegring.com](https://shanegring.com/guides/should-i-block-ai-crawlers)
