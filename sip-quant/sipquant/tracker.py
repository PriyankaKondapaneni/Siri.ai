"""``python -m sipquant.tracker`` - current value, invested, XIRR and drawdown of holdings.csv."""
from .live.cli import parse
from .live.tracker import format_status, portfolio_status

if __name__ == "__main__":
    _, ctx = parse("python -m sipquant.tracker", __doc__)
    print(format_status(portfolio_status(ctx)))
