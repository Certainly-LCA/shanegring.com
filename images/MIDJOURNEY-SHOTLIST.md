# Midjourney shot list — Operating Ladder hero images

Style anchor: the two existing pieces (`hero.png`, `operating-map-hero.png`) — SNES-era
16-bit pixel art, real-world civic-infrastructure scenes, muted blue-gray + cream palette
with warm orange and teal accents, big cumulus clouds, clean composition, no readable text.

**Shared style suffix for every prompt** (once the site is live, the `--sref` URLs lock
Midjourney to the existing art; until then drop the flag and upload the two images as
style references instead):

```
detailed 16-bit pixel art illustration, SNES-era videogame aesthetic, crisp pixel
clusters, muted blue-gray and cream palette with warm orange and teal accents, soft
daytime light, large cumulus clouds, clean composition, no text, no lettering
--ar 16:9 --sref https://shanegring.com/images/hero.png https://shanegring.com/images/map-hero.png
```

> **Note (2026-07-31):** the second `--sref` used to be `operating-map-hero.png`. The
> offer restructure renamed it to `map-hero.png`, so the old URL 404s once that ships.
> `hero.png` is untouched. If you generate before the rename is live on production,
> the old filename still resolves — but log new work against the new one.

Export notes: placeholders are 16:9; export ~2464px wide for retina. The CSS renders
these with `image-rendering: pixelated`, so downscale with nearest-neighbor if needed.
Midjourney garbles written text — keep signs/boards abstract color blocks, like the
transit map in the existing Operating Map hero.

---

## 1. `/work-with-me` — the path ✅ DONE (`work-with-me-hero.png`, 2026-07-08)

**Idea to carry:** one continuous path, five distinct stops, rising toward something built.

> a hillside funicular railway climbing from a small seaside platform to a bright
> hilltop terminus, five distinct stations along the track, each station larger and
> more built-up than the last, one tram car mid-climb, terraced town and harbor below,
> [style suffix]

## 2. `/read` — the Read ✅ DONE (`read-hero.png`, 2026-07-08)

**Idea to carry:** a person closely reading a building the way I read a website.

> a building inspector on a rolling scaffold closely examining an aging storefront
> facade, clipboard in hand, small annotation flags pinned to the brickwork, warm
> light from the shop window, quiet street, [style suffix]

## 3. `/operating-site` — the build ✅ DONE (`operating-site-hero.png`, 2026-07-08)

**Idea to carry:** prefab modules, each complete, craned into one coherent building.

> a modular construction site, a tower crane lowering a fully furnished prefabricated
> room module into a half-assembled modern building, other completed modules already
> lit and occupied, workers guiding the module into place, [style suffix]

## 4. `/operating-partner` — the monthly rhythm ✅ DONE (`operating-partner-hero.png`, 2026-07-08)

**Idea to carry:** someone assigned to keep what the board says matched to what's true.

> a station master on a ladder updating a huge split-flap departure board in a grand
> train station at dusk, board tiles mid-flip rendered as abstract color blocks,
> commuters below, warm lamps against blue evening light, [style suffix]

---

## 5. Site-wide footer band — the whole city ✅ DONE (`footer-city.png`, 2026-07-08; footer background #2b5d64 continues the water)

**Idea to carry:** every motif in one skyline — the city the rest of the art lives in.
One strip used across all page footers.

> a wide panoramic city skyline at dusk seen from across the water, an elevated train
> crossing the full width on a viaduct, a funicular track climbing a hill on the left,
> a grand station facade and a tower crane among the rooftops, telecom towers with
> blinking lights, hundreds of small warm lit windows, harbor boats in the foreground,
> [style suffix but with] --ar 4:1

If 4:1 comes back mushy or repetitive, generate at --ar 21:9 and use Midjourney's
pan left/right to extend the strip, or upscale and crop a horizontal band.

---

## 7. `/scan` — the Scan hero ✅ DONE (`scan-hero.png`, 2026-07-08)

**Idea to carry:** a beam sweeping the city, lighting up what machines can see —
some of it lit, some in shadow.

> a lighthouse on a rocky point at the edge of a harbor city at dusk, its bright
> beam sweeping across the water and lighting up a slice of the buildings on the
> far shore, the lit buildings glowing warm while the rest sit in blue shadow,
> small boats on the water, [style suffix] --ar 16:9

Placement: below the scan intro (the CSS gauge card on the right stays — it's
replaced by live results when a scan runs).

## 8. `/approach` — the centralizing layer ✅ DONE (`approach-station.png`, 2026-07-09)

**Idea to carry:** the hub the whole city runs through — every line converges into it.

