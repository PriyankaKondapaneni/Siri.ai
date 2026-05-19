# siri.ai

An ADHD-focused task orchestrator. You dump everything in your head, and a
deterministic backend decides what to actually do right now.

Stack:

- **Frontend:** React 18 + TypeScript + Vite + Tailwind
- **Backend:** Python 3.11+ + FastAPI + SQLite (stdlib `sqlite3`)
- **AI:** optional. Claude is only used to soften tone — never to prioritize,
  reorder, or decide what's important. All planning logic is in `server-py/app/engine/`.

## Quick start

```bash
# 1) install everything (creates server-py/.venv automatically)
npm run install:all
# manual equivalent:
#   npm --prefix client install
#   cd server-py && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
#
# On Windows, the npm scripts use Unix paths (.venv/bin/python). Either run
# them under Git Bash / WSL, or invoke uvicorn directly: server-py\.venv\Scripts\python -m uvicorn app.main:app --port 4000

# 2) optional: add a Claude key for tone refinement
cp server-py/.env.example server-py/.env
# edit server-py/.env and set ANTHROPIC_API_KEY=sk-ant-...
# (the planner works without it)

# 3) run server + client in dev
npm run dev
```

- Client: http://localhost:5173
- API:    http://localhost:4000

Sign up on `/signup` — the backend seeds demo tasks, notes, events, and emails.

## Architecture

```
server-py/
├── app/
│   ├── main.py                  FastAPI entry; serves /api/* and the built client
│   ├── config.py                env vars, paths
│   ├── db.py                    SQLite connection + schema
│   ├── security.py              bcrypt + JWT
│   ├── deps.py                  require_auth FastAPI dependency
│   ├── api/                     HTTP routes
│   │   ├── auth.py              signup, login, me (+ demo seed)
│   │   ├── tasks.py
│   │   ├── notes.py
│   │   ├── events.py
│   │   ├── emails.py
│   │   ├── chats.py
│   │   ├── assistant.py         /plan-day, /summarize, /adhd-plan
│   │   └── health.py
│   ├── models/                  Pydantic models
│   ├── data/                    keyword tables, weight matrix, templates
│   │   ├── keywords.py
│   │   ├── weights.py
│   │   └── templates.py
│   ├── engine/                  pure-Python planner. No I/O.
│   │   ├── parser.py
│   │   ├── categorizer.py
│   │   ├── scoring.py
│   │   ├── time_estimator.py
│   │   ├── emotional_state.py
│   │   ├── prioritizer.py
│   │   ├── breakdown.py
│   │   └── formatter.py         orchestrates everything end-to-end
│   └── ai/
│       └── refiner.py           optional Claude tone pass
└── tests/                       engine tests (pytest)
```

## How the planner works

1. **parser** splits the dump on commas/newlines/" and ", strips lead filler
   ("need to", "i should"), separates meta phrases like "feeling exhausted".
2. **categorizer** assigns one of:
   `survival | communication | self_care | chore | work | emotional | other`.
3. **scoring** produces 7 scores per task (urgency, importance, activation
   energy, emotional resistance, focus required, duration minutes, dopamine
   reward) using keyword tables + category baselines.
4. **emotional_state** classifies the overall state from distress keywords
   plus task density. States: `okay | stressed | overwhelmed | low_energy | shutdown_risk`.
5. **prioritizer** applies a state-adaptive weight matrix, then floats the
   cheapest-highest-dopamine task to position 1 ("momentum boost"), then
   breaks up runs of three consecutive high-focus tasks. Task cap shrinks
   as state worsens (4 → 1).
6. **breakdown** picks 3 tiny steps per task from a per-category template.
7. **formatter** assembles a `PlanResponse` and (optionally) hands it to
   `ai/refiner.py` to warm up the wording.

AI is never allowed to reorder, add, or remove tasks or change durations.

## Endpoints (relevant subset)

| Method | Path                          | Notes                                 |
| ------ | ----------------------------- | ------------------------------------- |
| POST   | `/api/auth/signup`            | Returns `{ token, user }`, seeds demo |
| POST   | `/api/auth/login`             |                                       |
| GET    | `/api/auth/me`                | Bearer auth required                  |
| GET    | `/api/tasks` `?list=...`      |                                       |
| POST   | `/api/tasks`                  |                                       |
| PATCH  | `/api/tasks/{id}`             |                                       |
| DELETE | `/api/tasks/{id}`             |                                       |
| GET    | `/api/notes`                  |                                       |
| GET    | `/api/events?from=&to=`       |                                       |
| GET    | `/api/emails`                 |                                       |
| GET    | `/api/chats`                  |                                       |
| POST   | `/api/chats/{id}/messages`    | Stub reply (chat AI not wired yet)    |
| POST   | `/api/assistant/adhd-plan`    | The deterministic planner             |
| POST   | `/api/assistant/plan-day`     | Requires Claude key                   |
| POST   | `/api/assistant/summarize`    | Requires Claude key                   |

Example:

```bash
curl -s -X POST http://localhost:4000/api/assistant/adhd-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"dump":"Need to clean room, reply to manager, study DSA, bathe, groceries, feeling exhausted, too many things pending"}'
```

returns:

```json
{
  "assessment": {"state":"shutdown_risk","energy":"low","overwhelm_score":10,"distress_signals":["exhausted","pending","too many"]},
  "do_now": [{"raw":"reply to manager","rewrite":"Send 1 line about: reply to manager","category":"communication","duration_minutes":2,"priority":"high","why":"Only 2 min, quick win, time-sensitive, removes a lingering worry fast.","tiny_steps":[...]}],
  "skip_today": ["bathe","clean room","groceries","study DSA"],
  "one_tiny_step": {"order":1,"text":"Open the chat or email"},
  "encouragement": null
}
```

## Tests

```bash
npm test
# or:
cd server-py && .venv/bin/python -m pytest
```

## Environment variables

| Var                  | Where                | Purpose                                  |
| -------------------- | -------------------- | ---------------------------------------- |
| `ANTHROPIC_API_KEY`  | `server-py/.env`     | Optional. Enables AI tone refinement     |
| `JWT_SECRET`         | `server-py/.env`     | Signs auth tokens                        |
| `PORT`               | `server-py/.env`     | API port (default 4000)                  |
| `CLAUDE_MODEL`       | `server-py/.env`     | Claude model id (default `claude-opus-4-7`) |
