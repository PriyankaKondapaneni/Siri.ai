from app.data.keywords import CATEGORY_KEYWORDS

Category = str  # one of the keys in CATEGORY_KEYWORDS or "other"


def categorize(raw: str) -> Category:
    lower = raw.lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return cat
    return "other"
