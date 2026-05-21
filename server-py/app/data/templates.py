"""Tiny-step and rewrite templates.

Each category exposes three variants:
  normal      — 3 steps: physical setup, tiny commit, permission to stop.
  low_energy  — 1–2 steps, the minimum that still counts as 'doing it'.
  shutdown    — a single permission-to-skip line. Always opt-out.

The breakdown engine picks a variant based on assessment.energy_mode.
"""

TINY_STEPS: dict[str, dict[str, list[str]]] = {
    "communication": {
        "normal": [
            "Open the chat or email",
            "Type: \"Quick update —\"",
            "Add one short line and send. Don't reread.",
        ],
        "low_energy": [
            "Open the chat",
            "Send: \"I'll reply properly later — just wanted to acknowledge.\"",
        ],
        "shutdown": [
            "Drafts are not failures. This can wait until tomorrow.",
        ],
    },
    "self_care": {
        "normal": [
            "Stand up",
            "Walk to where the thing is (kitchen, fridge, bathroom)",
            "Do the bare minimum. 2 minutes counts.",
        ],
        "low_energy": [
            "Reach for the closest version of what you need",
            "Done. That counts.",
        ],
        "shutdown": [
            "Wet wipes are fine. Crackers are food. You're allowed to skip.",
        ],
    },
    "survival": {
        "normal": [
            "Move toward the thing (kitchen, bathroom, bed)",
            "Pick up one item and use it",
            "Stop when you've done the minimum. That's enough.",
        ],
        "low_energy": [
            "Grab whatever is within arm's reach and use it",
            "That counts.",
        ],
        "shutdown": [
            "It's okay to ask someone to bring you food/water.",
        ],
    },
    "chore": {
        "normal": [
            "Set a 2-minute timer",
            "Pick up ONE item near you",
            "Stop when timer ends, or keep going. Either is fine.",
        ],
        "low_energy": [
            "Move ONE visible item near you to where it belongs",
            "Done. The rest can wait.",
        ],
        "shutdown": [
            "The mess can wait. You're not the mess.",
        ],
    },
    "work": {
        "normal": [
            "Open the file or doc",
            "Read the first sentence",
            "Type one line. A bad one counts.",
        ],
        "low_energy": [
            "Open the file. Look at it for 30 seconds.",
            "Close it. You've made contact.",
        ],
        "shutdown": [
            "Work brain is offline today. Skip this one.",
        ],
    },
    "emotional": {
        "normal": [
            "Put your phone face down",
            "Drink some water",
            "Write one sentence in any notes app",
        ],
        "low_energy": [
            "Notice the feeling without trying to fix it",
            "That's enough engagement for now.",
        ],
        "shutdown": [
            "Feelings don't need solving today. Rest.",
        ],
    },
    "other": {
        "normal": [
            "Set a 2-minute timer",
            "Start the smallest version of the task",
            "Stop when timer ends. Or keep going.",
        ],
        "low_energy": [
            "Pick the smallest part of it",
            "Do that. Stop.",
        ],
        "shutdown": [
            "Today is not the day. That's allowed.",
        ],
    },
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
