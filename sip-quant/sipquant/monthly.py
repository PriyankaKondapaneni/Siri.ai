"""``python -m sipquant.monthly`` - this month's SIP buy list (stocks + index ETFs)."""
from .live.cli import parse
from .live.plan import format_monthly, monthly_plan

if __name__ == "__main__":  # runs only when executed with `python -m`, not on import
    _, ctx = parse("python -m sipquant.monthly", __doc__)
    print(format_monthly(monthly_plan(ctx)))
