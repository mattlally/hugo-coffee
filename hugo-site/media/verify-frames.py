#!/usr/bin/env python3
"""Check a start/end frame pair for the three drifts that ruin a scrub.

Usage:  python3 verify-frames.py start.png end.png

No dependencies beyond ffmpeg, which the encode step needs anyway. Downsamples
to 418px via ffmpeg, samples the background lilac from a corner patch, and
thresholds everything more than 45 units of RGB distance from it as subject.
"""
import math, os, subprocess, sys, tempfile

W = H = 418
TOL = {"base": 6, "width_pct": 1.0, "bg": 3.0}   # in original-image px / % / 255


def raw(path, tmp):
    out = os.path.join(tmp, os.path.basename(path) + ".raw")
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", path,
         "-vf", f"scale={W}:{H}", "-pix_fmt", "rgb24", "-f", "rawvideo", out],
        check=True)
    with open(out, "rb") as f:
        d = f.read()
    return [[tuple(d[(y * W + x) * 3:(y * W + x) * 3 + 3]) for x in range(W)]
            for y in range(H)]


def native_width(path):
    r = subprocess.run(["ffprobe", "-loglevel", "error", "-select_streams", "v:0",
                        "-show_entries", "stream=width", "-of", "csv=p=0", path],
                       capture_output=True, text=True, check=True)
    return int(r.stdout.strip())


def analyse(px, scale):
    sam = [px[y][x] for y in range(3, 14) for x in range(3, 14)]
    bg = tuple(sum(c[i] for c in sam) / len(sam) for i in range(3))
    mask = [[math.dist(px[y][x], bg) > 45 for x in range(W)] for y in range(H)]
    widths = [sum(row) for row in mask]
    solid = [y for y in range(H) if widths[y] > 10]
    base = solid[-1] * scale
    lo = int(H * 0.45)                      # splash lives above this; cup below
    body = max(widths[lo:]) * scale
    top = next(y for y in range(H) if widths[y] > 0) * scale
    return bg, base, body, top


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    a, b = sys.argv[1], sys.argv[2]
    with tempfile.TemporaryDirectory() as tmp:
        scale = native_width(a) / W
        bg1, base1, w1, top1 = analyse(raw(a, tmp), scale)
        bg2, base2, w2, top2 = analyse(raw(b, tmp), scale)

    dbase = base2 - base1
    dw_pct = (w2 - w1) / w1 * 100
    dbg = max(abs(bg1[i] - bg2[i]) for i in range(3))

    hexes = ["#%02X%02X%02X" % tuple(int(c) for c in g) for g in (bg1, bg2)]
    print(f"  START   base {base1:7.0f}px   width {w1:6.0f}px   bg {hexes[0]}   top {top1:.0f}px")
    print(f"  END     base {base2:7.0f}px   width {w2:6.0f}px   bg {hexes[1]}   top {top2:.0f}px")
    print()

    rows = [
        ("cup base drift",   f"{dbase:+.0f}px",  abs(dbase) < TOL["base"],      f"< {TOL['base']}px"),
        ("cup width delta",  f"{dw_pct:+.1f}%",  abs(dw_pct) < TOL["width_pct"], f"< {TOL['width_pct']}%"),
        ("background delta", f"{dbg:.1f}/255",   dbg < TOL["bg"],               f"< {TOL['bg']}/255"),
    ]
    ok = True
    for name, val, passed, tol in rows:
        print(f"  {'PASS' if passed else 'FAIL'}  {name:<18} {val:>9}   (tolerance {tol})")
        ok &= passed

    print()
    print("  Ready to encode." if ok else "  Regenerate — see REVISION-1.md.")
    print("  Still check the wordmark by eye at 100% zoom in both frames.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
