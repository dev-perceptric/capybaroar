#!/usr/bin/env python3
"""Builds Capybaroar's logo kit from the Fredoka font.

Shapes the words with HarfBuzz (Fredoka's own kerning), applies the logo's tracking and spacing, outlines every letter
as SVG paths and writes:

  brand/svg/*.svg                 every lockup (wordmark, stacked, icon, small icon, OG template)
  src/components/logoMarks.ts     the same paths for the app's Logo component
  brand/marks.json                the same paths for anything else that draws the mark

Then run brand/src/render.mjs for the PNGs, favicons and OG images. Needs `pip install fonttools uharfbuzz`.
"""

import json
import math
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = Path(__file__).resolve().parent
BRAND = HERE.parent
ROOT = BRAND.parent
FONT = HERE / "Fredoka[wdth,wght].ttf"

# Everything below is in font units (1000 to the em) and drawn at a tenth, so an em is 100 in the SVGs.
AXES = {"wght": 700, "wdth": 100}
TRACK = -25  # letter-spacing -0.025em
# Extra space for pairs, on top of Fredoka's kerning and the tracking. Between "ba" and "ro" the ink edge of the r
# needs a little room so it doesn't touch the a.
PAIRS = {("a", "r"): 18, ("p", "y"): 4}
EDGE = 36  # the ink edge round "roar" and the waves: a stroke this wide behind the fill, so half of it shows
X_MID = -250  # the middle of the x-height (y points down, the baseline is 0)
# Two sound waves after the last r: arcs round one center on the x-height's middle.
WAVE_W = 82  # stroke width, close to Fredoka Bold's stems
WAVE_GAP = 58  # from the r's advance to the inner wave's ends
WAVES = [(165, 60), (330, 52)]  # (radius, half-angle in degrees) inner and outer
LEADING = 790  # stacked: baseline to baseline
SCALE = 0.1

INK = "#262209"
YELLOW = "#FFD202"
WHITE = "#FFFFFF"


def num(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


class Font:
    def __init__(self):
        var = TTFont(FONT)
        self.tt = instancer.instantiateVariableFont(var, AXES)
        self.glyphs = self.tt.getGlyphSet()
        self.cmap = self.tt.getBestCmap()
        face = hb.Face(hb.Blob.from_file_path(str(FONT)))
        self.hb = hb.Font(face)
        self.hb.set_variations(AXES)

    def shape(self, text):
        """Pen positions for each letter: [(char, x)] and the advance after the last one."""
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, {"kern": True, "liga": False})
        x, out = 0, []
        for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
            ch = text[info.cluster]
            out.append((ch, x + pos.x_offset))
            x += pos.x_advance + TRACK
            if i + 1 < len(text):
                x += PAIRS.get((ch, text[i + 1]), 0)
        return out, x - TRACK

    def outline(self, ch, x, y):
        name = self.cmap[ord(ch)]
        pen = SVGPathPen(self.glyphs, ntos=num)
        self.glyphs[name].draw(TransformPen(pen, (SCALE, 0, 0, -SCALE, x * SCALE, y * SCALE)))
        b = BoundsPen(self.glyphs)
        self.glyphs[name].draw(b)
        x0, y0, x1, y1 = b.bounds
        return pen.getCommands(), (x + x0, y - y1, x + x1, y - y0)


def union(*boxes):
    boxes = [b for b in boxes if b]
    return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))


def pad(b, p):
    return (b[0] - p, b[1] - p, b[2] + p, b[3] + p)


def word(font, text, x, y, start=0, end=None):
    """Outlines letters start..end of `text` set from (x, y); returns (path, bounds, advance end)."""
    letters, adv = font.shape(text)
    end = len(letters) if end is None else end
    paths, boxes = [], []
    for ch, lx in letters[start:end]:
        d, box = font.outline(ch, x + lx, y)
        paths.append(d)
        boxes.append(box)
    stop = x + (letters[end][1] if end < len(letters) else adv)
    return "".join(paths), union(*boxes), stop


