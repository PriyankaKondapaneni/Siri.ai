"""PriceCache incremental logic, with the Yahoo download faked (no network)."""
import numpy as np
import pandas as pd

from sipquant.data import prices as P


class FakeYahoo:
    """Serves a fixed price history; `scale` mimics Yahoo re-adjusting history after a dividend."""

    def __init__(self, end):
        self.idx = pd.bdate_range("2024-01-01", end)
        self.scale = {"A.NS": 1.0, "B.NS": 1.0}
        self.calls = []

    def __call__(self, tickers, start, end=None):
        self.calls.append((tuple(tickers), start))
        idx = self.idx[self.idx >= pd.Timestamp(start)]
        base = pd.Series(100.0 + np.arange(len(self.idx)), index=self.idx)[idx]  # stable per date
        adj = pd.DataFrame({t: base * self.scale[t] for t in tickers})
        return {"close": adj * 1.0, "adj_close": adj, "volume": adj * 0 + 1000}


def test_full_then_incremental_then_readjust(tmp_path, monkeypatch):
    fake = FakeYahoo(end="2024-03-29")
    monkeypatch.setattr(P, "download", fake)
    monkeypatch.setattr(P, "date", type("D", (), {"today": staticmethod(lambda: pd.Timestamp("2024-06-03").date())}))
    cache = P.PriceCache(tmp_path)

    frames = cache.update(["A.NS", "B.NS"], "2024-01-01")
    assert fake.calls[-1][1] == "2024-01-01"                    # first run: full history
    assert frames["adj_close"].index[-1] == pd.Timestamp("2024-03-29")

    # A few more days of data appear: only the tail is fetched.
    fake.idx = pd.bdate_range("2024-01-01", "2024-04-10")
    frames = cache.update(["A.NS", "B.NS"], "2024-01-01")
    assert len(fake.calls) == 2 and fake.calls[-1][1] > "2024-03-01"
    assert frames["adj_close"].index[-1] == pd.Timestamp("2024-04-10")
    assert frames["adj_close"]["A.NS"].notna().all()

    # B pays a dividend: Yahoo rescales B's whole adjusted history -> B gets a full refetch.
    fake.idx = pd.bdate_range("2024-01-01", "2024-04-20")
    fake.scale["B.NS"] = 0.98
    frames = cache.update(["A.NS", "B.NS"], "2024-01-01")
    assert fake.calls[-1] == (("B.NS",), "2024-01-01")
    first_b = frames["adj_close"]["B.NS"].iloc[0]
    assert first_b == 100 * 0.98                               # old unscaled history was replaced
    assert frames["adj_close"]["A.NS"].iloc[0] == 100           # A untouched

    # Reload from disk gives the same thing.
    again = P.PriceCache(tmp_path).load()
    pd.testing.assert_frame_equal(again["adj_close"], frames["adj_close"].sort_index(), check_freq=False)
