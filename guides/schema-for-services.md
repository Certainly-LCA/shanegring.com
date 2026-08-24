[← All guides](https://shanegring.com/guides/)

Guide · feeds The Scan

# Schema markup for service businesses, in plain English.

Schema is the difference between machines inferring what you do and machines being told. The five types that matter for a service business, what they cost you to skip, and how to check yours in five minutes.

Schema is a word developers say and founders nod at. Here's
what it actually is, the five types that matter if you sell
expertise, the myths to ignore, and how to check your own site
in five minutes — no developer required for the checking.

## Told versus inferred

Every machine that reads your website — search crawler, AI
engine, answer box — is trying to work out facts. Who is this?
What do they sell? What does it cost? Who is it for?

Without schema, the machine infers those facts from prose. It
reads your beautifully written paragraphs and guesses. With
schema, **the machine is told**. Schema markup is a small block of
code — the standard format is called JSON-LD — that sits in
the page and states the facts in a shared vocabulary:
*this is a business named X, it offers a service named Y,
the price is Z, these are the questions people ask and here
are the answers.*

**Inference fails quietly and often.** A machine that has to guess
your price says nothing, or worse, says a number from a page
that isn't yours. **Schema replaces the machine's guess
with your statement.**

## The five types that matter for expert services

Schema.org defines hundreds of types. **A service business needs
about five.** Past these, you're usually decorating:

**Organization or Person.** The anchor: who runs
this site, what it's called, where else it exists (LinkedIn,
other properties). Every other type points back to this one.
For a founder-led business, Person is often the honest
choice — buyers are hiring you.

**Service.** One per offer, on that offer's own
page: what it is, who it serves, what it produces. This only
works cleanly if each offer has a page — which is its own
fix, covered in
[one page per service](https://shanegring.com/guides/one-page-per-service).

**Offer.** The price, attached to the Service.
This is the one founders resist and the one machines value
most: a stated price is a citable fact. If your pricing is
public in prose, putting it in schema costs you nothing and
makes it machine-quotable.

**FAQPage.** The questions buyers actually ask,
with your actual answers. FAQ schema is how your answers —
not a competitor's, not a guess — get pulled into answer
boxes and AI responses.

**Article + BreadcrumbList.** On your guides and
long-form pages: who wrote it, what it covers, where it sits
in the site. This is what makes a content layer citable
rather than just readable.

## Three myths worth clearing

**"Schema is a ranking hack."** It isn't, and
treating it like one leads to stuffing markup with claims the
page doesn't make. Engines check. Schema that contradicts the
visible page gets ignored, and sustained mismatch erodes
trust in everything else you mark up. The rule is simple:
schema states what the page already says, in machine
vocabulary.

**"My platform handles it."** Partially, at
best. Most platforms emit generic WebPage markup — the
machine equivalent of a shrug. The types that carry business
facts (Service, Offer, FAQPage) almost always require
deliberate setup, because only you know the facts.

**"It's too technical to bother with."**
Checking it is not technical at all — two free tools, five
minutes, below. Writing it is a small, well-defined
development task. It is nothing like the cost of a redesign,
and it usually outperforms one — a point
[worth reading before any redesign](https://shanegring.com/guides/redesign-wont-fix-it).

## The five-minute check

**Paste your homepage into Google's Rich Results
Test.** Free, no login. It lists every schema type it
finds. "No items detected" means machines are inferring
everything about your business.

**Paste your main service page into
validator.schema.org.** This one validates against the
full vocabulary, not just what Google surfaces. Look for
whether your offer and price appear as data, not just prose.

**Read what's there against what's true.** Stale
schema is worse than none — an old price or a dead offer
stated confidently in machine vocabulary will be repeated
confidently by machines. Schema is part of the site that has
to move when the business moves, which is a maintenance
rhythm, not a one-time task.

Schema is one signal of several that decide whether machines
can work with your site at all — the full picture, including
rendering and crawl access, is in
[can AI read your website](https://shanegring.com/guides/can-ai-read-my-website).

## What it looks like on a real page

Take a diagnostic offer — call it an operations assessment,
$2,500, three weeks, for founder-led firms. The page already
says all of that in prose. The schema for that page states the
same facts as data: a Service named "Operations Assessment,"
provided by your Person or Organization, with an Offer whose
price is 2500 and whose currency is USD, an audience
description, and a FAQPage carrying the four questions every
prospect asks about it.

**Nothing new was written.** No claim exists in the markup that a
visitor can't see on the page. That's the whole discipline —
and it's why the work is small. A developer with the facts in
hand marks up a typical five-offer site in a day. The hard part
was never the code; it was having offers defined clearly enough
to state as facts. If your offers resist being stated that
plainly, the site is reporting an operating problem, not a
markup problem.

## Or check it in two minutes

**The free Site Readiness Scan reads your site the way a
machine does** — schema included. It counts your JSON-LD
blocks, lists the types it finds, and scores what machines can
actually establish about your business.

[Run the free Scan →](https://shanegring.com/scan)

If the Scan finds gaps, [the Read](https://shanegring.com/read) ($450)
tells you which ones are costing you: a recorded walkthrough
and a memo ranking every fix by effort against impact.

---

[View this page on shanegring.com](https://shanegring.com/guides/schema-for-services)
