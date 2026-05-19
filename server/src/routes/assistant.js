import express from 'express';
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

const ADHD_SYSTEM_PROMPT = `You are a practical ADHD planning assistant. No motivational quotes. No emotional validation speeches. No "you got this". No "it's okay to rest". Just clear, practical, small suggestions.

When the user shares a brain dump:
1. Detect their energy and overwhelm level
2. Pick 2-4 of the most important/urgent tasks only
3. Make each suggestion extremely specific and actionable
4. Deprioritize everything else clearly
5. If they mention something emotionally heavy (like replying to someone), suggest a concrete first action (not "take your time")

Respond ONLY with valid JSON. No markdown, no backticks, no extra text.

{
  "state": "overwhelmed" | "stressed" | "low-energy" | "frozen" | "okay",
  "energy": "low" | "medium" | "high",
  "skip_today": ["tasks to ignore today - be specific"],
  "do_now": [
    { "task": "specific action, not vague", "time": "realistic time estimate e.g. 5 min" }
  ],
  "freeze_steps": [
    "Step 1: extremely tiny first action",
    "Step 2: next tiny action",
    "Step 3: one more tiny action"
  ]
}

Rules:
- do_now: max 4 tasks. Each must be specific (e.g. "Send 1 line to manager: I'll update you by evening" not "reply to manager")
- time estimates must be honest and short (2 min, 5 min, 10 min)
- freeze_steps must be almost absurdly small physical actions
- No emotional language in any field
- No motivational phrases anywhere
- If energy is low, do_now should have only 2 tasks max`;

const STUB_PLAN = {
  state: 'okay',
  energy: 'medium',
  skip_today: [],
  do_now: [
    { task: 'Add ANTHROPIC_API_KEY to server/.env to enable AI planning', time: '2 min' },
  ],
  freeze_steps: [
    'Step 1: Open server/.env in an editor',
    'Step 2: Paste your Anthropic API key on the ANTHROPIC_API_KEY line',
    'Step 3: Restart the server',
  ],
};

function parsePlan(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const slice = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice);
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

router.post('/adhd-plan', async (req, res) => {
  const dump = typeof req.body?.dump === 'string' ? req.body.dump.trim() : '';
  if (!dump) return res.status(400).json({ error: 'dump is required' });

  const client = getClient();
  if (!client) return res.json(STUB_PLAN);

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system: ADHD_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: dump }],
    });
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const plan = parsePlan(text);
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to plan' });
  }
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
