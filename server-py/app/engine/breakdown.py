from app.data.templates import TINY_STEPS
from app.models.task import ActionStep


def steps_for(category: str) -> list[ActionStep]:
    template = TINY_STEPS.get(category, TINY_STEPS["other"])
    return [ActionStep(order=i + 1, text=text) for i, text in enumerate(template)]
