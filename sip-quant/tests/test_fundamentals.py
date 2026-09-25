"""Fundamentals cache: failed fetches must be retried, not cached as 'missing'."""
import numpy as np
import pytest
import pandas as pd

from sipquant.data import fundamentals as F


def fake_fetch(results):
    def fetch(ticker):
        ok = results[ticker]
        return {"roe": 0.2 if ok else np.nan, "debt_to_equity": 0.1 if ok else np.nan,
                "eps": 5.0 if ok else np.nan, "fetched_at": pd.Timestamp.now(), "ok": ok,
                "source": "info", "schema": F.SCHEMA}
    return fetch


def test_failed_fetches_are_retried_next_run(tmp_path, monkeypatch):
    calls = []
    results = {"A.NS": True, "B.NS": False}
    monkeypatch.setattr(F, "fetch_one", lambda t: (calls.append(t), fake_fetch(results)(t))[1])
    cache = F.FundamentalsCache(tmp_path, delay_seconds=0)

    cache.update(["A.NS", "B.NS"], max_age_days=30)
    assert calls == ["A.NS", "B.NS"]

    results["B.NS"] = True
    out = cache.update(["A.NS", "B.NS"], max_age_days=30)
    assert calls[2:] == ["B.NS"]            # A is fresh and OK; only failed B is retried
    assert out.loc["B.NS", "roe"] == 0.2


def test_stops_after_consecutive_failures(tmp_path, monkeypatch):
    tickers = [f"T{i}.NS" for i in range(20)]
    calls = []
    monkeypatch.setattr(F, "fetch_one", lambda t: (calls.append(t), fake_fetch({t: False})(t))[1])
    F.FundamentalsCache(tmp_path, delay_seconds=0).update(tickers, max_age_days=30)
    assert len(calls) == F.GIVE_UP_AFTER


def test_report_counts_failures_separately():
    fund = pd.DataFrame({"roe": [0.2, np.nan, np.nan], "debt_to_equity": [0.1, np.nan, 0.2],
                         "eps": [1.0, np.nan, 2.0], "ok": [True, False, True]}, index=["A", "B", "C"])
    notes = F.report_missing(fund)
    assert "2 of 3" in notes[0]
    assert "NO data for 1 of 3" in notes[1]


def _stmt(rows: dict, years=("2026-03-31", "2025-03-31")):
    return pd.DataFrame(rows, index=pd.to_datetime(list(years))).T


def test_roe_and_de_from_statements():
    income = _stmt({"Net Income Common Stockholders": [200.0, 150.0]})
    balance = _stmt({"Stockholders Equity": [1100.0, 900.0], "Total Debt": [550.0, 600.0]})
    roe, de = F.from_statements(income, balance)
    assert roe == pytest.approx(200 / 1000)   # net income / average equity
    assert de == pytest.approx(550 / 1100)    # latest debt / latest equity


def test_statements_handle_missing_and_negative_equity():
    income = _stmt({"Net Income": [50.0, 40.0]})
    assert all(np.isnan(x) for x in F.from_statements(income, None))
    neg = _stmt({"Stockholders Equity": [-10.0, 20.0], "Total Debt": [5.0, 5.0]})
    assert all(np.isnan(x) for x in F.from_statements(income, neg))
    no_debt = _stmt({"Common Stock Equity": [500.0, 500.0]})
    roe, de = F.from_statements(income, no_debt)
    assert roe == pytest.approx(0.1) and np.isnan(de)


def test_old_schema_rows_are_refetched(tmp_path, monkeypatch):
    old = pd.DataFrame({"roe": [np.nan], "debt_to_equity": [0.2], "eps": [3.0],
                        "fetched_at": [pd.Timestamp.now()], "ok": [True]}, index=pd.Index(["A.NS"], name="ticker"))
    old.to_parquet(tmp_path / "fundamentals.parquet")
    calls = []
    monkeypatch.setattr(F, "fetch_one", lambda t: (calls.append(t), {**fake_fetch({t: True})(t),
                                                                     "source": "statements", "schema": F.SCHEMA})[1])
    out = F.FundamentalsCache(tmp_path, delay_seconds=0).update(["A.NS"], max_age_days=30)
    assert calls == ["A.NS"] and out.loc["A.NS", "roe"] == 0.2
