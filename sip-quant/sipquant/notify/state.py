"""A small JSON file remembering what was already sent, so nothing is sent twice."""
from __future__ import annotations

import json
from pathlib import Path


def load_state(path: str | Path) -> dict:
    path = Path(path)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


def save_state(path: str | Path, state: dict) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, indent=2, sort_keys=True, default=str), encoding="utf-8")
    tmp.replace(path)  # atomic on the same disk: a crash never leaves a half-written file
