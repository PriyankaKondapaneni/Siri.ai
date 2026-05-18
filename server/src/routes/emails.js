import express from 'express';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { label, unread } = req.query;
  let sql = 'SELECT * FROM emails WHERE user_id = ?';
  const params = [req.user.id];
  if (label) { sql += ' AND label = ?'; params.push(label); }
  if (unread === '1') sql += ' AND is_read = 0';
  sql += ' ORDER BY received_at DESC';
  const emails = db.prepare(sql).all(...params);
  res.json({ emails });
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM emails WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Email not found' });

  const fields = ['is_read', 'is_starred', 'label'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (f in req.body) {
      updates.push(`${f} = ?`);
      values.push(f === 'is_read' || f === 'is_starred' ? (req.body[f] ? 1 : 0) : req.body[f]);
    }
  }
  if (!updates.length) return res.json({ email: existing });
  values.push(req.params.id, req.user.id);
  db.prepare(`UPDATE emails SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(req.params.id);
  res.json({ email });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM emails WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

export default router;
