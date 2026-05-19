// Backend logic for the ADHD planner. No AI required.
//
// - classifyHeuristically(dump): turn raw text into structured items + state/energy
//   using keyword rules. Used when ANTHROPIC_API_KEY is not configured.
// - parseClassification(text): parse the structured JSON the LLM returns when
//   the key IS configured.
// - buildPlan(classification): deterministic prioritization, capping,
//   skip_today bucketing, and freeze-step selection. Used in both paths.

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

// --- Heuristic classifier ---------------------------------------------------

const CATEGORY_KEYWORDS = {
  communication: [
    'reply', 'respond', 'message', 'msg ', 'email', 'mail', 'text ', 'call ',
    'ping', 'dm', 'manager', 'boss', 'client', 'send', 'follow up', 'follow-up',
    'slack', 'whatsapp',
  ],
  self_care: [
    'eat', 'eaten', 'food', 'meal', 'breakfast', 'lunch', 'dinner',
    'drink', 'water', 'sleep', 'slept', 'shower', 'rest', 'tired',
    'hungry', 'thirsty', 'nap', 'walk', 'stretch', 'medicine', 'meds',
  ],
  chore: [
    'clean', 'tidy', 'laundry', 'dishes', 'trash', 'groceries', 'buy',
    'errand', 'fix', 'organize', 'room', 'kitchen', 'bathroom', 'dust',
    'vacuum', 'pay bill', 'bills', 'rent',
  ],
  work: [
    'code', 'study', 'review', 'ticket', 'pr', 'merge', 'meeting',
    'presentation', 'deck', 'deadline', 'ship', 'dsa', 'leetcode',
    'interview', 'read', 'document', 'spec', 'design', 'implement',
    'debug', 'test', 'deploy', 'paper', 'thesis', 'project', 'task',
    'assignment', 'homework', 'class', 'lecture', 'exam',
  ],
  emotional: [
    'feel', 'guilty', 'guilt', 'anxious', 'anxiety', 'worried', 'worry',
    'stressed', 'scared', 'sad', 'overwhelmed', 'lonely', 'stuck',
    'frozen', 'regret', 'cry', 'breakdown', 'avoid', 'shame', 'hate',
  ],
};

const HIGH_PRIORITY_KEYWORDS = [
  'urgent', 'asap', 'today', 'now', 'manager', 'boss', 'deadline',
  'due', 'ship', 'havent', "haven't", 'missed', 'overdue', 'interview',
  'client', 'tonight', 'eod', 'tomorrow morning', 'sick', 'pain', 'fever',
];
const LOW_PRIORITY_KEYWORDS = [
  'eventually', 'someday', 'maybe', 'could', 'want to', 'might', 'wish',
];

const CATEGORY_MINUTES = {
  communication: 2,
  self_care: 5,
  chore: 10,
  work: 15,
  emotional: 2,
  other: 5,
};

function rewriteFor(category, raw) {
  const lower = raw.toLowerCase();
  switch (category) {
    case 'communication':
      return `Send 1 line about: ${raw}`;
    case 'self_care':
      if (/eat|hungry|food|meal|breakfast|lunch|dinner|eaten/.test(lower))
        return 'Eat anything in reach (snack, fruit, bar)';
      if (/drink|water|thirst/.test(lower))
        return 'Drink one glass of water now';
      if (/sleep|slept|tired|rest|nap/.test(lower))
        return 'Lie down for 10 min, eyes closed';
      if (/shower/.test(lower))
        return 'Get in the shower; even 2 min counts';
      if (/meds|medicine/.test(lower))
        return 'Take meds now; set them by your hand';
      return `Take care of: ${raw}`;
    case 'chore':
      return `5 min on: ${raw}`;
    case 'work':
      return `Open it; 10 min on: ${raw}`;
    case 'emotional':
      return `Write 1 line about it in notes; don't fix it`;
    default:
      return `5 min on: ${raw}`;
  }
}

function classifyLine(line) {
  const lower = line.toLowerCase();

  let category = 'other';
  for (const cat of Object.keys(CATEGORY_KEYWORDS)) {
    if (CATEGORY_KEYWORDS[cat].some(kw => lower.includes(kw))) {
      category = cat;
      break;
    }
  }

  let priority = 'medium';
  if (HIGH_PRIORITY_KEYWORDS.some(kw => lower.includes(kw))) priority = 'high';
  else if (LOW_PRIORITY_KEYWORDS.some(kw => lower.includes(kw))) priority = 'low';
  else if (category === 'emotional') priority = 'low';

  // "havent eaten" / "no water all day" → self_care + high
  if (category === 'self_care' && /havent|haven't|no |missed/.test(lower)) {
    priority = 'high';
  }

  return {
    raw: line,
    rewrite: rewriteFor(category, line),
    priority,
    minutes: CATEGORY_MINUTES[category],
    category,
  };
}

function detectEnergy(items, lowerDump) {
  if (/(tired|exhausted|drained|no energy|burnt out|havent slept|haven't slept|cant focus|can't focus)/.test(lowerDump))
    return 'low';
  if (items.length >= 7) return 'low';
  if (items.length <= 2 && /(ready|fine|good|okay|energized)/.test(lowerDump))
    return 'high';
  return 'medium';
}

function detectState(items, lowerDump, energy) {
  if (/(stuck|frozen|cant start|can't start|paralyzed|cant move|can't move)/.test(lowerDump))
    return 'frozen';
  const emotional = items.filter(i => i.category === 'emotional').length;
  const high = items.filter(i => i.priority === 'high').length;
  if (emotional >= 2 || items.length >= 7 || /(too much|everything|all of this|drowning)/.test(lowerDump))
    return 'overwhelmed';
  if (high >= 3) return 'stressed';
  if (energy === 'low') return 'low-energy';
  return 'okay';
}

export function classifyHeuristically(dump) {
  const lines = dump.split('\n').map(l => l.trim()).filter(Boolean);
  const items = lines.map(classifyLine);
  const lower = dump.toLowerCase();
  const energy = detectEnergy(items, lower);
  const state = detectState(items, lower, energy);
  return { state, energy, items };
}

// --- LLM output normalizer --------------------------------------------------

export function parseClassification(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const slice = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice);
}

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

// --- Deterministic plan builder ---------------------------------------------

export function buildPlan(classification) {
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

export const ADHD_SYSTEM_PROMPT = `You classify lines from an ADHD brain dump.

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
