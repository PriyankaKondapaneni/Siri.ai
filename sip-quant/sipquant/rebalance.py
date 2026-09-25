"""``python -m sipquant.rebalance`` - quarterly sell/buy list vs holdings.csv, with estimated tax."""
from .live.cli import parse
from .live.plan import format_rebalance, rebalance_plan


def _args(ap):
    ap.add_argument("--realised-stcg", type=float, default=0.0,
                    help="short-term gains you've already booked this financial year (Rs)")
    ap.add_argument("--realised-ltcg", type=float, default=0.0,
                    help="long-term gains already booked this FY (uses up the Rs 1.25 L exemption)")


if __name__ == "__main__":
    args, ctx = parse("python -m sipquant.rebalance", __doc__, _args)
    print(format_rebalance(rebalance_plan(ctx, args.realised_stcg, args.realised_ltcg)))
