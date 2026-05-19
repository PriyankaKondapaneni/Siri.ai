"""Split a brain dump into individual task strings and meta phrases.

Meta phrases are emotional-state hints like 'feeling exhausted' that should
inform the emotional state engine but are not themselves tasks.
"""
import re

# Filler at the start of items. These are stripped to clean up "need to clean room".
LEAD_FILLER = (
    "need to ", "have to ", "i have to ", "i need to ", "got to ",
    "gotta ", "must ", "should ", "i should ", "want to ", "i want to ",
)

# Lines that are pure emotional state declarations, not tasks.
META_PATTERNS = (
    r"^feeling\s+\w+",
    r"^i\s*feel\s+\w+",
    r"^im\s+\w+(tired|exhausted|done|overwhelmed|stuck|frozen)",
    r"^i'?m\s+\w*(tired|exhausted|done|overwhelmed|stuck|frozen)",
    r"^too\s+(much|many)\b",
    r"^so\s+(tired|exhausted)\b",
    r"^cant\s+(start|move|focus)\b",
    r"^can'?t\s+(start|move|focus)\b",
)
META_RX = re.compile("|".join(META_PATTERNS), re.IGNORECASE)


def parse(dump: str) -> tuple[list[str], list[str]]:
    """Return (tasks, meta_phrases)."""
    # Split on newlines, commas, semicolons, and " and " (with spaces).
    parts = re.split(r"[\n,;]+|\s+and\s+", dump)
    tasks: list[str] = []
    meta: list[str] = []
    for raw in parts:
        s = raw.strip().lstrip("-•*").strip()
        if not s:
            continue
        if META_RX.search(s):
            meta.append(s.lower())
            continue
        lower = s.lower()
        for f in LEAD_FILLER:
            if lower.startswith(f):
                s = s[len(f):].strip()
                break
        if s:
            tasks.append(s)
    return tasks, meta
