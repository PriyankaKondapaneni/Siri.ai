import math

import pandas as pd
import pytest

from sipquant.backtest.metrics import cagr, longest_underwater_days, max_drawdown, xirr


def test_single_period_ten_percent():
    flows = [(pd.Timestamp("2020-01-01"), -1000.0), (pd.Timestamp("2020-12-31"), 1100.0)]  # 365 days
    assert xirr(flows) == pytest.approx(0.10, abs=1e-9)


@pytest.mark.parametrize("rate", [-0.2, 0.0, 0.07, 0.15, 0.45])
def test_monthly_sip_recovers_known_rate(rate):
    """Build a SIP whose final value is compounded at `rate`; XIRR must return that rate."""
    dates = pd.date_range("2015-01-01", periods=60, freq="MS")  # first of each month
    end = pd.Timestamp("2020-01-15")
    fv = sum(25000 * (1 + rate) ** ((end - d).days / 365.0) for d in dates)
    flows = [(d, -25000.0) for d in dates] + [(end, fv)]
    assert xirr(flows) == pytest.approx(rate, abs=1e-7)


def test_known_excel_example():
    # Microsoft's documented XIRR example -> 0.373362535
    flows = [("2008-01-01", -10000), ("2008-03-01", 2750), ("2008-10-30", 4250),
             ("2009-02-15", 3250), ("2009-04-01", 2750)]
    assert xirr([(pd.Timestamp(d), a) for d, a in flows]) == pytest.approx(0.373362535, abs=1e-6)


def test_no_sign_change_is_nan():
    flows = [(pd.Timestamp("2020-01-01"), -1.0), (pd.Timestamp("2021-01-01"), -1.0)]
    assert math.isnan(xirr(flows))


def test_nav_metrics():
    idx = pd.to_datetime(["2020-01-01", "2020-06-01", "2021-01-01", "2021-06-01", "2022-01-01"])
    nav = pd.Series([100, 80, 90, 100, 121], index=idx)
    assert max_drawdown(nav) == pytest.approx(-0.20)
    assert longest_underwater_days(nav) == (idx[3] - idx[0]).days  # peak 2020-01-01 -> recovered 2021-06-01
    assert cagr(nav) == pytest.approx(1.21 ** (365.25 / 731) - 1)
