import express from 'express';
import { nanoid } from 'nanoid';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM events WHERE user_id = ?';
  const params = [req.user.id];
  if (from) { sql += ' AND start_at >= ?'; params.push(from); }
  if (to) { sql += ' AND start_at <= ?'; params.push(to); }
  sql += ' ORDER BY start_at ASC';
  const events = db.prepare(sql).all(...params);
  res.json({ events });
});

router.post('/', (req, res) => {
  const { title, description, start_at, end_at, location, color } = req.body || {};
  if (!title || !start_at || !end_at) {
    return res.status(400).json({ error: 'title, start_at, end_at are required' });
  }
  const id = nanoid();
  db.prepare(
    'INSERT INTO events (id, user_id, title, description, start_at, end_at, location, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.user.id, title, description || null, start_at, end_at, location || null, color || 'indigo', Date.now());
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  res.json({ event });
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  const fields = ['title', 'description', 'start_at', 'end_at', 'location', 'color'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (f in req.body) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  }
  if (!updates.length) return res.json({ event: existing });
  values.push(req.params.id, req.user.id);
  db.prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json({ event });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

export default router;
