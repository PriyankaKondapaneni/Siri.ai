import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import {
  ADHD_SYSTEM_PROMPT,
  buildPlan,
  classifyHeuristically,
  parseClassification,
} from '../lib/adhdPlanner.js';

const router = express.Router();
router.use(requireAuth);

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-4-7';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

router.post('/plan-day', async (req, res) => {
  const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(req.user.id);
  const today = new Date().toISOString().slice(0, 10);
  const tasks = db
    .prepare("SELECT title, priority, due_date FROM tasks WHERE user_id = ? AND status = 'pending' ORDER BY priority")
    .all(req.user.id);
  const events = db
    .prepare('SELECT title, start_at, end_at FROM events WHERE user_id = ? AND start_at LIKE ?')
    .all(req.user.id, `${today}%`);

  const client = getClient();
  if (!client) {
    return res.json({ plan: 'Add ANTHROPIC_API_KEY to enable AI-powered day planning.' });
  }

  const summary = `Tasks:\n${tasks.map(t => `- [${t.priority}] ${t.title}${t.due_date ? ` (due ${t.due_date})` : ''}`).join('\n') || '(none)'}\n\nMeetings today:\n${events.map(e => `- ${new Date(e.start_at).toLocaleTimeString()} ${e.title}`).join('\n') || '(none)'}`;

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system: `You are Siri, an AI productivity assistant. Help ${user.name} plan their day with a clear time-blocked schedule. Be concise and use markdown.`,
      messages: [{ role: 'user', content: `Plan my day. Here is my data:\n\n${summary}` }],
    });
    const plan = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function classifyWithAI(client, dump) {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    system: ADHD_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: dump }],
  });
  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return parseClassification(text);
}

router.post('/adhd-plan', async (req, res) => {
  const dump = typeof req.body?.dump === 'string' ? req.body.dump.trim() : '';
  if (!dump) return res.status(400).json({ error: 'dump is required' });

  const client = getClient();
  let classification;
  if (client) {
    try {
      classification = await classifyWithAI(client, dump);
    } catch {
      classification = classifyHeuristically(dump);
    }
  } else {
    classification = classifyHeuristically(dump);
  }

  res.json(buildPlan(classification));
});

router.post('/summarize', async (req, res) => {
  const { text, instruction } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });

  const client = getClient();
  if (!client) {
    return res.json({ result: 'Add ANTHROPIC_API_KEY to enable AI summarization.' });
  }

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: 'You are Siri, an AI productivity assistant. Be concise and structured.',
      messages: [{ role: 'user', content: `${instruction || 'Summarize the following:'}\n\n${text}` }],
    });
    const result = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