def waves(x, y):
    """The two arcs, starting WAVE_GAP after x, centered on y."""
    r0, a0 = WAVES[0]
    cx = x + WAVE_GAP + WAVE_W / 2 - r0 * math.cos(math.radians(a0))
    parts, boxes = [], []
    for r, a in WAVES:
        t = math.radians(a)
        x1, y1, y2 = cx + r * math.cos(t), y - r * math.sin(t), y + r * math.sin(t)
        parts.append(f"M{num(x1 * SCALE)} {num(y1 * SCALE)}A{num(r * SCALE)} {num(r * SCALE)} 0 0 1 {num(x1 * SCALE)} {num(y2 * SCALE)}")
        boxes.append((x1, y1, cx + r, y2))
    return "".join(parts), pad(union(*boxes), WAVE_W / 2)


def wordmark(font):
    capyba, b1, _ = word(font, "capybaroar", 0, 0, 0, 6)
    roar, b2, stop = word(font, "capybaroar", 0, 0, 6)
    wv, b3 = waves(stop, X_MID)
    return {"capyba": capyba, "roar": roar, "waves": wv, "box": union(b1, pad(b2, EDGE / 2), pad(b3, EDGE / 2))}


def stacked(font, align):
    _, low_adv = font.shape("roar")
    capyba, b1, _ = word(font, "capyba", 0, 0)
    # "roar" plus its waves, measured from the r's left side to the outer wave's right edge.
    r_ink = font.outline("r", 0, 0)[1][0]
    _, wb = waves(low_adv, X_MID)
    low_w = wb[2] + EDGE / 2 - r_ink
    cap_l, cap_r = b1[0], b1[2]
    if align == "right":
        x = cap_r - low_w - r_ink
    elif align == "left":
        x = cap_l - r_ink
    else:
        x = (cap_l + cap_r) / 2 - low_w / 2 - r_ink
    roar, b2, stop = word(font, "roar", x, LEADING)
    wv, b3 = waves(stop, LEADING + X_MID)
    return {"capyba": capyba, "roar": roar, "waves": wv, "box": union(b1, pad(b2, EDGE / 2), pad(b3, EDGE / 2))}


def small(font, letter):
    """The tiny icon: one yellow letter of "roar" and the waves."""
    d, b, stop = word(font, letter, 0, 0)
    wv, b3 = waves(stop, X_MID)
    return {"capyba": "", "roar": d, "waves": wv, "box": union(pad(b, EDGE / 2), pad(b3, EDGE / 2))}


TONES = {
    # capyba, roar, waves, edge (None: no edge)
    "light": (INK, YELLOW, YELLOW, INK),
    "dark": (WHITE, YELLOW, YELLOW, INK),
    "ink": (INK, INK, INK, None),
    "white": (WHITE, WHITE, WHITE, None),
}
# Only for the guide's "don't" examples: yellow on white without the ink edge.
NO_EDGE = (INK, YELLOW, YELLOW, None)


def layers(mark, tone):
    """SVG elements for a mark in a tone: capyba, the ink edges behind roar and the waves, then roar and the waves."""
    c1, c2, c3, edge = NO_EDGE if tone == "no-edge" else TONES[tone]
    e, w = num(EDGE * SCALE), num(WAVE_W * SCALE)
    out = []
    if mark["capyba"]:
        out.append(f'<path fill="{c1}" d="{mark["capyba"]}"/>')
    if edge:
        out.append(f'<path fill="none" stroke="{edge}" stroke-width="{e}" stroke-linejoin="round" d="{mark["roar"]}"/>')
        out.append(f'<path fill="none" stroke="{edge}" stroke-width="{num((WAVE_W + EDGE) * SCALE)}" stroke-linecap="round" d="{mark["waves"]}"/>')
    out.append(f'<path fill="{c2}" d="{mark["roar"]}"/>')
    out.append(f'<path fill="none" stroke="{c3}" stroke-width="{w}" stroke-linecap="round" d="{mark["waves"]}"/>')
    return out


def svg(view, body, title="Capybaroar"):
    vb = " ".join(num(v) for v in view)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img"><title>{title}</title>' + "".join(body) + "</svg>\n"


def view_of(mark):
    x0, y0, x1, y1 = (v * SCALE for v in mark["box"])
    return (x0, y0, x1 - x0, y1 - y0)


def square_view(mark, margin):
    x, y, w, h = view_of(mark)
    side = max(w, h) * (1 + 2 * margin)
    return (x + w / 2 - side / 2, y + h / 2 - side / 2, side, side)


