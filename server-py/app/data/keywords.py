"""Keyword tables for deterministic categorization and scoring.

Order matters in CATEGORY_KEYWORDS: the first category whose keywords match wins.
Survival is checked before self_care so 'eat' / 'water' are tagged correctly when
the user is in basic-need territory.
"""

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "survival": [
        "havent eaten", "haven't eaten", "no food", "starving",
        "no water", "havent drunk", "haven't drunk",
        "meds", "medicine", "medication",
        "havent slept", "haven't slept", "no sleep",
        "sick", "fever", "pain", "hurt", "bleeding",
    ],
    "communication": [
        "reply", "respond", "message", "email", "mail",
        "text ", "call ", "ping", "dm ", "slack", "whatsapp",
        "manager", "boss", "client", "send", "follow up", "follow-up",
        "rsvp",
    ],
    "self_care": [
        "eat", "eaten", "food", "meal", "breakfast", "lunch", "dinner",
        "drink", "water", "sleep", "slept", "shower", "bathe", "bath",
        "rest", "tired", "hungry", "thirsty", "nap", "walk", "stretch",
        "brush teeth", "exercise", "workout",
    ],
    "chore": [
        "clean", "tidy", "laundry", "dishes", "trash", "groceries", "shop",
        "buy", "errand", "fix", "organize", "room", "kitchen", "bathroom",
        "dust", "vacuum", "bill", "rent", "pack", "unpack",
    ],
    "work": [
        "code", "study", "review", "ticket", "pr ", "merge", "meeting",
        "presentation", "deck", "deadline", "ship", "dsa", "leetcode",
        "interview", "read paper", "document", "spec", "design doc",
        "implement", "debug", "test ", "deploy", "thesis", "project",
        "assignment", "homework", "class", "lecture", "exam",
    ],
    "emotional": [
        "feel", "feeling", "guilty", "guilt", "anxious", "anxiety",
        "worried", "worry", "stressed", "scared", "sad",
        "lonely", "regret", "cry", "breakdown", "avoid",
        "shame", "hate myself",
    ],
}

URGENCY_KEYWORDS: dict[int, list[str]] = {
    9: ["urgent", "asap", "now", "today", "tonight", "eod", "right now"],
    7: [
        "manager", "boss", "client", "deadline", "due", "interview",
        "tomorrow", "havent", "haven't", "missed", "overdue", "sick",
        "pain", "fever",
    ],
    5: ["this week", "soon", "meeting", "appointment", "scheduled"],
    3: ["someday", "eventually", "maybe", "wish", "want to", "could", "might"],
}

# Keyword → emotional resistance floor. The task's category baseline is also
# considered; the higher of the two wins.
EMOTIONAL_LOAD_KEYWORDS: dict[int, list[str]] = {
    9: ["fire", "quit", "breakup", "confront", "ex-"],
    7: ["manager", "boss", "argue", "apologize", "money", "rent", "bills"],
    5: ["doctor", "parents", "family", "school", "tax"],
    2: ["clean", "groceries", "laundry", "dishes"],
}

# Phrases that drop overall energy and/or trigger overwhelm.
DISTRESS_KEYWORDS_ENERGY: list[str] = [
    "exhausted", "tired", "drained", "no energy", "burnt out",
    "havent slept", "haven't slept", "cant focus", "can't focus",
]
DISTRESS_KEYWORDS_OVERWHELM: list[str] = [
    "too much", "too many", "everything", "all of this", "drowning",
    "overwhelmed", "pending",
]
DISTRESS_KEYWORDS_SHUTDOWN: list[str] = [
    "cant start", "can't start", "stuck", "frozen", "paralyzed",
    "cant move", "can't move", "shutdown", "shut down",
]
DISTRESS_KEYWORDS_EMOTIONAL: list[str] = [
    "anxious", "guilty", "scared", "sad", "hate myself", "lonely",
]
