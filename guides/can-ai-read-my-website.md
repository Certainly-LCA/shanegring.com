[← All guides](https://shanegring.com/guides/)

Guide · feeds The Scan

# Can AI read your website? Here's how to find out.

Buyers ask AI about businesses like yours every day. Here's what AI engines can and can't read on a website, the five signals that decide it, and how to check yours by hand — or in two minutes with a free scan.

Your next client may never see your homepage. They'll ask an AI
engine about businesses like yours, and the answer will be built
from whatever the machine could read. This guide shows you what
machines actually read, the five signals that decide it, and how
to check your own site in about ten minutes.

## The quiet change in how buyers find you

For twenty years the deal was simple: people typed words into a
search box, a list of links came back, and your job was to be on
the list. That deal has changed. A growing share of your buyers
now ask a question in plain language and get a plain-language
answer. No list. No click. Just an answer, with your business
either in it or not.

Ask ChatGPT, Claude, or Perplexity the question your best client
asked before they found you. Something like "who helps
credentialing organizations fix their operations" or "best
fractional COO for a founder-led services firm." Read what comes
back. That answer was assembled from what those engines could
read about you and your competitors. If your site is hard to
read, the engine works with less, and it either skips you or
guesses.

**The engines are already answering questions about your
business. The only open question is **what you've given them to
work with**.**

## What machines actually read

A machine reading your website doesn't see the design. It sees
**the underlying document: the HTML**. It reads that document top to
bottom, looking for structure that tells it what things mean,
not just how they look. A human sees a beautiful page and infers
that the big bold line is the point. A machine only knows the
big bold line is the point if the document says so.

This is why two sites that look equally good to a person can be
wildly different to a machine. One is a well-marked building:
every room labeled, a directory in the lobby. The other is the
same building with the labels torn off. Same rooms, same
contents, but a visitor who can't see has no way to move
through it.

## The five signals that decide it

**1. The content is in the HTML, not painted on after.**
Some sites ship a nearly empty document and use JavaScript to
fill in the words once the page loads in a browser. People
never notice. Machines often do, because many crawlers read
the document as delivered and move on. If your real content
arrives late, to a machine your site is a lobby with the
lights off. The check: view your page's source (right-click,
"View Page Source") and search for a sentence from the middle
of the page. If it's not there, machines may not be seeing it
either.

**2. The structure is semantic.** HTML has
elements that carry meaning: one `<h1>` that
names the page, headings that step down in order,
`<main>` around the primary content,
`<nav>` and `<footer>` where
they belong. Pages built as a thousand anonymous boxes make a
machine work for meaning it shouldn't have to work for. The
check: does each page have exactly one H1, and does it say
what the page is about?

**3. Structured data describes the business.**
Schema markup (JSON-LD) is a small block of code that states
plainly: this is a business, this is what it sells, this is
what it costs, these are the questions people ask and the
answers. It's the difference between a machine inferring what
you do and a machine being told. The check: paste your URL
into Google's Rich Results Test and see what it finds.

**4. The crawl doors are open.** Your
`robots.txt` file tells crawlers what they may
read. Some sites block AI crawlers without knowing it, often
from a template someone copied years ago. An
`llms.txt` file goes further: a clean, current,
plain-text summary of the business, written for machines to
read first. The check: visit yoursite.com/robots.txt and
yoursite.com/llms.txt and see what's there.

**5. The words carry the real story.** None of
the structure matters if the content is stale. If your site
still describes the 2022 version of your business, machines
will confidently repeat the 2022 version to your 2026 buyers.
Machines don't fact-check you against reality. They repeat
what you published.

## The ten-minute check

**Ask the engines your buyer's question.** Open
two or three AI engines and ask what your prospects ask. Note
what's wrong, what's missing, and who gets named instead of
you.

**View source and search for your own sentence.**
If the words on the page aren't in the document, you have a
rendering problem.

**Check robots.txt and llms.txt.** One minute
each. You're looking for accidental blocks and for whether the
machine front door exists at all.

**Run one page through a structured-data checker.**
Google's Rich Results Test is free. No results found means
machines are inferring everything about you.

**Read your homepage as a stranger.** Would
someone who knows nothing about you learn who you serve, what
you sell, and what it costs? If a person can't, a machine
can't either.

## The mistakes that undo good sites

Some of the least readable sites belong to businesses that spent
real money on them. The same handful of mistakes shows up again
and again:

**Blocking AI crawlers by accident.** A security
plugin, a copied robots.txt, or a well-meaning developer
blanket-blocks bots — and with them GPTBot, ClaudeBot, and
PerplexityBot. The business is invisible to AI engines by
its own instruction and nobody remembers writing it.

**Trapping the good content in PDFs.** The
methodology, the standard, the pricing sheet — the substance
of the business — lives in downloadable PDFs while the pages
hold marketing gloss. Machines index pages far better than
they index attachments. If your best thinking is a download,
your best thinking is invisible.

**Publishing words as pictures.** Pricing tables
exported as images, quotes as graphics, headlines baked into
hero images. A person reads them fine. To a machine, an image
without alt text is a blank space exactly where your most
important claims were.

**Letting the answers live only in a chatbot or a
form.** If the only way to learn what you charge is to
"book a call," machines learn nothing, and increasingly your
buyers ask machines first. Whatever you make people ask for,
machines will never cite.

None of these are exotic. All of them are invisible from the
founder's chair, because the site looks perfect in a browser.
That's the trap: **machine readability fails
silently.**

## What this looks like when it works

A real example from my own client work: a certification body
whose entire standard — the substance of the business — lived in
a 300-page PDF. Rigorous, credible, and completely unreadable to
machines. Search engines saw a brochure site. AI engines asked
about the certification either guessed or said nothing.

We moved the standard out of the PDF and into structured,
machine-readable pages: every requirement addressable, every
section linkable, schema describing what the certification is
and who it's for. Nothing about the standard changed. Everything
about its findability did. The same substance, republished in a
form machines could read, started showing up in the answers its
buyers were already asking.

That's the general shape of the win: **you rarely need new
content to become AI-readable**. You need the content you already
paid to create, freed from the formats that hide it.

## What a good result looks like

A machine-readable site isn't a technical trophy. It shows up in
the business: AI engines describe you accurately and cite you.
Search engines pull your actual answers into results. Prospects
arrive already knowing what you do and what it costs, because
the machine that briefed them was working from a clean document.

And there's a compounding effect. Every new page you publish on
a readable site inherits the structure. On an unreadable site,
every new page inherits the problems. That's why this is worth
fixing before you invest in content, not after.

## Or check it in two minutes

**The Site Readiness Scan reads your site the way a
machine does** and returns a scored report across four
lenses: whether AI can read it, whether it can drive its own
search and content, whether it could be a surface you build on,
and where the opportunity is. Free, and the report lands in your
inbox.

[Run the free Scan →](https://shanegring.com/scan)

If the Scan shows gaps and you want an operator's judgment on
what they're costing you, that's [the Read](https://shanegring.com/read):
the same questions, answered by hand, with a ranked memo of
fixes.

---

[View this page on shanegring.com](https://shanegring.com/guides/can-ai-read-my-website)
