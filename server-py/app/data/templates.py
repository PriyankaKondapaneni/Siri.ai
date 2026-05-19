"""Tiny-step and rewrite templates. Three actions each: physical setup,
tiny commit, permission to stop."""

TINY_STEPS: dict[str, list[str]] = {
    "communication": [
        "Open the chat or email",
        "Type: \"Quick update —\"",
        "Add one short line and send. Don't reread.",
    ],
    "self_care": [
        "Stand up",
        "Walk to where the thing is (kitchen, fridge, bathroom)",
        "Do the bare minimum. 2 minutes counts.",
    ],
    "survival": [
        "Move toward the thing (kitchen, bathroom, bed)",
        "Pick up one item and use it",
        "Stop when you've done the minimum. That's enough.",
    ],
    "chore": [
        "Set a 2-minute timer",
        "Pick up ONE item near you",
        "Stop when timer ends, or keep going. Either is fine.",
    ],
    "work": [
        "Open the file or doc",
        "Read the first sentence",
        "Type one line. A bad one counts.",
    ],
    "emotional": [
        "Put your phone face down",
        "Drink some water",
        "Write one sentence in any notes app",
    ],
    "other": [
        "Set a 2-minute timer",
        "Start the smallest version of the task",
        "Stop when timer ends. Or keep going.",
    ],
}


def rewrite_for(category: str, raw: str) -> str:
    """Deterministic rewrite based on category + simple text inspection."""
    lower = raw.lower()
    if category == "communication":
        return f"Send 1 line about: {raw}"
    if category == "survival":
        if "eat" in lower or "food" in lower or "hungry" in lower or "eaten" in lower:
            return "Eat anything in reach (snack, fruit, bar)"
        if "water" in lower or "drink" in lower or "thirst" in lower:
            return "Drink one glass of water now"
        if "meds" in lower or "medicine" in lower or "medication" in lower:
            return "Take meds now; set them by your hand"
        if "sleep" in lower or "slept" in lower:
            return "Lie down for 10 min, eyes closed"
        if "pain" in lower or "sick" in lower or "fever" in lower:
            return "Address pain/sickness first — call/message for help if needed"
        return f"Take care of: {raw}"
    if category == "self_care":
        if any(w in lower for w in ("eat", "hungry", "food", "meal", "breakfast", "lunch", "dinner", "eaten")):
            return "Eat anything in reach (snack, fruit, bar)"
        if any(w in lower for w in ("drink", "water", "thirst")):
            return "Drink one glass of water now"
        if any(w in lower for w in ("sleep", "slept", "tired", "rest", "nap")):
            return "Lie down for 10 min, eyes closed"
        if "shower" in lower or "bathe" in lower or "bath" in lower:
            return "Get in the shower; even 3 minutes counts"
        return f"Take care of: {raw}"
    if category == "chore":
        return f"5 min on: {raw}"
    if category == "work":
        return f"Open it; 10 min on: {raw}"
    if category == "emotional":
        return "Write 1 line about it in notes. Don't try to fix it."
    return f"5 min on: {raw}"
