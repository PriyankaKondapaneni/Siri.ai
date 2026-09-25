"""Fundamentals cache: failed fetches must be retried, not cached as 'missing'."""
import numpy as np
import pandas as pd

from sipquant.data import fundamentals as F


def fake_fetch(results):
    def fetch(ticker):
        ok = results[ticker]
        return {"roe": 0.2 if ok else np.nan, "debt_to_equity": 0.1 if ok else np.nan,
                "eps": 5.0 if ok else np.nan, "fetched_at": pd.Timestamp.now(), "ok": ok}
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
