#!/usr/bin/env python3
"""
Apply harvest_progress.json to index.html — properly.
Fixes the multi-line regex bug in harvest_scraper.py.
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).parent
INDEX = HERE / "index.html"
PROG  = HERE / "harvest_progress.json"
OUT   = HERE / "index.html"

if not INDEX.exists() or not PROG.exists():
    print("ERROR: need index.html and harvest_progress.json in this folder")
    sys.exit(1)

progress = json.loads(PROG.read_text())
content  = INDEX.read_text()

updated = 0
missing = []

for rid, data in progress.items():
    ings = data.get("ing") or []
    nut  = data.get("nut") or {}
    url  = data.get("url")
    if not ings or not nut:
        continue

    ing_str = "[" + ",".join(f'"{i}"' for i in ings) + "]"
    nut_str = (f"{{cal:{nut['cal']},pro:{nut['pro']},"
               f"carb:{nut['carb']},fat:{nut['fat']},fib:{nut['fib']}}}")

    # Match whole recipe object: {id:NN,...ing:[...],nut:{...}}
    # DOTALL so .*? crosses newlines; non-greedy to stop at first closing }}
    pat = re.compile(
        rf'(\{{id:{rid},[^}}]*?)ing:\[[^\]]*\](,nut:\{{[^}}]*\}})',
        re.DOTALL
    )
    def repl(m):
        head = m.group(1)
        # optionally update url inside head
        if url:
            head = re.sub(r'url:"[^"]*"', f'url:"{url}"', head, count=1)
        return f'{head}ing:{ing_str},nut:{nut_str}'

    new_content, n = pat.subn(repl, content, count=1)
    if n == 0:
        missing.append((rid, data.get("title", "")))
    else:
        content = new_content
        updated += 1

INDEX.write_text(content)
print(f"✅ Updated {updated} recipes")
if missing:
    print(f"⚠️  {len(missing)} not found in index.html:")
    for rid, t in missing[:20]:
        print(f"   id={rid}  {t}")
