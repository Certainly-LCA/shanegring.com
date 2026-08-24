[← All guides](https://shanegring.com/guides/)

Guide · feeds The Install

# Claude is screenshotting your browser to find every button. Make it stop.

Claude in Chrome keeps screenshotting the page to find where to click — slow, and it misclicks. One standing rule in CLAUDE.md ends it: the exact block to paste, why it works, and how to check it took.

If you've watched a Claude in Chrome session crawl —
screenshot, click, screenshot, misclick, screenshot again —
the problem isn't the model. It's a default buried in the
tool it clicks with, and the fix is **one written rule
that holds forever**. This guide gives you the exact
block to paste into your global instructions, the reason each
line is there, and how to check it took.

## Why Claude keeps reaching for the camera

Claude in Chrome clicks through a tool called
`computer`, and that tool's own description tells
the model to take a screenshot first and work out pixel
coordinates from the picture. Left alone, Claude does what
the tool says: **look, guess a spot, click, look
again**.

That loop costs you twice. Every screenshot is a full
round-trip — the page is captured, shipped to the model, and
read like a photograph — so sessions slow to a crawl. And
coordinates are a guess at a pixel position, not a hold on
the thing itself: the moment the page reflows, a banner
loads, or the window sits at a different width, the guess
lands on the wrong element. That's the misclick you keep
watching it make.

## The browser already says where everything is

None of that looking is needed, because the page carries a
machine-readable map of itself — the accessibility tree, the
same structure a screen reader uses. Claude's browser tools
can read it directly:

**find** — takes a plain-language description
("the blue Submit button") and returns a reference to the
element itself.

**read_page** — lists every element on the
page; filtered to interactive ones, it's a map of
everything clickable, each with a reference.

**Refs instead of coordinates** — passing that
reference to the click tool hits the element wherever it
currently sits. Reflow doesn't matter. The click can't
drift.

**form_input and key presses** — fields filled
by reference, Enter and Tab and Escape sent as keys. No
clicking into a box by position.

**URL deep-links** — the fastest click is no
click. Going straight to the settings page beats clicking
through three menus, and it can't miss.

Exact, fast, and no camera. The only thing missing is a
standing instruction to use them — because the tool's own
default says otherwise, and **the default wins until
you overrule it in writing**.

## The fix: one standing rule

Claude Code reads a plain-text file of standing instructions
at the start of every session. The global one lives at
`~/.claude/CLAUDE.md` and applies to every project
on your machine. A rule written there doesn't need repeating,
doesn't fade when the session ends, and outranks what a tool
says about itself.

Open that file — create it if it doesn't exist — and paste
this section in, exactly as written:

## Browser Automation — Native Navigation Only (HARD RULE)
When driving Claude in Chrome (the mcp__claude-in-chrome tools), use NATIVE navigation. Never drive by screenshots:
- Navigate by URL deep-links whenever possible instead of clicking through menus.
- Locate elements with the find tool (natural-language search) or read_page (accessibility tree — use filter: "interactive"). Both return element refs.
- Click by passing that ref to the computer tool instead of coordinates. Never take a screenshot to figure out where to click.
- Fill fields with form_input using the ref. Use key actions for Enter, Tab, Escape. Use scroll_to with a ref to bring elements into view.
- Verify each step by running find or read_page on the new state and checking the text — not by screenshotting.
- Screenshots are allowed ONLY when the deliverable itself is visual (design review, capturing proof for me) — never as the driving mechanism.
Why this rule exists: the computer tool's own description tells you to consult a screenshot to determine coordinates before clicking. Ignore that default. Screenshot-coordinate clicking is slow (a full round-trip per look) and misclicks constantly. Accessibility refs are exact and fast.

Note what the rule keeps: screenshots stay allowed when the
picture *is* the deliverable — a design review, proof
of a finished step. They're banned only as the way of
finding things. That honest carve-out matters; a rule that
bans a tool outright gets broken the first time the tool is
genuinely needed.

## Check it took

Read the file back — not what you meant to save, **what's
actually there**:

grep -A 10 "Browser Automation" ~/.claude/CLAUDE.md

If the section prints, it's live. Every new session picks it
up on its own — nothing to restart, nothing to re-prompt.
Then watch the next browser task: elements found by
description, clicks landing by reference, each step verified
by reading the page's text. A screenshot should only appear
when you asked for a picture.

## Why the rule reads the way it does

Three choices make this rule hold where a passing "please
stop screenshotting" doesn't:

**It names the tools.** Not "browse
efficiently" — the exact tool for each job: find and
read_page to locate, refs to the click tool, form_input for
fields. Vague rules get vague obedience.

**It names the default it overrules.** The
rule says out loud that the click tool's own description
points the wrong way, and to ignore it. Without that line,
the model drifts back to what the tool tells it every time.

**It carries its why.** Slow, misclicks,
refs are exact. A rule with its reason attached gets
followed in cases the rule-writer never pictured; a bare
command gets lawyered.

If that shape sounds familiar, it should — it's a standard
operating procedure, written for a machine. The same move as
[stating your crawl policy instead of implying it](https://shanegring.com/guides/robots-txt-for-ai-crawlers): the written version
survives the next session, the next machine, the next tool
update. The unwritten version lasts until the default
reasserts itself.

## This is the small version of a bigger move

**Everything AI does well for a business starts the
same way: the rules get written down once, and then the
machine follows them without being reminded.** One
paragraph fixed your browser sessions. The same discipline,
applied to how your work actually runs, is what lets AI take
real work off your plate without taking your judgment with
it.

[See the Install →](https://shanegring.com/install)

Stuck on a specific automation that won't behave? That's a
[working session](https://shanegring.com/session) — a live call
on the thing itself.

---

[View this page on shanegring.com](https://shanegring.com/guides/claude-in-chrome-stop-screenshots)
