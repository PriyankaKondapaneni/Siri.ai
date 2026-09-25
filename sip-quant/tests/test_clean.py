import numpy as np
import pandas as pd
import pytest

from sipquant.data.clean import clean_series


def series(values):
    return pd.Series(values, index=pd.bdate_range("2024-01-01", periods=len(values)), dtype=float)


def test_bad_print_is_removed():
    s = series([100, 101, 10, 10.2, 102, 103])  # two-day bogus drop to ~10
    out, fixes = clean_series(s)
    assert out.iloc[2:4].isna().all()
    assert out.dropna().pct_change().abs().max() < 0.05
    assert "bad print" in fixes[0]


def test_unadjusted_split_is_rescaled():
    s = series([1000, 1010, 1020, 102, 103, 104])  # 1:10 split not adjusted
    out, fixes = clean_series(s)
    assert out.iloc[0] == pytest.approx(100)
    assert out.pct_change().abs().max() < 0.05
    assert "split" in fixes[0]


def test_unexplained_jump_is_reported_and_later_problems_still_fixed():
    s = series([100, 100, 160, 161, 162, 16.3, 16.4, 16.5])  # +60% (odd) then 1:10 split
    out, fixes = clean_series(s)
    assert any("UNEXPLAINED" in f for f in fixes)
    assert any("split" in f for f in fixes)
    assert out.iloc[3] == pytest.approx(16.1)


def test_clean_series_untouched():
    s = series(100 * np.exp(np.cumsum(np.full(50, 0.01))))
    out, fixes = clean_series(s)
    assert fixes == [] and out.equals(s)
