import express from 'express';
import { nanoid } from 'nanoid';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { list, status } = req.query;
  let sql = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [req.user.id];
  if (list) { sql += ' AND list = ?'; params.push(list); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY starred DESC, created_at DESC';
  const tasks = db.prepare(sql).all(...params);
  res.json({ tasks });
});

router.post('/', (req, res) => {
  const { title, description, due_date, priority, list } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  const id = nanoid();
  const now = Date.now();
  db.prepare(
    'INSERT INTO tasks (id, user_id, title, description, due_date, priority, status, list, starred, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id, req.user.id, title, description || null, due_date || null,
    priority || 'medium', 'pending', list || 'inbox', 0, now, now
  );
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ task });
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const fields = ['title', 'description', 'due_date', 'priority', 'status', 'list', 'starred'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (f in req.body) {
      updates.push(`${f} = ?`);
      values.push(f === 'starred' ? (req.body[f] ? 1 : 0) : req.body[f]);
    }
  }
  if (!updates.length) return res.json({ task: existing });

  updates.push('updated_at = ?');
  values.push(Date.now());
  values.push(req.params.id, req.user.id);

  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json({ task });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

export default router;
