"""Tiny-step breakdown. Generates all three variants per task so the client
can switch between them, and exposes the single shutdown permission line."""
from app.data.templates import TINY_STEPS
from app.models.task import ActionStep


def _steps(texts: list[str]) -> list[ActionStep]:
    return [ActionStep(order=i + 1, text=t) for i, t in enumerate(texts)]


def _variants(category: str) -> dict[str, list[str]]:
    return TINY_STEPS.get(category, TINY_STEPS["other"])


def normal_steps(category: str) -> list[ActionStep]:
    return _steps(_variants(category)["normal"])


def low_energy_steps(category: str) -> list[ActionStep]:
    return _steps(_variants(category)["low_energy"])


def shutdown_step(category: str) -> ActionStep:
    texts = _variants(category)["shutdown"]
    return ActionStep(order=1, text=texts[0])


def primary_steps(category: str, energy_mode: str) -> list[ActionStep]:
    """The step list the UI should lead with, based on the user's energy mode."""
    if energy_mode == "shutdown":
        return [shutdown_step(category)]
    if energy_mode == "low_energy":
        return low_energy_steps(category)
    return normal_steps(category)
