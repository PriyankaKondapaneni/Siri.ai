import pandas as pd
import pytest

from sipquant.backtest.tax import TaxLedger, TaxRates, financial_year, fy_liability, is_long_term

T = pd.Timestamp
RATES = TaxRates(stcg=0.20, ltcg=0.125, exemption=125_000, carry_forward=True)


def ledger():
    return TaxLedger(RATES)


def test_financial_year_boundaries():
    assert financial_year(T("2025-03-31")) == 2024
    assert financial_year(T("2025-04-01")) == 2025


def test_holding_period_is_more_than_twelve_months():
    assert not is_long_term(T("2023-01-10"), T("2024-01-10"))
    assert is_long_term(T("2023-01-10"), T("2024-01-11"))


def test_fifo_consumes_oldest_lot_first():
    lg = ledger()
    lg.buy("A", T("2020-01-01"), 10, 1000)   # Rs 100/share, will be long-term
    lg.buy("A", T("2021-06-01"), 10, 2000)   # Rs 200/share, short-term at sale date
    res = lg.sell("A", T("2021-09-01"), 15, 15 * 300)
    # 10 from lot 1 (LT gain 2000) + 5 from lot 2 (ST gain 500)
    assert res.lt_gain == pytest.approx(2000)
    assert res.st_gain == pytest.approx(500)
    assert lg.quantity("A") == pytest.approx(5)
    assert lg.lots["A"][0].unit_cost == pytest.approx(200)


def test_stcg_taxed_at_20_percent():
    lg = ledger()
    lg.buy("A", T("2024-05-01"), 100, 10_000)
    res = lg.sell("A", T("2024-08-01"), 100, 15_000)
    assert res.tax == pytest.approx(5_000 * 0.20)


def test_ltcg_exemption_applies_per_financial_year():
    lg = ledger()
    lg.buy("A", T("2020-01-01"), 100, 100_000)
    lg.buy("B", T("2020-01-01"), 100, 100_000)
    # Rs 1,00,000 LT gain in FY2023 and another Rs 1,00,000 in FY2024: each under the exemption.
    r1 = lg.sell("A", T("2024-03-15"), 100, 200_000)
    r2 = lg.sell("B", T("2024-04-15"), 100, 200_000)
    assert r1.tax == 0 and r2.tax == 0

    # Same Rs 2,00,000 of LT gains inside ONE FY: 75,000 above the exemption is taxed.
    lg2 = ledger()
    lg2.buy("A", T("2020-01-01"), 100, 100_000)
    lg2.buy("B", T("2020-01-01"), 100, 100_000)
    a = lg2.sell("A", T("2024-05-01"), 100, 200_000)
    b = lg2.sell("B", T("2024-06-01"), 100, 200_000)
    assert a.tax == 0                                # first 1 L sits inside the exemption
    assert b.tax == pytest.approx(75_000 * 0.125)    # only the excess over 1.25 L
    assert lg2.total_tax == pytest.approx(9_375)


def test_short_term_loss_offsets_long_term_gain_and_refunds():
    lg = ledger()
    lg.buy("A", T("2020-01-01"), 100, 100_000)
    lg.buy("B", T("2024-05-01"), 100, 100_000)
    lg.buy("C", T("2024-05-01"), 100, 100_000)
    lg.sell("C", T("2024-06-01"), 100, 150_000)          # ST gain 50,000 -> tax 10,000
    assert lg.total_tax == pytest.approx(10_000)
    refund = lg.sell("B", T("2024-07-01"), 100, 60_000)  # ST loss 40,000 in the same FY
    assert refund.tax == pytest.approx(-8_000)           # net ST gain now 10,000
    lg.sell("A", T("2024-08-01"), 100, 300_000)          # LT gain 2,00,000
    assert lg.fy_tax(2024) == pytest.approx(10_000 * 0.20 + 75_000 * 0.125)


def test_long_term_loss_cannot_offset_short_term_gain():
    tax, cf_st, cf_lt = fy_liability(st_net=50_000, lt_net=-30_000, cf_st=0, cf_lt=0, r=RATES)
    assert tax == pytest.approx(10_000)
    assert cf_lt == pytest.approx(30_000) and cf_st == 0


def test_loss_carry_forward_to_next_fy():
    lg = ledger()
    lg.buy("A", T("2023-05-01"), 100, 100_000)
    lg.buy("B", T("2024-05-01"), 100, 100_000)
    lg.sell("A", T("2023-06-01"), 100, 70_000)           # ST loss 30,000 in FY2023
    res = lg.sell("B", T("2024-06-01"), 100, 150_000)    # ST gain 50,000 in FY2024
    assert res.tax == pytest.approx(20_000 * 0.20)

    no_cf = TaxLedger(TaxRates(0.20, 0.125, 125_000, carry_forward=False))
    no_cf.buy("A", T("2023-05-01"), 100, 100_000)
    no_cf.buy("B", T("2024-05-01"), 100, 100_000)
    no_cf.sell("A", T("2023-06-01"), 100, 70_000)
    assert no_cf.sell("B", T("2024-06-01"), 100, 150_000).tax == pytest.approx(10_000)


def test_overselling_raises():
    lg = ledger()
    lg.buy("A", T("2024-01-01"), 1, 100)
    with pytest.raises(ValueError):
        lg.sell("A", T("2024-02-01"), 2, 300)
