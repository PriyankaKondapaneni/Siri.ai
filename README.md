# siri.ai

An AI productivity workspace — tasks, notes, calendar, and inbox in one calm UI, with an in-app
assistant powered by the Claude API.

This is a full-stack app built with:
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- **Backend:** Node.js + Express + SQLite (better-sqlite3) + JWT auth
- **AI:** Anthropic Claude API (via `@anthropic-ai/sdk`)

## Features

- Unified workspace: Today view, Tasks, Notes (markdown), Calendar (week view), Inbox
- "Ask Siri" — a chat assistant powered by Claude with conversation history
- One-click "Plan my day", note summarization, and inbox triage helpers
- Multi-user with email/password auth and per-user data
- Demo data seeded on signup so the app feels alive immediately

## Quick start

```bash
# 1) install everything
npm run install:all

# 2) add your Anthropic key
cp server/.env.example server/.env
# edit server/.env and set ANTHROPIC_API_KEY=sk-ant-...

# 3) run server + client in dev
npm run dev
```

- Client: http://localhost:5173
- API:    http://localhost:4000

Create an account on `/signup` — the app will seed demo tasks, notes, events, and emails for you.

## Production build

```bash
npm run build       # builds the client into client/dist
npm start           # runs the server, which also serves the built client
```

## How the AI is wired up

The assistant lives in two server routes:

- `POST /api/chats/:id/messages` — sends the full conversation to Claude with a Siri-specific system
  prompt (see `server/src/routes/chat.js`).
- `POST /api/assistant/plan-day` and `/api/assistant/summarize` — task-specific helpers used by the
  Today view, Notes, and Inbox.

The model is configurable via `CLAUDE_MODEL` in `server/.env` (defaults to `claude-opus-4-7`).

> Note: Claude.ai projects (the ones at `claude.ai/project/...`) are a Claude.ai web-app feature and
> aren't exposed through the API. To get equivalent behavior in this app, edit the system prompt in
> `server/src/routes/chat.js` to match the instructions you've set up in your Claude.ai project.

## Project structure

```
client/   React + Vite frontend
server/   Express API + SQLite + Claude integration
```

## Environment variables

| Var                  | Where           | Purpose                                       |
| -------------------- | --------------- | --------------------------------------------- |
| `ANTHROPIC_API_KEY`  | `server/.env`   | Required to enable real AI responses          |
| `JWT_SECRET`         | `server/.env`   | Used to sign auth tokens                      |
| `PORT`               | `server/.env`   | API port (default 4000)                       |
| `CLAUDE_MODEL`       | `server/.env`   | Claude model id (default `claude-opus-4-7`)   |
