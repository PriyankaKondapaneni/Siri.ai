import express from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from '../db/database.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const id = nanoid();
  const hash = await bcrypt.hash(password, 10);
  db.prepare(
    'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, email.toLowerCase(), name, hash, Date.now());

  seedDemoData(id);

  const token = signToken({ id, email: email.toLowerCase(), name });
  res.json({ token, user: { id, email: email.toLowerCase(), name } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ id: user.id, email: user.email, name: user.name });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

function seedDemoData(userId) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const taskInsert = db.prepare(
    'INSERT INTO tasks (id, user_id, title, description, due_date, priority, status, list, starred, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const todayIso = new Date(now).toISOString().slice(0, 10);
  const tomorrowIso = new Date(now + dayMs).toISOString().slice(0, 10);
  const tasks = [
    ['Welcome to siri.ai', 'Try asking the assistant to summarize your day', todayIso, 'high', 'pending', 'today', 1],
    ['Plan weekly review', 'Block 30 minutes on Friday for a weekly review', tomorrowIso, 'medium', 'pending', 'today', 0],
    ['Draft project brief', 'Outline scope, goals and timeline', null, 'medium', 'pending', 'inbox', 0],
    ['Read research paper', 'Latest on agentic workflows', null, 'low', 'pending', 'inbox', 0],
  ];
  for (const t of tasks) {
    taskInsert.run(nanoid(), userId, t[0], t[1], t[2], t[3], t[4], t[5], t[6], now, now);
  }

  const noteInsert = db.prepare(
    'INSERT INTO notes (id, user_id, title, content, tags, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  noteInsert.run(
    nanoid(),
    userId,
    'Getting started',
    '# Welcome\n\nSiri is your AI second brain. Capture thoughts, tasks, and meetings — and let the assistant connect the dots.\n\n- Ask it to plan your day\n- Draft a follow-up from a meeting\n- Triage your inbox',
    'welcome,intro',
    1,
    now,
    now
  );

  const eventInsert = db.prepare(
    'INSERT INTO events (id, user_id, title, description, start_at, end_at, location, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const startToday = new Date();
  startToday.setHours(10, 0, 0, 0);
  const endToday = new Date(startToday.getTime() + 60 * 60 * 1000);
  eventInsert.run(
    nanoid(),
    userId,
    'Team standup',
    'Daily sync',
    startToday.toISOString(),
    endToday.toISOString(),
    'Google Meet',
    'indigo',
    now
  );
  const start2 = new Date();
  start2.setHours(14, 30, 0, 0);
  const end2 = new Date(start2.getTime() + 45 * 60 * 1000);
  eventInsert.run(
    nanoid(),
    userId,
    'Focus block',
    'Deep work on roadmap',
    start2.toISOString(),
    end2.toISOString(),
    '',
    'emerald',
    now
  );

  const emailInsert = db.prepare(
    'INSERT INTO emails (id, user_id, sender, sender_email, subject, preview, body, received_at, is_read, is_starred, label) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const emails = [
    ['Avery Chen', 'avery@example.com', 'Welcome aboard', 'Glad to have you on the team — here are some resources to get started…', 'Hi! Welcome to the team. Here are a few resources to help you ramp up over the next two weeks.', 0, 1, 'work'],
    ['GitHub', 'noreply@github.com', '[siri-ai] New pull request opened', 'A new pull request has been opened in your repository…', 'A new pull request has been opened in your repository.', 0, 0, 'updates'],
    ['Stripe', 'no-reply@stripe.com', 'Your weekly report', 'Here is your weekly summary across all accounts…', 'Weekly summary attached.', 1, 0, 'reports'],
  ];
  for (let i = 0; i < emails.length; i++) {
    const e = emails[i];
    emailInsert.run(nanoid(), userId, e[0], e[1], e[2], e[3], e[4], now - i * 3600 * 1000, e[5], e[6], e[7]);
  }
}

export default router;