> a grand central railway station at the heart of a city seen from a high vantage
> point in morning light, many train lines converging into it from every direction,
> trains arriving and departing, the glass-roofed station hall glowing warm, the
> city's streets and buildings radiating outward around it, people flowing toward
> the entrances, [style suffix] --ar 21:9

Placement: likely below the "Looked at vs. run from" section; the existing
approach-hero.svg diagram stays in the hero (it labels what radiates from the
site — real explanatory content). Fall back to --ar 16:9 + crop if 21:9 is mushy.

## 6. Path icons — all five stages ✅ v2 DONE (`icons/*.png`, 2026-07-09)
(v1 had too much variance. v2: flat front-facing enforced, one color per rung —
Scan teal, Read sky blue, Map cobalt, Site warm orange, Partner brick red. The
ramp runs cool diagnostics → warm build/run, matching the ladder.)

Generate all five together so the set matches (the hand-coded `icons/map.svg` gets
replaced too). MJ returns 1024px squares, not true 16px grids — Claude downscales
nearest-neighbor to the 56px slots and cleans backgrounds on delivery.

**Shared suffix:**

```
simple pixel art icon, chunky 16x16-style pixel sprite, thick blocky pixels, flat
cobalt blue and sky blue palette (#4a90e2, #5ba3f5, #6bb6ff) on a plain white
background, single centered object, retro videogame inventory icon, no text,
no border --ar 1:1 --stylize 50
```