def fit(mark, fill_w, fill_h=None):
    """The transform that centers a mark on a 48-unit tile, as wide as fill_w of it (and no taller than fill_h)."""
    x, y, w, h = view_of(mark)
    k = min(48 * fill_w / w, 48 * (fill_h or 1) / h)
    tx, ty = 24 - (x + w / 2) * k, 24 - (y + h / 2) * k
    return f"translate({num(tx)} {num(ty)}) scale({k:.4f})"


ICON_FIT = (0.84,)  # the stacked mark on the app icon
SMALL_FIT = (0.84, 0.62)  # the small icon's o and waves


def tile(mark, tone, bg, how):
    """A mark on a 48-unit rounded tile (13 radius, like Claritia's)."""
    g = f'<g transform="{fit(mark, *how)}">' + "".join(layers(mark, tone)) + "</g>"
    return svg((0, 0, 48, 48), [f'<rect width="48" height="48" rx="13" fill="{bg}"/>', g])


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def main():
    font = Font()
    out = BRAND / "svg"
    wm = wordmark(font)
    st = {a: stacked(font, a) for a in ("right", "center", "left")}
    stk = st["right"]
    sm = {k: small(font, k) for k in ("o", "r")}

    for tone in TONES:
        write(out / f"wordmark-{tone}.svg", svg(view_of(wm), layers(wm, tone)))
        write(out / f"stacked-{tone}.svg", svg(square_view(stk, 0.06), layers(stk, tone)))
    for a, m in st.items():  # the alignments compared in the guide
        write(BRAND / "src" / "compare" / f"stacked-{a}.svg", svg(square_view(m, 0.06), layers(m, "light")))

    write(out / "icon.svg", tile(stk, "dark", INK, ICON_FIT))
    write(out / "icon-yellow.svg", tile(stk, "ink", YELLOW, ICON_FIT))
    write(out / "icon-small.svg", tile(sm["o"], "light", INK, SMALL_FIT))
    write(BRAND / "src" / "compare" / "icon-small-r.svg", tile(sm["r"], "light", INK, SMALL_FIT))
    write(BRAND / "src" / "compare" / "wordmark-no-edge.svg", svg(view_of(wm), layers(wm, "no-edge")))

    def geo(m):
        return {"viewBox": " ".join(num(v) for v in view_of(m)), "capyba": m["capyba"], "roar": m["roar"], "waves": m["waves"]}

    marks = {
        "wordmark": geo(wm),
        "stacked": {**geo(stk), "viewBox": " ".join(num(v) for v in square_view(stk, 0.06))},
        "small": geo(sm["o"]),
        "iconFit": fit(stk, *ICON_FIT),
        "smallFit": fit(sm["o"], *SMALL_FIT),
        "edge": EDGE * SCALE,
        "wave": WAVE_W * SCALE,
    }
    write(BRAND / "marks.json", json.dumps(marks, indent=1) + "\n")
    ts = [
        "// Generated by brand/src/build.py from the Fredoka font: don't edit by hand, change the script and run `npm run brand`.",
        "// Paths for the Logo component: capyba (ink or white), roar (yellow with an ink edge) and the two waves (strokes).",
        "",
        "export type Mark = { viewBox: string; capyba: string; roar: string; waves: string };",
        "",
    ]
    for key in ("wordmark", "stacked", "small"):
        ts.append(f"export const {key.upper()}: Mark = {json.dumps(marks[key])};")
        ts.append("")
    ts.append("/** Where the stacked mark (ICON) and the small icon's o and waves (SMALL) sit on the 48-unit icon tile. */")
    ts.append(f'export const TILE = {{ icon: "{marks["iconFit"]}", small: "{marks["smallFit"]}" }};')
    ts.append("")
    ts.append(f"/** Stroke widths in the marks' units: the ink edge behind roar and the waves, and the waves themselves. */")
    ts.append(f"export const EDGE = {num(EDGE * SCALE)};")
    ts.append(f"export const WAVE = {num(WAVE_W * SCALE)};")
    write(ROOT / "src" / "components" / "logoMarks.ts", "\n".join(ts) + "\n")
    print("wrote", out, "and src/components/logoMarks.ts")


if __name__ == "__main__":
    main()
