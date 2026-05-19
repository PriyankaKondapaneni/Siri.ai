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

const ADHD_SYSTEM_PROMPT = `You classify lines from an ADHD brain dump.

For each line, output one item with:
- raw: the original line
- rewrite: rewrite as a 1-line specific action (e.g. "reply to manager" -> "Send 1 line to manager: I'll update by EOD"). No motivational language.
- priority: "high" | "medium" | "low" (urgency + impact, not feelings)
- minutes: realistic estimate as a number from this set: 1, 2, 5, 10, 15, 30
- category: "communication" | "self_care" | "chore" | "work" | "emotional" | "other"

Also detect the overall vibe:
- state: "overwhelmed" | "stressed" | "low-energy" | "frozen" | "okay"
- energy: "low" | "medium" | "high"

Respond ONLY with valid JSON in exactly this shape. No markdown, no backticks, no extra text:
{
  "state": "...",
  "energy": "...",
  "items": [
    { "raw": "...", "rewrite": "...", "priority": "high", "minutes": 5, "category": "communication" }
  ]
}`;

const FREEZE_TEMPLATES = {
  communication: [
    'Step 1: Open the chat or email window',
    'Step 2: Type "Hey, quick update —"',
    'Step 3: Add one short line and hit send',
  ],
  self_care: [
    'Step 1: Stand up',
    'Step 2: Walk to where the thing is (kitchen, fridge, bathroom)',
    'Step 3: Pick up one thing and use it',
  ],
  chore: [
    'Step 1: Pick up ONE item near you',
    'Step 2: Put it where it belongs',
    'Step 3: Stop, or do one more. Either is fine.',
  ],
  work: [
    'Step 1: Open the file or doc',
    'Step 2: Read the first sentence',
    'Step 3: Type one line. Even a bad one.',
  ],
  emotional: [
    'Step 1: Put your phone face down',
    'Step 2: Drink some water',
    'Step 3: Write one sentence in any notes app',
  ],
  other: [
    'Step 1: Set a 2-minute timer',
    'Step 2: Start the smallest version of the task',
    'Step 3: Stop when the timer ends. Or keep going.',
  ],
};

const VALID_STATES = ['overwhelmed', 'stressed', 'low-energy', 'frozen', 'okay'];
const VALID_ENERGY = ['low', 'medium', 'high'];
const VALID_PRIORITY = ['high', 'medium', 'low'];
const VALID_MINUTES = [1, 2, 5, 10, 15, 30];
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function normalizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const text = typeof raw.raw === 'string' ? raw.raw.trim() : '';
  const rewrite = typeof raw.rewrite === 'string' && raw.rewrite.trim() ? raw.rewrite.trim() : text;
  if (!rewrite) return null;
  const priority = VALID_PRIORITY.includes(raw.priority) ? raw.priority : 'medium';
  const minutes = VALID_MINUTES.includes(raw.minutes) ? raw.minutes : 5;
  const category = FREEZE_TEMPLATES[raw.category] ? raw.category : 'other';
  return { raw: text, rewrite, priority, minutes, category };
}

function buildPlan(classification) {
  const state = VALID_STATES.includes(classification?.state) ? classification.state : 'okay';
  const energy = VALID_ENERGY.includes(classification?.energy) ? classification.energy : 'medium';
  const items = Array.isArray(classification?.items)
    ? classification.items.map(normalizeItem).filter(Boolean)
    : [];

  const sorted = [...items].sort((a, b) => {
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    return a.minutes - b.minutes;
  });

  const maxTasks = energy === 'low' ? 2 : 4;
  const top = sorted.slice(0, maxTasks);
  const rest = sorted.slice(maxTasks);

  const do_now = top.map(i => ({ task: i.rewrite, time: `${i.minutes} min` }));
  const skip_today = rest.map(i => i.raw || i.rewrite);
  const freeze_steps = top[0]
    ? FREEZE_TEMPLATES[top[0].category]
    : FREEZE_TEMPLATES.other;

  return { state, energy, skip_today, do_now, freeze_steps };
}

const STUB_PLAN = {
  state: 'okay',
  energy: 'medium',
  skip_today: [],
  do_now: [
    { task: 'Add ANTHROPIC_API_KEY to server/.env to enable AI planning', time: '2 min' },
  ],
  freeze_steps: FREEZE_TEMPLATES.other,
};

function parseClassification(text) {
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
    const classification = parseClassification(text);
    const plan = buildPlan(classification);
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
