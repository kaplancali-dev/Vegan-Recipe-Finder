#!/usr/bin/env python3
"""
Pre-commit syntax validator for index.html.
Checks every ingredient array for odd-quote counts (the bug class that
caused the feta/inch-mark/HTML-entity outages). Exits non-zero on failure.
"""
import re
import sys
from pathlib import Path

INDEX = Path(__file__).parent / "index.html"
if not INDEX.exists():
    print("validate: no index.html — nothing to check")
    sys.exit(0)

h = INDEX.read_text()
errors = []

for m in re.finditer(r'id:(\d+)[^}]*?ing:\[([^\]]*)\]', h, re.DOTALL):
    rid = m.group(1)
    ing = m.group(2)
    if ing.count('"') % 2 != 0:
        errors.append(f"  recipe id={rid}: odd number of quotes in ing:[...]")

# also sanity-check that RECIPES block exists and has balanced brackets at all
for m in re.finditer(r'ing:\[([^\]]*)\]\s*,\s*nut:\{([^}]*)\}', h):
    nut = m.group(2)
    # nut must have cal, pro, carb, fat, fib keys
    for k in ("cal", "pro", "carb", "fat", "fib"):
        if f"{k}:" not in nut:
            errors.append(f"  nut block missing {k}: near position {m.start()}")
            break

if errors:
    print("❌ validate: index.html has syntax issues:")
    for e in errors[:20]:
        print(e)
    if len(errors) > 20:
        print(f"  ... and {len(errors)-20} more")
    sys.exit(1)

print("✅ validate: index.html looks clean")
sys.exit(0)
