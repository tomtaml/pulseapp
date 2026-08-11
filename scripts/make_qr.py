#!/usr/bin/env python3
import sys
from pathlib import Path
from urllib.parse import urlencode
import qrcode

if len(sys.argv) < 2:
    print("Usage: python3 scripts/make_qr.py https://your-domain.example [WORKSHOP_CODE]")
    raise SystemExit(2)

base = sys.argv[1].rstrip("/") + "/"
workshop = sys.argv[2] if len(sys.argv) > 2 else "TAMPERE-S4"
out = Path(__file__).resolve().parents[1] / "qr"
out.mkdir(exist_ok=True)

for variant in ["fi-fleet", "fi-citizen", "uk-v2h"]:
    url = base + "?" + urlencode({"variant": variant, "workshop": workshop})
    img = qrcode.make(url)
    path = out / f"{variant}-{workshop}.png"
    img.save(path)
    print(f"{variant}: {url}\n  -> {path}")
