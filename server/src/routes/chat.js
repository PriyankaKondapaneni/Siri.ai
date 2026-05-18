import express from 'express';
import { nanoid } from 'nanoid';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

const STUB_REPLIES = [
  "Got it. I'm running in stub mode right now — Claude isn't wired in yet. Once you connect your API key in `server/.env`, I'll give a real answer here.\n\nFor now, here's a sketch of what I'd do:\n\n- Pull in what you have on your plate\n- Group by theme\n- Surface the 1–2 highest-leverage things",
  "Quick note — I'm in stub mode (no AI calls yet). When you turn on the Claude API, I'll have real context across your tasks, notes, and inbox.\n\nIn the meantime, try jotting it as a quick note and I'll help you organize it later.",
  "Thanks for the prompt. I'm running without an LLM connection at the moment, but once Claude is enabled I'll be able to:\n\n1. Plan your day based on your schedule and tasks\n2. Summarize emails and notes\n3. Turn freeform thoughts into next steps\n\nSwitch on the API key whenever you're ready.",
  "Stub reply: I hear you. Once Claude is connected I'll respond with real reasoning here. Until then, treat me as a placeholder — the rest of the app (tasks, inbox, notes, timeline) is fully functional.",
];

router.get('/', (req, res) => {
  const chats = db
    .prepare('SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC')
    .all(req.user.id);
  res.json({ chats });
});

router.get('/:id', (req, res) => {
  const chat = db.prepare('SELECT * FROM chats WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  const messages = db
    .prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC')
    .all(chat.id);
  res.json({ chat, messages });
});

router.post('/', (req, res) => {
  const id = nanoid();
  const now = Date.now();
  const title = req.body?.title || 'New chat';
  db.prepare(
    'INSERT INTO chats (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.user.id, title, now, now);
  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(id);
  res.json({ chat });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM chats WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

router.post('/:id/messages', async (req, res) => {
  const { content } = req.body || {};
  if (!content) return res.status(400).json({ error: 'content is required' });

  const chat = db.prepare('SELECT * FROM chats WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  const now = Date.now();
  const userMessageId = nanoid();
  db.prepare(
    'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userMessageId, chat.id, 'user', content, now);

  // Stub mode — Claude API not wired in yet. Pick a varied placeholder reply.
  await new Promise(r => setTimeout(r, 600 + Math.random() * 600));
  const assistantText = STUB_REPLIES[Math.floor(Math.random() * STUB_REPLIES.length)];

  const assistantMessageId = nanoid();
  const replyTime = Date.now();
  db.prepare(
    'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(assistantMessageId, chat.id, 'assistant', assistantText, replyTime);

  let title = chat.title;
  const messageCount = db.prepare('SELECT COUNT(*) AS c FROM messages WHERE chat_id = ?').get(chat.id).c;
  if (messageCount <= 2 && (!title || title === 'New chat' || title === 'Conversation' || title === 'Quick chat')) {
    title = content.slice(0, 60);
    db.prepare('UPDATE chats SET title = ?, updated_at = ? WHERE id = ?').run(title, replyTime, chat.id);
  } else {
    db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?').run(replyTime, chat.id);
  }

  res.json({
    userMessage: { id: userMessageId, chat_id: chat.id, role: 'user', content, created_at: now },
    assistantMessage: { id: assistantMessageId, chat_id: chat.id, role: 'assistant', content: assistantText, created_at: replyTime },
    chat: { ...chat, title, updated_at: replyTime },
  });
});

export default router;
