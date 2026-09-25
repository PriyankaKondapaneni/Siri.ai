"""Loading config.yaml and making modified copies of it for backtest variants.

The config is kept as a plain nested ``dict`` (what PyYAML returns). In Java you
might map it onto POJOs; in Python a dict is idiomatic for this and lets us
override any key with a dotted path such as ``"strategy.quality.enabled"``.
"""
from __future__ import annotations  # lets us write type hints like `dict[str, Any]` freely

import copy
from pathlib import Path
from typing import Any

import yaml

# Project root = the folder that contains config.yaml (two levels up from this file).
# `Path(__file__)` is this .py file; `.resolve().parents[1]` walks up like getParent() twice.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG_PATH = PROJECT_ROOT / "config.yaml"


def load_config(path: str | Path | None = None) -> dict[str, Any]:
    """Read config.yaml and sanity-check it."""
    path = Path(path) if path else DEFAULT_CONFIG_PATH
    with open(path, encoding="utf-8") as fh:  # `with` = try-with-resources
        cfg = yaml.safe_load(fh)
    _validate(cfg)
    return cfg


def _validate(cfg: dict[str, Any]) -> None:
    total = sum(cfg["allocation"].values())
    if abs(total - 1.0) > 1e-6:
        raise ValueError(f"allocation must sum to 1.0, got {total}")
    if cfg["strategy"]["sell_rank_buffer"] < cfg["strategy"]["top_n"]:
        raise ValueError("strategy.sell_rank_buffer must be >= strategy.top_n")
    if cfg["strategy"]["rebalance"] not in ("monthly", "quarterly", "semiannual"):
        raise ValueError("strategy.rebalance must be monthly | quarterly | semiannual")


def with_overrides(cfg: dict[str, Any], overrides: dict[str, Any]) -> dict[str, Any]:
    """Return a deep copy of ``cfg`` with dotted-path keys replaced.

    >>> with_overrides(cfg, {"strategy.quality.enabled": False})
    """
    new = copy.deepcopy(cfg)  # deep copy so variants never mutate the original
    for dotted, value in overrides.items():
        node = new
        *parents, leaf = dotted.split(".")  # "a.b.c" -> parents=["a","b"], leaf="c"
        for key in parents:
            node = node[key]
        node[leaf] = value
    _validate(new)
    return new


def resolve_path(p: str | Path) -> Path:
    """Paths in config.yaml are relative to the project root, not the CWD."""
    p = Path(p)
    return p if p.is_absolute() else PROJECT_ROOT / p
