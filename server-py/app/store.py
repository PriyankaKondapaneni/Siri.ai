"""Persistence for plans and task outcomes — the data flywheel.

Every plan and its per-task outcomes are stored so a future model can train on
(features -> decision -> outcome). Also exposes the read queries the Recovery
engine needs. Pure DB access; no ADHD logic lives here.
"""
import json
import time
from dataclasses import dataclass
from datetime import date

from nanoid import generate as nanoid

from app.db import execute, query_all, query_one
from app.models.plan import PlanResponse

DAY_MS = 24 * 60 * 60 * 1000


def _now_ms() -> int:
    return int(time.time() * 1000)


def create_today_tasks(user_id: str, raw_tasks: list[str]) -> list[str]:
    """Create a pending task dated today for each brain-dump item. Dedupes
    against pending tasks already on today's list (case-insensitive title)."""
    today = date.today().isoformat()
    now = _now_ms()
    existing = {
        r["title"].strip().lower()
        for r in query_all(
            "SELECT title FROM tasks WHERE user_id=? AND due_date=? AND status='pending'",
            (user_id, today),
        )
    }
    created: list[str] = []
    for raw in raw_tasks:
        title = raw.strip()
        if not title or title.lower() in existing:
            continue
        tid = nanoid()
        execute(
            """INSERT INTO tasks
               (id, user_id, title, description, due_date, due_time, duration, reminder,
                repeat_rule, priority, status, list, starred, parent_id, created_at, updated_at)
               VALUES (?, ?, ?, NULL, ?, NULL, NULL, NULL, NULL, 'medium', 'pending', 'today', 0, NULL, ?, ?)""",
            (tid, user_id, title, today, now, now),
        )
        existing.add(title.lower())
        created.append(tid)
    return created


def save_plan(user_id: str, dump: str, plan: PlanResponse) -> str:
    """Persist a plan + one task_outcome row per do_now task. Returns plan_id."""
    plan_id = nanoid()
    now = _now_ms()
    lt = time.localtime(now / 1000)
    a = plan.assessment
    execute(
        """INSERT INTO plans
           (id, user_id, dump, state, energy, energy_mode, overwhelm_score,
            cognitive_load_budget, in_recovery, energy_self_report, helpful,
            plan_json, created_at, hour_of_day, weekday)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)""",
        (
            plan_id, user_id, dump, a.state, a.energy, a.energy_mode,
            a.overwhelm_score, a.cognitive_load_budget, 1 if a.in_recovery else 0,
            plan.model_dump_json(), now, lt.tm_hour, lt.tm_wday,
        ),
    )
    for i, task in enumerate(plan.do_now):
        execute(
            """INSERT INTO task_outcomes
               (id, plan_id, user_id, task_raw, rewrite, category, position,
                scores_json, status, completed_at, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?)""",
            (
                nanoid(), plan_id, user_id, task.raw, task.rewrite, task.category,
                i, json.dumps({"cognitive_load": task.cognitive_load,
                               "duration_minutes": task.duration_minutes,
                               "priority": task.priority}), now,
            ),
        )
    return plan_id


def set_energy_self_report(plan_id: str, user_id: str, energy: str) -> None:
    execute(
        "UPDATE plans SET energy_self_report = ? WHERE id = ? AND user_id = ?",
        (energy, plan_id, user_id),
    )


def get_plan(plan_id: str, user_id: str):
    return query_one("SELECT * FROM plans WHERE id = ? AND user_id = ?", (plan_id, user_id))


def record_outcomes(
    plan_id: str, user_id: str,
    completed: list[int], deferred: list[int],
) -> int:
    """Mark do_now tasks (by position) completed/deferred. Returns rows touched."""
    now = _now_ms()
    touched = 0
    for pos in completed:
        execute(
            """UPDATE task_outcomes SET status='completed', completed_at=?
               WHERE plan_id=? AND user_id=? AND position=?""",
            (now, plan_id, user_id, pos),
        )
        touched += 1
    for pos in deferred:
        execute(
            """UPDATE task_outcomes SET status='deferred'
               WHERE plan_id=? AND user_id=? AND position=?""",
            (plan_id, user_id, pos),
        )
        touched += 1
    return touched


def set_feedback(plan_id: str, user_id: str, helpful: bool, energy: str | None) -> None:
    execute(
        "UPDATE plans SET helpful = ? WHERE id = ? AND user_id = ?",
        (1 if helpful else 0, plan_id, user_id),
    )
    if energy:
        set_energy_self_report(plan_id, user_id, energy)


# --- Recovery read queries --------------------------------------------------

@dataclass
class RecoveryStats:
    days_since_seen: float
    open_outcomes: int
    overwhelm_streak: int


def _last_recovery_restart(user_id: str) -> int:
    row = query_one("SELECT last_recovery_restart FROM users WHERE id = ?", (user_id,))
    return (row["last_recovery_restart"] or 0) if row else 0


def recovery_stats(user_id: str) -> RecoveryStats:
    now = _now_ms()
    restart = _last_recovery_restart(user_id)

    last_plan = query_one(
        "SELECT MAX(created_at) AS m FROM plans WHERE user_id = ?", (user_id,)
    )
    last_plan_at = (last_plan["m"] if last_plan and last_plan["m"] else 0)
    reference = max(last_plan_at, restart)
    days_since_seen = (now - reference) / DAY_MS if reference else 0.0

    open_row = query_one(
        """SELECT COUNT(*) AS c FROM task_outcomes
           WHERE user_id = ? AND status = 'pending' AND created_at > ?""",
        (user_id, restart),
    )
    open_outcomes = open_row["c"] if open_row else 0

    recent = query_all(
        """SELECT overwhelm_score FROM plans
           WHERE user_id = ? AND created_at > ?
           ORDER BY created_at DESC LIMIT 3""",
        (user_id, restart),
    )
    streak = 0
    for r in recent:
        if r["overwhelm_score"] >= 7:
            streak += 1
        else:
            break

    return RecoveryStats(
        days_since_seen=round(days_since_seen, 2),
        open_outcomes=open_outcomes,
        overwhelm_streak=streak,
    )


def restart_recovery(user_id: str) -> None:
    """Gentle re-entry: reset the clock, archive backlog, drop pending outcomes."""
    now = _now_ms()
    execute("UPDATE users SET last_recovery_restart = ? WHERE id = ?", (now, user_id))
    execute(
        """UPDATE task_outcomes SET status = 'archived'
           WHERE user_id = ? AND status = 'pending'""",
        (user_id,),
    )
    archive_old_tasks(user_id)


def archive_old_tasks(user_id: str, older_than_days: int = 14) -> int:
    """Move long-pending tasks out of view (never deleted). Anti-shame backlog
    reduction. Returns number archived."""
    cutoff = _now_ms() - older_than_days * DAY_MS
    before = query_one(
        """SELECT COUNT(*) AS c FROM tasks
           WHERE user_id = ? AND status = 'pending' AND list != 'archive'
             AND created_at < ?""",
        (user_id, cutoff),
    )
    execute(
        """UPDATE tasks SET list = 'archive', updated_at = ?
           WHERE user_id = ? AND status = 'pending' AND list != 'archive'
             AND created_at < ?""",
        (_now_ms(), user_id, cutoff),
    )
    return before["c"] if before else 0
