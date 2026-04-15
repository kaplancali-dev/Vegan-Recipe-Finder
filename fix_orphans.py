with open('index.html') as f:
    lines = f.readlines()

out = []
removed = 0
i = 0
while i < len(lines):
    line = lines[i]
    if line.startswith(' ing:') and out and 'time:' not in out[-1]:
        # Orphan: skip ing line, nut line, and any stray comma
        i += 1
        if i < len(lines) and lines[i].startswith(' nut:'):
            i += 1
        if i < len(lines) and lines[i].strip() == ',':
            i += 1
        removed += 1
        continue
    out.append(line)
    i += 1

with open('index.html', 'w') as f:
    f.writelines(out)
print(f"Removed {removed} orphan recipes")
