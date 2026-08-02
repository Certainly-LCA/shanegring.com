#!/usr/bin/env python3
"""Draw the Install icon as an actual 16x16 sprite and write it as a PAM.

The Midjourney variants all lost the plug at icon size: side-on view, prongs
merging into the body, a socket behind it that never resolved. Drawn by hand
the silhouette is decided rather than hoped for — prongs on the outer edge
pointing up, a wide body, a narrowing strain relief at the foot. That reads at
22px because those three shapes are still distinguishable at 22px.

Palette is the forest green the shotlist assigned the Install (~144 degrees),
one family, dark outline, pale highlight up the left — the same construction
as the five original icons. Lifted one value step from the hex in the shotlist:
at 22px the darker mix read as near-black next to the Seat and the Session.

To change the icon, edit GRID and re-run:

    python3 install-sprite.py /tmp/plug.pam
    magick /tmp/plug.pam -filter point -resize 1024x1024 -trim +repage \
      -resize 104x104 -background none -gravity center -extent 112x112 \
      install.png

The point-upscale to 1024 first is not busywork — it puts this sprite through
the same downscale the seven Midjourney icons went through, so the edge
softening matches instead of coming out harder than its neighbours.
"""

O = (0x24, 0x5a, 0x3c)  # outline
D = (0x35, 0x79, 0x50)  # dark
M = (0x47, 0x9a, 0x68)  # mid
L = (0x63, 0xbd, 0x86)  # light

GRID = [
    "................",
    "....OO....OO....",
    "....OO....OO....",
    "....OO....OO....",
    "..OOOOOOOOOOOO..",
    "..OLLLLLLLLLDO..",
    "..OLMMMMMMMMDO..",
    "..OLMMMMMMMMDO..",
    "..OLMMMMMMMMDO..",
    "..OLMMMMMMMMDO..",
    "..OLMMMMMMMMDO..",
    "..OODDDDDDDDOO..",
    "....OOMMMMOO....",
    "......OMMO......",
    "......OOOO......",
    "................",
]

LOOKUP = {"O": O, "D": D, "M": M, "L": L}

rows = []
for line in GRID:
    assert len(line) == 16, line
    for ch in line:
        if ch == ".":
            rows.append(bytes((0, 0, 0, 0)))
        else:
            r, g, b = LOOKUP[ch]
            rows.append(bytes((r, g, b, 255)))

body = b"".join(rows)
header = b"P7\nWIDTH 16\nHEIGHT 16\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n"

import sys
with open(sys.argv[1], "wb") as fh:
    fh.write(header + body)
print("wrote", sys.argv[1], len(body), "bytes of pixels")
