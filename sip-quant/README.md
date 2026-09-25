# sip-quant

A personal, local-only tool to backtest (and later run) a ₹25,000/month SIP split across:

| Bucket | Default | Instrument |
|---|---|---|
| Momentum-quality stocks | 40% | Top 15 Nifty 500 stocks by risk-adjusted 12-1 momentum, with liquidity and quality filters |
| Nifty Midcap 150 | 25% | Index/ETF proxy ticker (see `config.yaml`) |
| Nifty 50 | 25% | `NIFTYBEES.NS` (falls back to `^NSEI`) |
| Gold | 10% | `GOLDBEES.NS` |

All numbers (allocation, filters, costs, tax rates, tickers) are in `config.yaml`.

> **Disclaimer.** This is for personal use only. It is **not investment advice** and must not be
> shared or presented as stock recommendations: under SEBI (Research Analysts) Regulations only
> registered research analysts may do that. Backtests are hypothetical and past performance
> doesn't predict future returns. Every backtest output warns you about survivorship bias and
> fundamentals look-ahead bias because they are real and large.

## Status

- [x] Module 1 `sipquant/data` — universe CSV, Parquet price cache with incremental updates, fundamentals cache
- [x] Module 2 `sipquant/strategy` — liquidity, momentum, quality, regime, top-N with sell buffer
- [x] Module 3 `sipquant/backtest` — SIP simulator, costs, FIFO capital-gains tax, metrics, benchmarks, variants, charts
- [ ] Module 4 `live` (monthly buy list, rebalance list, tracker)
- [ ] Module 5 `notify` (Telegram, optional Claude news summaries, scheduling)

## Setup

```bash
cd sip-quant
python3.11 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m pytest                     # should say "40 passed"
```

Get the constituent list: go to niftyindices.com → Indices → Broad Market → **Nifty 500** →
"Download Index Constituents". Save the file as `data/nifty500.csv`. The official
columns work unchanged; at minimum the file needs `Symbol` and `Industry`
(see `data/nifty500.example.csv`).

## Run the backtest first

```bash
python -m sipquant.backtest               # downloads prices on the first run, then uses the cache
python -m sipquant.backtest --no-download # cache only (offline)
python -m sipquant.backtest --no-variants # skip the 8-variant grid
python -m sipquant.backtest --synthetic   # fake random market; checks the pipeline, numbers are meaningless
```

The first run downloads roughly 500 tickers from Yahoo (a few minutes) plus fundamentals, one
request per ticker (10–20 minutes). Later runs only fetch the new days. Outputs go to `output/`:

| File | Contents |
|---|---|
| `report.md` | Warnings, comparison table, variants table, tax by financial year |
| `portfolio_vs_benchmarks.png` | Value of the same SIP in each strategy vs amount invested |
| `drawdown.png` | Drawdown from peak for the portfolio and the Nifty 50 SIP |
| `yearly_returns.png` | Calendar-year returns, portfolio vs Nifty 50 |
| `comparison.csv`, `trades.csv`, `tax_by_fy.csv`, `picks.csv` | Raw data |

### Sanity checks printed with every run

- **Price repair** (`sipquant/data/clean.py`): NSE prices almost never move more than 35% in a day. When one does, the tool checks for two known Yahoo errors:
  - a *bad print*: the price comes back within 5 days. Those days are removed.
  - an *unadjusted split*: the jump is close to 1/2, 1/5, 1/10 and so on, and the price stays there. Earlier prices are rescaled to match.

  Every fix is listed in the log and in `report.md`. For example, NIFTYBEES had a one-day bad print in Dec 2019 that showed up as a −90% "drawdown".
- **Fundamentals**: requests are spaced out, retried with increasing waits, and stopped after 5 failures in a row. A failed fetch is *not* saved as "missing"; it is retried on the next run. The report tells apart "Yahoo has no such field" and "Yahoo returned nothing".
- **Diagnostic rows** in the comparison table:
  - *Eligible stocks at rebalance*: should be well above 25. If it isn't, the filters are starving the strategy.
  - *Stocks held*: should be about 15.
  - *Momentum money → Nifty 50*: the share of stock money redirected by the regime rule, and the share left over from whole-share rounding.

### What the metrics mean

- **XIRR**: money-weighted return on your actual SIP cash flows. This is the number to compare with your broker's XIRR.
- **XIRR after exit tax**: the same, but the final value is reduced by the costs and capital-gains tax you would pay if you sold everything on the last day. Strategies that pay tax as they go (momentum) and strategies that defer it (index) only compare fairly on this line.
- **CAGR (NAV)**, **Max drawdown**, **Longest underwater**, **Worst year**: measured on a unit NAV, the way a mutual fund reports it. Each SIP buys units at that day's NAV, so the numbers show the strategy's performance without the effect of new money coming in.
- **Annual turnover**: rupees sold from the momentum sleeve per year ÷ the sleeve's average value.
- **Tax paid during SIP**: capital-gains tax deducted from cash as sales happened.

## How the simulation works

On the first trading day of each month:

