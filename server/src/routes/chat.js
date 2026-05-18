import express from 'express';
import { nanoid } from 'nanoid';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-4-7';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function buildSystemPrompt(user) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return `You are Siri, an AI productivity assistant inside the Siri.ai app — an all-in-one workspace for tasks, notes, calendar, and email.

You help ${user?.name || 'the user'} stay focused, plan their day, draft emails and notes, summarize meetings, triage their inbox, and answer questions.

Today is ${today}.

Style guidelines:
- Be concise, warm, and direct. Avoid filler.
- When asked to plan a day or week, propose a clear schedule with time blocks.
- When drafting, return well-formatted markdown with a clear structure.
- When asked to summarize, lead with the most important takeaway.
- Ask one clarifying question only if essential; otherwise make a reasonable best attempt.

You are inside Siri.ai. Never refer to yourself as Saner. Refer to yourself as Siri.`;
}

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

  const history = db
    .prepare('SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC')
    .all(chat.id);

  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.user.id);
  const client = getClient();

  let assistantText;
  if (!client) {
    assistantText = `Siri here. I'm running without an ANTHROPIC_API_KEY configured, so I can't reach Claude right now. Add your key in server/.env to enable full responses.\n\nYou said: "${content}"`;
  } else {
    try {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: buildSystemPrompt(user),
        messages: history.map(m => ({ role: m.role, content: m.content })),
      });
      assistantText = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n')
        .trim() || '(no response)';
    } catch (err) {
      console.error('Claude API error:', err);
      assistantText = `I hit an error reaching Claude: ${err.message || err}. Check that your ANTHROPIC_API_KEY is valid.`;
    }
  }

  const assistantMessageId = nanoid();
  const replyTime = Date.now();
  db.prepare(
    'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(assistantMessageId, chat.id, 'assistant', assistantText, replyTime);

  let title = chat.title;
  const messageCount = db.prepare('SELECT COUNT(*) AS c FROM messages WHERE chat_id = ?').get(chat.id).c;
  if (messageCount <= 2 && (!title || title === 'New chat')) {
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
