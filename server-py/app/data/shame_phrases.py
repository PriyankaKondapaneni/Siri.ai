"""Anti-shame: phrases to scrub from any user-facing string.

The substitutions are case-preserving for the first letter only — enough for
typical use ("Overdue task" → "Still here task"). For arbitrary casings, the
sanitizer also tries lowercased matches and a couple of common capitalizations.
"""

# Phrases that simply shouldn't appear in output.
BANNED_PHRASES = (
    "you failed",
    "you missed",
    "you should have",
    "your streak",
    "broken streak",
    "behind on",
)

# Soft replacements: shame-loaded word → neutral word.
REPLACEMENTS = {
    "overdue":       "still here",
    "missed":        "moved",
    "failed":        "paused",
    "incomplete":    "still in progress",
    "abandoned":     "set aside",
    "behind":        "still here",
}
