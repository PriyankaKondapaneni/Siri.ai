"""``python -m sipquant.import_zerodha tradebook.csv [more.csv ...]`` - build holdings.csv from Zerodha.

Download from console.zerodha.com -> Reports -> Tradebook (segment: Equity) -> CSV.
An existing holdings.csv is backed up (holdings.csv.bak-<timestamp>) before it's replaced.
Use --dry-run to only print the result.
"""
import argparse
import shutil
import sys
from datetime import datetime

from .config import load_config, resolve_path
from .live.zerodha import holdings_from_trades, read_tradebooks


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="python -m sipquant.import_zerodha", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("tradebooks", nargs="+", help="Console tradebook CSV file(s)")
    ap.add_argument("--dry-run", action="store_true", help="print the holdings, don't write the file")
    ap.add_argument("--config")
    args = ap.parse_args(argv)

    lots, warnings = holdings_from_trades(read_tradebooks(args.tradebooks))
    for w in warnings:
        print(f"WARNING: {w}", file=sys.stderr)
    print(lots.to_string(index=False) if not lots.empty else "(no open positions in these trades)")
    if args.dry_run:
        return 0

    out = resolve_path(load_config(args.config)["live"]["holdings_csv"])
    if out.exists():
        backup = out.with_name(f"{out.name}.bak-{datetime.now():%Y%m%d-%H%M%S}")
        shutil.copy2(out, backup)  # like Files.copy(..., COPY_ATTRIBUTES)
        print(f"\nBacked up the old file to {backup.name}")
    lots.to_csv(out, index=False)
    print(f"Wrote {len(lots)} lot(s) to {out}. Check it with: python -m sipquant.tracker")
    return 0


if __name__ == "__main__":
    sys.exit(main())
