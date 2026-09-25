"""Shared command-line plumbing for the live commands."""
from __future__ import annotations

import argparse
import logging

from ..config import load_config
from .context import LiveContext, build_context


def parse(prog: str, description: str, extra=None) -> tuple[argparse.Namespace, LiveContext]:
    ap = argparse.ArgumentParser(prog=prog, description=description)
    ap.add_argument("--synthetic", action="store_true", help="fake market (for trying the tool offline)")
    ap.add_argument("--no-download", action="store_true", help="use cached prices only")
    ap.add_argument("--config")
    ap.add_argument("-v", "--verbose", action="store_true")
    if extra:
        extra(ap)
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING,
                        format="%(levelname)s %(name)s: %(message)s")
    cfg = load_config(args.config)
    ctx = build_context(cfg, synthetic=args.synthetic, update=not args.no_download)
    if args.synthetic:
        print("*** SYNTHETIC DATA - for trying the tool only, not real prices ***\n")
    return args, ctx
