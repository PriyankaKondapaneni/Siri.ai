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
- [x] Module 4 `sipquant/live`: monthly buy list, quarterly rebalance list with tax estimates, portfolio tracker
- [x] Module 5 `sipquant/notify`: Telegram reports and alerts, optional neutral news summaries, scheduling

## Setup

```bash
cd sip-quant
python3.11 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m pytest                     # should say "65 passed"
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
- **Fundamentals**: Yahoo's summary (`.info`) has no ROE for most NSE stocks. When it's missing, ROE is calculated from the annual statements as net income ÷ average shareholders' equity, and D/E as total debt ÷ equity. The report says how many stocks needed this. Requests are spaced out, retried with increasing waits, and stopped after 5 failures in a row. A failed fetch is *not* saved as "missing"; it is retried on the next run. The report tells apart "Yahoo has no such field" and "Yahoo returned nothing".
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
4. The momentum money plus any sale proceeds buys the picks. Cash goes to the names furthest below equal weight, so winners are never trimmed (trimming would trigger tax), yet weights drift back towards equal. Only whole shares are bought, and only when a share brings the name closer to its target. A ₹2,500 share isn't bought against a ₹660 target; that name's shortfall builds up until a share is justified. Leftover rupees go to the Nifty 50 bucket.
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

## Monthly use (Module 4)

Keep `holdings.csv` in the project folder, one row per purchase (see `holdings.example.csv`):

```
symbol,qty,buy_date,buy_price
RELIANCE,4,2025-07-01,1512.40
NIFTYBEES,20,2025-07-01,281.35
```

Add a row each time you buy. When you sell, remove the oldest rows (FIFO) or reduce their quantity. Index ETFs listed under `live.instruments` in `config.yaml` count as the index buckets, and everything else counts as the stock sleeve.

```bash
python -m sipquant.monthly     # this month: split of Rs 25,000, the 15 picks with share quantities, ETF units
python -m sipquant.rebalance   # sells (rank below 25 or filtered out) with estimated tax, and buys from the proceeds
python -m sipquant.rebalance --realised-ltcg 80000   # if you already booked Rs 80k LTCG this FY elsewhere
python -m sipquant.tracker     # value, invested, XIRR, drawdown from peak, per-holding returns
```

**Zerodha users:** instead of typing rows by hand, download your tradebook from console.zerodha.com → Reports → Tradebook (segment **Equity**) → CSV. Then run:

```bash
python -m sipquant.import_zerodha ~/Downloads/tradebook-*.csv   # add --dry-run to preview
```

- Buy fills of a stock on the same day become one lot at the average price.
- Sells are matched against the oldest lots first (FIFO, the same order the tax rules use).
- Trades that appear in more than one file are counted once, so overlapping downloads are fine.
- An existing `holdings.csv` is backed up before it's replaced.
- Splits and bonuses aren't in the tradebook. After one, fix that stock's `qty` and `buy_price` by hand.

All three accept `--synthetic` to try them without real data, and `--no-download` to use the cache only.

- They use the same rules as the backtest: ranking, sell buffer, allocation to the most under-weight names, and whole shares.
- Leftover stock money goes to the Nifty 50 bucket. ETF amounts that don't make a whole unit are carried to next month.
- Before 15:45 IST, today's partial price bar is ignored, so a 9:30 run uses yesterday's close.
- Set `live.index_buckets_as: amount` if you use index mutual funds; you then get rupee amounts instead of ETF units.
- The tracker's XIRR covers only what's in `holdings.csv`, because sold lots aren't recorded there.

## Notifications and scheduling (Module 5)

1. Create a bot: in Telegram, message **@BotFather** → `/newbot` → copy the token. Send your new bot any message. Then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy the `"chat":{"id": ...}` number.
2. `cp .env.example .env` and fill in `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. You can also add `ANTHROPIC_API_KEY` for news summaries. `.env` is git-ignored; keys never go in code or config.
3. `python -m sipquant.notify test` sends a test message.
4. `python -m sipquant.notify daily --dry-run` prints what would be sent, without sending it.

`daily` is the only command to schedule. Run it every weekday at 09:30 IST. It:
- sends the **monthly report** (buy plan, portfolio status, optional news) on the first trading day of the month. If your computer was off that day, it sends on the next run instead. `data/state.json` stops it from sending twice.
- adds the **rebalance list** in rebalance months (Jan/Apr/Jul/Oct).
- sends **alerts** whenever one fires:
  - a holding is more than 25% below your average buy price
  - the regime flips (the Nifty 500 crosses its 200-day average)
  - portfolio drawdown crosses −20% or −30%

  Each alert fires once, and fires again only after the condition clears.

Add each year's NSE holidays to `live.nse_holidays` (from nseindia.com → Holidays), so "first trading day" skips them.

**News summaries** run only if `ANTHROPIC_API_KEY` is set. For each stock you hold, recent yfinance headlines go to Claude (`news.model`, default `claude-opus-5`) with instructions to write 2–3 neutral, factual sentences, with no opinions, predictions, targets or buy/sell/hold language. Two safeguards back this up:
- A filter also withholds any summary that still contains advice-like wording.
- Requests use the API's server-side refusal fallback (`fallbacks: "default"`).

**Scheduling examples** (fix the paths in each):
- macOS (recommended on a laptop): `scripts/com.sipquant.daily.plist` for launchd. It runs a missed job as soon as the Mac wakes.
- Linux / macOS cron: `scripts/crontab.example`. It calls `scripts/run_daily.sh`.
- Windows: `scripts/windows_task.txt` (a `schtasks` command) and `scripts/run_daily.bat`.

The scripts write to `logs/notify.log`. Point `SIPQUANT_PYTHON` at your environment's Python (`conda activate sipquant && which python`).

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
sipquant/live/              holdings.py, context.py (data + "as of" date), plan.py (monthly/rebalance), tracker.py
sipquant/monthly.py, rebalance.py, tracker.py   the `python -m sipquant.<name>` commands
sipquant/notify/            telegram.py, alerts.py, news.py, state.py, __main__.py (python -m sipquant.notify)
scripts/                    cron, launchd (macOS) and Windows Task Scheduler examples
tests/                      pytest: XIRR, FIFO tax + FY exemption, momentum, buffer, cache, engine, live, notify
```

### Python notes for Java developers

- `python -m sipquant.backtest` runs `sipquant/backtest/__main__.py` (the "main class" of a package).
- `@dataclass` generates a constructor, `equals` and `toString`, much like a Java `record`.
- pandas `DataFrame` operations are vectorised: `adj.shift(21) / adj.shift(252) - 1` computes the return for every stock on every date with no loops. `shift(n)` looks back n rows.
- `from __future__ import annotations` just allows modern type hints. Hints are not enforced at runtime.
- Dicts are used for config instead of POJOs. `with_overrides(cfg, {"strategy.rebalance": "monthly"})` returns a modified deep copy.
