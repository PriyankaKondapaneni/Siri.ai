import express from 'express';
import { nanoid } from 'nanoid';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const notes = db
    .prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY pinned DESC, updated_at DESC')
    .all(req.user.id);
  res.json({ notes });
});

router.get('/:id', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json({ note });
});

router.post('/', (req, res) => {
  const { title, content, tags } = req.body || {};
  const id = nanoid();
  const now = Date.now();
  db.prepare(
    'INSERT INTO notes (id, user_id, title, content, tags, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.user.id, title || 'Untitled', content || '', tags || '', 0, now, now);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  res.json({ note });
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Note not found' });

  const fields = ['title', 'content', 'tags', 'pinned'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (f in req.body) {
      updates.push(`${f} = ?`);
      values.push(f === 'pinned' ? (req.body[f] ? 1 : 0) : req.body[f]);
    }
  }
  if (!updates.length) return res.json({ note: existing });

  updates.push('updated_at = ?');
  values.push(Date.now());
  values.push(req.params.id, req.user.id);

  db.prepare(`UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  res.json({ note });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

export default router;
