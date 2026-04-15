import json, re

TRUSTED_SITES = {
    "Cookie and Kate", "Love and Lemons", "The First Mess",
    "Lazy Cat Kitchen", "Delish Knowledge", "Simple Vegan Blog",
    "The Vegan 8", "Feasting At Home", "Budget Bytes"
}

with open('index.html') as f:
    content = f.read()
id_to_site = {}
for m in re.finditer(r'\{id:(\d+),title:"[^"]+",site:"([^"]+)"', content):
    id_to_site[m.group(1)] = m.group(2)

with open('harvest_progress.json') as f:
    progress = json.load(f)

# Backup
with open('harvest_progress.backup.json', 'w') as f:
    json.dump(progress, f, indent=2)

kept = {rid: data for rid, data in progress.items() if id_to_site.get(rid) in TRUSTED_SITES}
removed = len(progress) - len(kept)

with open('harvest_progress.json', 'w') as f:
    json.dump(kept, f, indent=2)

print(f"Kept {len(kept)} trusted entries, removed {removed} for re-scraping")