Objects (each echoes its page's hero scene):

1. Scan — `a radar dial gauge with a sweeping needle,`
2. Read — `a clipboard with a magnifying glass over it,`
3. Map — `a folded transit map with route lines,`
4. Site — `a crane hook lifting a small building block,`
5. Partner — `a split-flap departure board tile mid-flip,`

Tips: generate all five in one session; reroll drifters with `--seed` from the best
job; `--stylize 50` keeps MJ literal instead of illustrative.

---

## 9. Guide heroes — `images/guides/*.png`

Same style suffix, `--ar 16:9`, exported 1456x816 and quantized to PNG8 (~380–460KB)
so they sit alongside the offer heroes. The first ten were generated in one pass on
2026-07-14 and their prompts were never recorded — only the `og:image:alt` on each
guide page survives as a description of the scene. Log new ones here.

### `what-is-a-fractional-coo.png` ✅ DONE (2026-07-27)

**Idea to carry:** a senior specialist who comes aboard for the hard passage and then
leaves — the ship was never theirs, and there is another one waiting. Part-time,
serves more than one company, and the port runs fine without them.

> a harbor pilot cutter pulling away from a large cargo ship that continues under
> its own power into a busy well-run port, cranes working and lamps lit along the
> quay, the small cutter already turning toward a second ship waiting outside the
> harbor mouth, terraced town rising behind, [style suffix] --ar 16:9

Conversion: `magick SRC -strip -colors 256 -dither None PNG8:DEST` (378KB, no
visible banding). `pngquant` is not installed on this machine; ImageMagick is.

## 10. `/ai-operations` — the unclaimed flank ✅ DONE (`ai-operations-hero.png`, 2026-07-27)

**Idea to carry:** rules encoded into the infrastructure so most of the work routes
itself, and a person only for the exception. Which is literally the DRVN story the
page tells — what the agent may change on its own vs. what it flags.

> a busy freight rail sorting yard seen from beside the tracks, dozens of wagons
> routing themselves through automated track switches that throw on their own,
> signal lights and lamps along the rails, one single wagon held on a short side
> track beside a small lit signal cabin where a keeper watches from the window,
> harbor cranes and a terraced town in the background, [style suffix] --ar 16:9

Deliberately not a harbor-pilot or hillside-climbing composition — those are the
fractional-COO guide and `/work-with-me`, and the set was starting to repeat itself.

### `claude-in-chrome-stop-screenshots.png` ✅ DONE (2026-07-28)

**Idea to carry:** driving by the map instead of by looking. The operator sets routes
from the illuminated board alone and never looks out the window. The render's window
came back split — daylight clouds on one pane, lamplit night on the other — kept on
purpose: it's surreal, but the clouds are the house motif and the split reads as
"the view doesn't matter." Wired into the guide page hero, the `/guides/` thumb, and
og:image. 301KB PNG8 via the standard magick conversion.

> a night railway signal box interior seen from behind the operator, a large
> illuminated track diagram board showing every route and switch as glowing lines,
> the operator setting a route by lever from the board alone while the window shows
> only darkness and lamps outside, warm cabin light, [style suffix] --ar 16:9

---

## 11. `/install` — the Install hero (`install-hero.png`) ⬜ TO GENERATE

Currently reusing the renamed `ai-operations-hero.png` (the sorting yard), which is a
picture of automation running itself — the opposite of what this page sells. The
Install is one day, your hands on the keyboard, and me leaving.

**Idea to carry:** the fit-out is finished, the tools are mounted and in order, the
owner is running the machine for the first time, and the installer is packing up to
go. The whole product is that he leaves and it still works.

> a small workshop at the end of a fit-out day, a newly installed workbench with
> hand tools mounted in neat order on a pegboard wall, the owner standing at the
> bench running the new machine for the first time with both hands on the controls
> and a first finished piece in front of him, an installer by the open door
> shouldering his toolbag about to leave, warm work-lamp light inside, a harbor town
> and evening sky through the window, [style suffix] --ar 16:9

Deliberately an interior and deliberately not transport infrastructure — the rail and
harbor motifs are used up (sorting yard, signal box, pilot cutter, station, funicular)
and the set had started to repeat itself.

## 12. `/guides/install-requirements` (`install-requirements.png`) ⬜ TO GENERATE

No image at all today, which is why the guide is not listed on `/guides/` — the index
item requires a thumbnail. Generating this unblocks that listing.

**Idea to carry:** the same workshop the morning *before*, everything staged and one
thing missing. The guide's whole argument is that the day dies in the first two hours
if a key nobody has is the thing you go looking for at 9:15.

> the same small workshop at dawn before the fit-out begins, a wall-mounted key
> cabinet standing open beside the door with rows of tagged keys on hooks rendered as
> abstract color blocks and one hook conspicuously empty, crates and equipment staged
> on the floor in three separate neat groups ready for the day, the machine still
> under a dust sheet, cool blue dawn light through the window, [style suffix] --ar 16:9

The three staged groups are the three tiers and the empty hook is the blocking item
(registrar access). Pairs with #11 as before/after of one room — the guide is the prep
for that day, so the continuity is the point.

## 13. Track icons — the three ways in ⬜ TO GENERATE (`icons/track-*.png`)

Replaces the numbered dashed placeholders (`icons/placeholder-{1,2,3}.svg`) now
sitting on the homepage cards and in the nav dropdown.

Different constraint from the five Path icons above: those each echo their page's
hero scene, but these must **not** depict a product. The tracks are deliberately
generic — the reader self-identifies first and meets the offers afterward — so the
mark has to carry the intent, not the thing being sold.

Colour: the five-rung ramp was cool diagnostics → warm build/run. These three are
parallel choices rather than a progression, so they read as siblings — teal for
diagnosis, warm orange for handing it over, cobalt for doing it yourself. Swap the
palette line per icon rather than using the shared one.

**Shared suffix (palette swapped per icon):**

```
simple pixel art icon, chunky 16x16-style pixel sprite, thick blocky pixels, flat
[PALETTE] on a plain white background, single centered object, retro videogame
inventory icon, no text, no border --ar 1:1 --stylize 50
```

1. **Find out what's wrong** — `a magnifying glass held over a small document,`
   palette: `teal palette (#2b8a8a, #3fa9a9, #5fc4c4)`
2. **Have it done for you** — `a construction hard hat,`
   palette: `warm orange palette (#d97a2b, #e8933f, #f2ab5c)`
3. **Learn to do it yourself** — `a wrench and a screwdriver crossed,`
   palette: `cobalt blue palette (#4a90e2, #5ba3f5, #6bb6ff)`

Legibility is the whole job here — these render at 22px in the nav dropdown and
44px on the homepage cards, so silhouette beats detail. Hard hat and crossed tools
both survive 22px; a keyboard was the first choice for #3 and was dropped because
the key grid turns to mush at that size.

Generate all three in one session so the set matches, and reroll drifters with
`--seed` from the best job. Downscale nearest-neighbour, clean the background to
transparent, and deliver as PNG alongside the existing `icons/*.png`.

### Generated 2026-07-31 — picks

| Icon | Job | Pick | Why |
|---|---|---|---|
| Find out what's wrong | `f4672a21-4c42-4a23-a940-e8eaff974ca7` | index 0 | Chunkiest pixels, and the only variant with a document actually inside the lens, which is what carries the meaning. |
| Have it done for you | `df519e51-08a3-4e52-b7ba-3d08a8b78a2b` | index 2 | The only front-facing one. The other three are 3/4 angled, which breaks the flat-front rule the v2 Path icons settled on. |
| Learn to do it yourself | `f5d682c6-8656-48a2-9ef1-3b4c89dd9d90` | index 0 | Boldest, thickest pixel clusters. Index 2 came back smooth and vector-like, off-brief for a 16-bit sprite. |

Full-res URL pattern: `https://cdn.midjourney.com/<job>/0_<index>.png`