1. ₹25,000 is split by `allocation`.
2. **Regime rule** (toggle `strategy.regime.enabled`): if the Nifty 500 (`^CRSLDX`, or the Nifty 50 as fallback) closed below its 200-day SMA the day before, that month's momentum money goes to the Nifty 50 bucket. Existing stock holdings are kept.
3. **Rebalance months** (`strategy.rebalance`: quarterly = Jan/Apr/Jul/Oct, or monthly): the stocks are ranked. A holding is sold only if its rank drops **below 25** (`sell_rank_buffer`) or it fails a filter. The empty slots are filled from the top of the ranking, giving 15 names.
4. The momentum money plus any sale proceeds buys the picks. Cash goes to the names furthest below equal weight, so winners are never trimmed (trimming would trigger tax), yet weights drift back towards equal. Only whole shares are bought, and leftover rupees go to the Nifty 50 bucket.
5. Index buckets are bought as fractional units and never sold.

Ranking uses the day before the trade, and trades fill at the day's close ± 0.1% slippage plus 0.1% charges per side.

**Signals**
- Liquidity: 63-day median of close × volume above ₹5 crore, and price above ₹50.
- Momentum: return from 12 months ago to 1 month ago ÷ annualised 12-month daily volatility.
- Quality: ROE above 15%, D/E below 1, EPS above 0. If Yahoo has no value for any of these, the stock fails.

**Tax** (`sipquant/backtest/tax.py`)
- FIFO lots. A sale is long-term if made **more than 12 months** after purchase.
- STCG is 20%. LTCG is 12.5% on the financial year's net LTCG above ₹1.25 lakh (FY = April to March).
- Short-term losses offset ST gains first, then LT gains. LT losses offset LT gains only. Unused losses carry forward.
- Each sale is charged the change in that FY's total tax. A later loss in the same FY therefore refunds tax already paid.

**Comparisons.** Every comparison uses the same simulator, costs and taxes:
- (a) a Nifty 50-only SIP
- (b) Nifty 200 Momentum 30: the real ETF `MOM30IETF.NS` only exists from 2022, so a proxy is built instead and labelled `(PROXY)`. It takes the 200 most-traded names, holds the top 30 by the same score, rebalances semi-annually and applies no filters.
- (c) the momentum sleeve on its own (100% of the SIP)

The variants table runs the 4-bucket portfolio with quality on/off × regime on/off × monthly/quarterly rebalancing.

## Known biases and simplifications (read before trusting any number)

- **Survivorship bias**: the universe is today's Nifty 500. Companies that collapsed or were dropped since 2011 aren't in it, so real returns are likely lower. This is the biggest caveat.
- **Look-ahead in fundamentals**: Yahoo only has current ROE, D/E and EPS, and the backtest applies them to 2011. Compare the `Q:off` rows to see how much of the result depends on this.
- **Banks and NBFCs** often have no `debtToEquity` on Yahoo, so they fail the quality filter. That excludes much of the financial sector. You may want to exempt the Financial Services industry, or turn quality off.
- **Prices**: Yahoo *adjusted* closes are used for returns (dividends reinvested). The ₹50 filter uses split-adjusted close, so a stock that later split looks cheaper in the past than it really was. Yahoo data for small NSE names has gaps and errors.
- **Index proxies**: `^NSEI`/`^CRSMID`-type indices are price indices (no dividends) and have no expense ratio. ETF tickers are used first where available. The midcap proxy that was actually used is printed in the output.
- **Tax**: today's rates (20% / 12.5% / ₹1.25 L) are applied to all years, which is conservative before July 2024 (15% / 10% / ₹1 L, and LTCG was exempt before Feb 2018). Not modelled: cess, surcharge, grandfathering, the 8-year limit on loss carry-forward, and tax on dividends.
- Costs are a flat percentage. DP charges per sell and the ₹20 minimum brokerage on small orders are ignored, and those matter on ₹600 orders.

## Project layout

```
config.yaml                 every tunable number
sipquant/config.py          load config, make variant copies (dotted-key overrides)
sipquant/data/              universe.py, prices.py (Parquet cache), fundamentals.py, market.py, synthetic.py
sipquant/strategy/          signals.py (filters, momentum, regime), selection.py (ranking, buffer)
sipquant/backtest/          engine.py, tax.py, metrics.py, benchmarks.py, report.py, __main__.py
tests/                      pytest: XIRR, FIFO tax + FY exemption, momentum, buffer, cache, engine smoke
```

### Python notes for Java developers

- `python -m sipquant.backtest` runs `sipquant/backtest/__main__.py` (the "main class" of a package).
- `@dataclass` generates a constructor, `equals` and `toString`, much like a Java `record`.
- pandas `DataFrame` operations are vectorised: `adj.shift(21) / adj.shift(252) - 1` computes the return for every stock on every date with no loops. `shift(n)` looks back n rows.
- `from __future__ import annotations` just allows modern type hints. Hints are not enforced at runtime.
- Dicts are used for config instead of POJOs. `with_overrides(cfg, {"strategy.rebalance": "monthly"})` returns a modified deep copy.
