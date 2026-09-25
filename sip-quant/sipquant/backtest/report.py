"""Tables (console + Markdown/CSV) and PNG charts for backtest results."""
from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")  # render to files; no GUI window needed
import matplotlib.pyplot as plt  # noqa: E402  (import after choosing the backend)
import pandas as pd  # noqa: E402

from . import metrics as M  # noqa: E402

# Colours: fixed order, so a strategy keeps its colour in every chart.
SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"]
NEUTRAL = "#8a8984"
INK, INK_2, GRID, SURFACE = "#0b0b0b", "#52514e", "#e4e3df", "#fcfcfb"

PCT_ROWS = {"XIRR", "XIRR after exit tax", "CAGR (NAV)", "Max drawdown", "Annual turnover (momentum sleeve)"}
RUPEE_ROWS = {"Invested", "Final value", "Tax paid during SIP", "Tax if exited today"}


def metrics_table(results) -> pd.DataFrame:
    """Strategies as columns, metrics as rows, formatted as strings."""
    df = pd.DataFrame({r.name: r.metrics for r in results})
    return df.apply(lambda col: [_fmt(k, v) for k, v in col.items()])


def _fmt(key: str, v) -> str:
    if key in PCT_ROWS:
        return f"{v:.1%}"
    if key in RUPEE_ROWS:
        return f"Rs {v / 1e5:,.2f} L"  # lakhs
    if isinstance(v, float):
        return f"{v:.1f}"
    return str(v)


def to_markdown(df: pd.DataFrame) -> str:
    """Minimal Markdown table (avoids needing the optional 'tabulate' package)."""
    head = "| " + " | ".join([str(df.index.name or "")] + [str(c) for c in df.columns]) + " |"
    sep = "|" + "---|" * (len(df.columns) + 1)
    rows = ["| " + " | ".join([str(i)] + [str(v) for v in row]) + " |" for i, row in zip(df.index, df.values)]
    return "\n".join([head, sep, *rows])


# ------------------------------------------------------------------ charts
def _style(ax, title: str, ylabel: str):
    ax.set_facecolor(SURFACE)
    ax.set_title(title, loc="left", color=INK, fontsize=12, fontweight="bold")
    ax.set_ylabel(ylabel, color=INK_2)
    ax.grid(axis="y", color=GRID, linewidth=0.8)
    ax.tick_params(colors=INK_2, length=0)
    for side in ("top", "right", "left"):
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color(GRID)


def _figure():
    fig, ax = plt.subplots(figsize=(11, 5.5), dpi=130)
    fig.patch.set_facecolor(SURFACE)
    return fig, ax


def chart_values(results, invested: pd.Series, path: Path, subtitle: str):
    fig, ax = _figure()
    ax.plot(invested.index, invested / 1e5, color=NEUTRAL, lw=1.5, ls="--", label="Invested")
    for r, color in zip(results, SERIES):  # zip pairs items up, like iterating two lists together
        ax.plot(r.value.index, r.value / 1e5, color=color, lw=2, label=r.name)
        ax.annotate(f"{r.value.iloc[-1] / 1e5:,.0f}L", (r.value.index[-1], r.value.iloc[-1] / 1e5),
                    xytext=(4, 0), textcoords="offset points", color=INK_2, fontsize=8, va="center")
    _style(ax, "Portfolio value vs benchmarks (same SIP)", "Rs lakh")
    ax.legend(frameon=False, loc="upper left", labelcolor=INK_2)
    fig.text(0.01, 0.01, subtitle, color=INK_2, fontsize=8)
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(path, facecolor=SURFACE)
    plt.close(fig)


def chart_drawdown(main, bench, path: Path, subtitle: str):
    fig, ax = _figure()
    dd = M.drawdown(main.nav) * 100
    ax.fill_between(dd.index, dd, 0, color=SERIES[0], alpha=0.25, lw=0)
    ax.plot(dd.index, dd, color=SERIES[0], lw=1.5, label=main.name)
    dd_b = M.drawdown(bench.nav) * 100
    ax.plot(dd_b.index, dd_b, color=SERIES[1], lw=1.2, label=bench.name)
    _style(ax, "Drawdown from peak (unitised NAV)", "%")
    fig.legend(frameon=False, loc="upper right", labelcolor=INK_2, ncol=2)
    fig.text(0.01, 0.01, subtitle, color=INK_2, fontsize=8)
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(path, facecolor=SURFACE)
    plt.close(fig)


def chart_yearly(results, path: Path, subtitle: str):
    years = pd.DataFrame({r.name: M.calendar_year_returns(r.nav) * 100 for r in results})
    fig, ax = _figure()
    n = len(results)
    width = 0.8 / n
    for k, (name, color) in enumerate(zip(years.columns, SERIES)):
        x = [i + (k - (n - 1) / 2) * width for i in range(len(years))]
        ax.bar(x, years[name], width=width * 0.92, color=color, label=name)
    ax.axhline(0, color=INK_2, lw=0.8)
    ax.set_xticks(range(len(years)))
    ax.set_xticklabels(years.index, rotation=0, fontsize=8)
    _style(ax, "Calendar-year returns (first/last year partial)", "%")
    ax.legend(frameon=False, loc="upper left", labelcolor=INK_2, ncol=n)
    fig.text(0.01, 0.01, subtitle, color=INK_2, fontsize=8)
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(path, facecolor=SURFACE)
    plt.close(fig)
