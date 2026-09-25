"""Alert rules. Pure logic: takes today's status + the saved state, returns messages + new state.

Each alert fires once and re-arms only after the condition clears, so a holding
sitting at -30% doesn't message you every single day.
  * holding down more than 25% from your average buy price (re-arms when back above -25%)
  * regime flip: Nifty 500 crosses its 200-day average (either direction)
  * portfolio drawdown crosses -20% / -30% (re-arms after recovering 5 pts above the level)
"""
from __future__ import annotations

import copy


def evaluate_alerts(holdings_returns: dict[str, float], risk_on: bool, drawdown: float | None,
                    state: dict, cfg: dict) -> tuple[list[str], dict]:
    a = cfg["alerts"]
    state = copy.deepcopy(state)
    msgs: list[str] = []

    # 1. Individual holdings far below the buy price.
    flagged = set(state.get("holding_alerted", []))
    for ticker, ret in sorted(holdings_returns.items()):
        name = ticker.removesuffix(".NS")
        if ret <= a["holding_drop_from_buy"] and ticker not in flagged:
            msgs.append(f"{name} is {ret:+.1%} vs your average buy price.")
            flagged.add(ticker)
        elif ret > a["holding_drop_from_buy"] and ticker in flagged:
            flagged.discard(ticker)
    flagged &= set(holdings_returns)  # forget holdings you no longer own
    state["holding_alerted"] = sorted(flagged)

    # 2. Regime flips (first run just records the state).
    prev = state.get("risk_on")
    if prev is not None and prev != risk_on:
        rule = "ON" if cfg["strategy"]["regime"]["enabled"] else "OFF (info only)"
        if risk_on:
            msgs.append(f"Regime flip: Nifty 500 is back ABOVE its 200-day average. Regime rule {rule}.")
        else:
            msgs.append(f"Regime flip: Nifty 500 closed BELOW its 200-day average. Regime rule {rule}"
                        + ("; next month's stock money goes to Nifty 50." if rule == "ON" else "."))
    state["risk_on"] = risk_on

    # 3. Portfolio drawdown thresholds.
    if drawdown is not None:
        fired = set(state.get("drawdown_alerted", []))
        for level in sorted(a["portfolio_drawdown_levels"], reverse=True):  # -0.20 before -0.30
            if drawdown <= level and level not in fired:
                msgs.append(f"Portfolio drawdown is {drawdown:.1%} from its peak (crossed {level:.0%}).")
                fired.add(level)
            elif drawdown > level + a["rearm_margin"] and level in fired:
                fired.discard(level)
        state["drawdown_alerted"] = sorted(fired)
    return msgs, state
