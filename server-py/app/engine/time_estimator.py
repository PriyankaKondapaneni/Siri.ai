"""Honest, minimum-viable-version time estimation.

Always returns the smallest credible duration. The point is to lower
activation energy; you can keep going past the timer if you have momentum.
"""

CATEGORY_BASE_MINUTES: dict[str, int] = {
    "survival": 10,
    "communication": 2,
    "self_care": 10,
    "chore": 15,
    "work": 30,
    "emotional": 5,
    "other": 10,
}

# Cap exposed durations so the UI never shows scary numbers.
MAX_MINUTES = 30


def estimate(category: str, raw: str) -> int:
    lower = raw.lower()
    d = CATEGORY_BASE_MINUTES.get(category, 10)
    if any(w in lower for w in ("quick ", "just ", "1 ", "one ")):
        d = max(1, d // 2)
    if any(w in lower for w in ("whole ", "entire ", "all of ")):
        d = min(MAX_MINUTES, d * 2)
    if category == "communication":
        d = min(d, 5)
    if category == "work" and "study" in lower:
        d = max(d, 25)
    return min(d, MAX_MINUTES)
