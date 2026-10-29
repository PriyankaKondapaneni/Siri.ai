// Fish Audio client for the shorts pipeline: text to speech and speech to text, with a hard spend guard.
// The key is read by name (FISH_API_KEY) from the environment or shorts/.env and is never printed.
// Every paid call first reads the account's API credit and refuses to run if it would drop below the floor:
// the floor is the credit at the start of the project minus the budget (see BUDGET in budget.json).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const API = 'https://api.fish.audio';

function key() {
  if (process.env.FISH_API_KEY) return process.env.FISH_API_KEY;
  const env = path.join(here, '.env');
  if (fs.existsSync(env)) {
    for (const line of fs.readFileSync(env, 'utf8').split('\n')) {
      const m = line.match(/^\s*FISH_API_KEY\s*=\s*(.+)\s*$/);
      if (m) return m[1].replace(/^['"]|['"]$/g, '');
    }
  }
  throw new Error('No FISH_API_KEY in the environment or shorts/.env');
}

const auth = () => ({ Authorization: `Bearer ${key()}` });

export async function credit() {
  const r = await fetch(`${API}/wallet/self/api-credit`, { headers: auth() });
  if (!r.ok) throw new Error(`credit check failed: ${r.status} ${await r.text()}`);
  return Number((await r.json()).credit);
}

// budget.json: { "start": 10, "budget": 4 } -> never let the credit fall below 6
const budgetFile = path.join(here, 'budget.json');
export function budget() {
  return JSON.parse(fs.readFileSync(budgetFile, 'utf8'));
}

async function guard(estimate) {
  const b = budget();
  const now = await credit();
  const floor = b.start - b.budget;
  if (now - estimate < floor) throw new Error(`Spend guard: credit $${now.toFixed(4)}, this call ~$${estimate.toFixed(4)}, floor $${floor.toFixed(2)}. Refusing.`);
  return now;
}

const PRICE = { 'drama-3': 10 / 1e6, 's2.1-pro': 15 / 1e6, 's2-pro': 15 / 1e6, 's2.1-pro-free': 0 }; // $ per UTF-8 byte (drama-3 at launch price until 2026-11-12)

/** Text to speech. Returns the audio bytes. opts: { model, voice | voices[], format, temperature, top_p, speed } */
export async function tts(text, opts = {}) {
  const model = opts.model || 'drama-3';
  const bytes = Buffer.byteLength(text, 'utf8');
  // list price for drama-3 is $50/M: guard against that, in case the promotion has ended
  const est = bytes * (model === 'drama-3' ? 50 / 1e6 : PRICE[model] ?? 15 / 1e6);
  await guard(est);
  const body = {
    text,
    reference_id: opts.voices || opts.voice,
    format: opts.format || 'wav',
    sample_rate: 44100,
    temperature: opts.temperature ?? 0.7,
    top_p: opts.top_p ?? 0.7,
    prosody: { speed: opts.speed ?? 1, volume: 0, normalize_loudness: true },
    normalize: true,
    latency: 'normal',
    chunk_length: 300,
    condition_on_previous_chunks: true,
  };
  const r = await fetch(`${API}/v1/tts`, { method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json', model }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`tts failed: ${r.status} ${await r.text()}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Speech to text with word timestamps (transcribe-1-pro). Returns the JSON response. */
export async function asr(audioPath, language = 'en') {
  const buf = fs.readFileSync(audioPath);
  await guard(0.02);
  const form = new FormData();
  form.append('audio', new Blob([buf]), path.basename(audioPath));
  form.append('language', language);
  form.append('ignore_timestamps', 'false');
  form.append('tag_audio_events', 'false');
  form.append('diarize', 'false');
  const r = await fetch(`${API}/v1/asr`, { method: 'POST', headers: { ...auth(), model: 'transcribe-1-pro' }, body: form });
  if (!r.ok) throw new Error(`asr failed: ${r.status} ${await r.text()}`);
  return r.json();
}
