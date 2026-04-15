#!/usr/bin/env python3
"""
Scrub cosmetic cruft from every ingredient string in index.html.
Strips leading quantity words, unit abbreviations (with or without periods),
descriptors like "level/heaping/large/additive-free", parentheticals, and
leading numbers/fractions — so search terms match real ingredient names.
"""
import re
from pathlib import Path

HERE = Path(__file__).parent
INDEX = HERE / "index.html"

# Units (with or without trailing period, with or without plural s)
UNIT_WORDS = [
    "cup", "cups", "tablespoon", "tablespoons", "tbsp", "tbsps",
    "teaspoon", "teaspoons", "tsp", "tsps",
    "ounce", "ounces", "oz",
    "pound", "pounds", "lb", "lbs",
    "gram", "grams", "g", "kg", "kilogram", "kilograms",
    "ml", "milliliter", "milliliters", "liter", "liters", "l",
    "pint", "pints", "quart", "quarts", "qt", "qts",
    "pinch", "pinches", "dash", "dashes", "handful", "handfuls",
    "drop", "drops", "splash", "splashes", "sprinkle", "sprinkles",
    "bunch", "bunches", "clove", "cloves", "sprig", "sprigs",
    "slice", "slices", "piece", "pieces", "stick", "sticks",
    "can", "cans", "package", "packages", "pkg", "pkgs",
    "bag", "bags", "box", "boxes", "jar", "jars", "bottle", "bottles",
    "head", "heads", "stalk", "stalks", "bulb", "bulbs",
    "inch", "inches", "cm", "mm",
]
UNIT_PAT = r"(?:" + "|".join(sorted(UNIT_WORDS, key=len, reverse=True)) + r")\.?"

# Descriptor adjectives that come before ingredient names
DESCRIPTORS = [
    "level", "heaping", "scant", "rounded", "generous",
    "large", "medium", "small", "big", "tiny", "jumbo",
    "whole", "fresh", "frozen", "dried", "raw", "cooked",
    "additive-free", "organic", "unsalted", "unsweetened",
    "ripe", "firm", "soft",
    "any", "some", "fat-reduced", "low-fat", "reduced-fat",
    "of",
]
DESC_PAT = r"(?:" + "|".join(DESCRIPTORS) + r")"

PROSE_WORDS = {
    "are","is","was","were","be","been",
    "can","could","will","would","should","may","might",
    "work","works","working",
    "also","instead","alternative","alternatives","option","options","prefer",
    "omit","add","use","uses","using","put","like","such",
    "if","but","because","since",
    "you","your","i","we","they",
}

def looks_like_prose(s: str) -> bool:
    words = s.lower().split()
    if len(words) > 5:
        return True
    if "," in s and len(words) > 3:
        return True
    if any(w.strip(",.").lower() in PROSE_WORDS for w in words):
        return True
    return False

def clean(name: str) -> str:
    s = name.strip()
    # truncate at first colon or em-dash (ingredient notes / prose after the name)
    s = re.split(r"\s*[:—–]\s*", s, maxsplit=1)[0]
    # drop anything absurdly long (prose, not an ingredient)
    if len(s) > 60:
        # take just the first few words
        s = " ".join(s.split()[:4])
    # remove parentheticals anywhere
    s = re.sub(r"\s*\([^)]*\)", "", s)
    # strip leading numbers, fractions, vulgar fractions, ranges, hyphens
    s = re.sub(r"^[\d\s/\-\.,½¼¾⅓⅔⅛⅜⅝⅞]+", "", s)
    # iteratively strip leading units and descriptors
    for _ in range(5):
        before = s
        # leading unit word (with optional period/s)
        s = re.sub(rf"^{UNIT_PAT}\s+", "", s, flags=re.IGNORECASE)
        # "of" after units: "cup of flour" → "flour"
        s = re.sub(r"^of\s+", "", s, flags=re.IGNORECASE)
        # leading descriptor: "additive-free peanut butter" → "peanut butter"
        # only strip if followed by another word (keep "small" if that's the whole thing)
        s = re.sub(rf"^{DESC_PAT}\s+(?=\S)", "", s, flags=re.IGNORECASE)
        # numbers/fractions again (e.g. after stripping "cup")
        s = re.sub(r"^[\d\s/\-\.,½¼¾⅓⅔⅛⅜⅝⅞]+", "", s)
        if s == before:
            break
    # collapse whitespace, trim punctuation
    s = re.sub(r"\s+", " ", s).strip(" ,;.-")
    return s.lower()


def main():
    h = INDEX.read_text()
    changed = 0
    changed_entries = 0

    def process_ing_block(m):
        nonlocal changed, changed_entries
        inner = m.group(1)
        # parse quoted strings
        items = re.findall(r'"([^"]*)"', inner)
        new_items = []
        local_changed = False
        seen = set()
        for it in items:
            # split on " or " (case-insensitive) — turn "X or Y" into two ingredients
            pieces = re.split(r"\s+or\s+", it, flags=re.IGNORECASE)
            if len(pieces) > 1:
                local_changed = True
            for piece in pieces:
                c = clean(piece)
                if c and len(c) > 1 and c not in seen and not looks_like_prose(c):
                    new_items.append(c)
                    seen.add(c)
                    if c != it:
                        local_changed = True
                        changed += 1
        if local_changed:
            changed_entries += 1
        return "ing:[" + ",".join(f'"{x}"' for x in new_items) + "]"

    new_h = re.sub(r"ing:\[([^\]]*)\]", process_ing_block, h, flags=re.DOTALL)
    INDEX.write_text(new_h)
    print(f"✅ Cleaned {changed} ingredient names across {changed_entries} recipes")

if __name__ == "__main__":
    main()
