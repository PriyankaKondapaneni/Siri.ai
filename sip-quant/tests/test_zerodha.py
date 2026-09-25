"""Zerodha tradebook -> holdings.csv."""
import pandas as pd
import pytest

from sipquant import import_zerodha
from sipquant.live.holdings import load_holdings
from sipquant.live.zerodha import holdings_from_trades, read_tradebooks

HEADER = "symbol,isin,trade_date,exchange,segment,series,trade_type,auction,quantity,price,trade_id,order_id,order_execution_time\n"


def tb(tmp_path, rows, name="tb.csv"):
    p = tmp_path / name
    p.write_text(HEADER + "\n".join(rows) + "\n")
    return p


def row(sym, date, side, qty, price, tid, t="09:20:00"):
    return f"{sym},INE000,{date},NSE,EQ,EQ,{side},false,{qty},{price},{tid},O{tid},{date}T{t}"


def test_partial_fills_merge_into_one_lot(tmp_path):
    p = tb(tmp_path, [row("RELIANCE", "2026-10-01", "buy", 2, 1400, 1),
                      row("RELIANCE", "2026-10-01", "buy", 1, 1403, 2)])
    lots, warns = holdings_from_trades(read_tradebooks([p]))
    assert warns == []
    assert lots.to_dict("records") == [{"symbol": "RELIANCE", "qty": 3, "buy_date": "2026-10-01",
                                        "buy_price": pytest.approx((2 * 1400 + 1403) / 3)}]


def test_sells_consume_oldest_lots_first(tmp_path):
    p = tb(tmp_path, [row("BEL", "2026-10-01", "buy", 5, 400, 1),
                      row("BEL", "2026-11-02", "buy", 5, 420, 2),
                      row("BEL", "2027-01-01", "sell", 7, 450, 3),
                      row("INFY", "2026-11-02", "buy", 2, 1500, 4),
                      row("INFY", "2027-01-01", "sell", 2, 1550, 5)])
    lots, warns = holdings_from_trades(read_tradebooks([p]))
    assert warns == []
    assert lots.to_dict("records") == [{"symbol": "BEL", "qty": 3, "buy_date": "2026-11-02", "buy_price": 420.0}]


def test_duplicate_trades_across_files_and_non_equity_rows_are_dropped(tmp_path):
    a = tb(tmp_path, [row("NIFTYBEES", "2026-10-01", "buy", 20, 284.1, 1)], "a.csv")
    b = tb(tmp_path, [row("NIFTYBEES", "2026-10-01", "buy", 20, 284.1, 1),     # same trade_id: duplicate
                      "NIFTY26OCTFUT,,2026-10-01,NFO,FO,,buy,false,75,25000,9,O9,2026-10-01T10:00:00"], "b.csv")
    lots, _ = holdings_from_trades(read_tradebooks([a, b]))
    assert lots["qty"].tolist() == [20] and lots["symbol"].tolist() == ["NIFTYBEES"]


def test_selling_more_than_bought_warns(tmp_path):
    p = tb(tmp_path, [row("TCS", "2027-01-01", "sell", 3, 4000, 1)])
    lots, warns = holdings_from_trades(read_tradebooks([p]))
    assert lots.empty and "TCS" in warns[0]


def test_day_first_dates_are_understood(tmp_path):
    p = tmp_path / "x.csv"
    p.write_text("Symbol,Trade Date,Trade Type,Quantity,Price\nBEL,02-10-2026,BUY,4,401.5\n")
    lots, _ = holdings_from_trades(read_tradebooks([p]))
    assert lots.iloc[0]["buy_date"] == "2026-10-02"


def test_missing_columns_explain_themselves(tmp_path):
    p = tmp_path / "wrong.csv"
    p.write_text("a,b\n1,2\n")
    with pytest.raises(ValueError, match="tradebook"):
        read_tradebooks([p])


def test_cli_writes_valid_holdings_and_backs_up(tmp_path, monkeypatch):
    out = tmp_path / "holdings.csv"
    out.write_text("symbol,qty,buy_date,buy_price\n")
    monkeypatch.setattr(import_zerodha, "resolve_path", lambda _p: out)
    p = tb(tmp_path, [row("BEL", "2026-10-01", "buy", 5, 400, 1)])
    assert import_zerodha.main([str(p)]) == 0
    lots = load_holdings(out)                          # readable by the rest of the tool
    assert lots["ticker"].tolist() == ["BEL.NS"] and lots["qty"].tolist() == [5]
    assert len(list(tmp_path.glob("holdings.csv.bak-*"))) == 1
