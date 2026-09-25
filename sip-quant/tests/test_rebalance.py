import pandas as pd
import pytest

from sipquant.backtest.engine import allocate_to_picks
from sipquant.strategy.selection import select_with_buffer


def ranked(names):
    return pd.DataFrame({"rank": range(1, len(names) + 1)}, index=names)


UNIVERSE = [f"S{i:02d}" for i in range(1, 41)]  # S01 is rank 1 ... S40 is rank 40


def test_holdings_within_buffer_are_kept():
    holdings = ["S20", "S25", "S26", "S03"]
    sel = select_with_buffer(ranked(UNIVERSE), holdings, top_n=15, sell_rank=25)
    assert set(sel.keep) == {"S20", "S25", "S03"}   # rank 20 and 25 stay thanks to the buffer
    assert sel.sell == ["S26"]                      # rank 26 is below the buffer
    assert len(sel.final) == 15
    # Empty slots are filled with the best names not already held.
    assert sel.buy == [f"S{i:02d}" for i in (1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13)]


def test_unranked_holding_is_sold():
    sel = select_with_buffer(ranked(UNIVERSE), ["GONE", "S01"], top_n=15, sell_rank=25)
    assert sel.sell == ["GONE"]
    assert "S01" in sel.keep


def test_no_churn_when_all_holdings_inside_buffer():
    holdings = [f"S{i:02d}" for i in range(11, 26)]  # ranks 11..25, none in the top 10
    sel = select_with_buffer(ranked(UNIVERSE), holdings, top_n=15, sell_rank=25)
    assert sel.sell == [] and sel.buy == []
    assert sorted(sel.final) == sorted(holdings)


def test_without_buffer_the_same_portfolio_churns():
    holdings = [f"S{i:02d}" for i in range(11, 26)]
    sel = select_with_buffer(ranked(UNIVERSE), holdings, top_n=15, sell_rank=15)
    assert len(sel.sell) == 10 and len(sel.buy) == 10


def test_keeps_best_top_n_if_more_holdings_qualify():
    holdings = [f"S{i:02d}" for i in range(1, 21)]  # 20 holdings, top_n 15
    sel = select_with_buffer(ranked(UNIVERSE), holdings, top_n=15, sell_rank=25)
    assert sel.final == [f"S{i:02d}" for i in range(1, 16)]
    assert sel.sell == [f"S{i:02d}" for i in range(16, 21)]


def test_whole_share_allocation_never_overspends_and_favours_underweights():
    picks = ["CHEAP", "MID", "PRICEY"]
    cost = {"CHEAP": 99.0, "MID": 1_450.0, "PRICEY": 30_000.0}
    held = {"CHEAP": 5_000.0, "MID": 0.0, "PRICEY": 0.0}
    qty = allocate_to_picks(10_000.0, picks, held, cost, whole_shares=True)
    spent = sum(q * cost[t] for t, q in qty.items())
    assert spent <= 10_000.0
    assert "PRICEY" not in qty            # unaffordable: money goes elsewhere
    assert qty["MID"] >= 3                # most under-weight affordable name gets the bulk
    assert all(float(q).is_integer() for q in qty.values())


def test_fractional_allocation_spends_everything():
    qty = allocate_to_picks(9_000.0, ["A", "B", "C"], {}, {"A": 10.0, "B": 20.0, "C": 30.0}, whole_shares=False)
    assert sum(q * c for q, c in zip(qty.values(), (10.0, 20.0, 30.0))) == pytest.approx(9_000.0)
