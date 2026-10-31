// ElevenLabs client for the shorts pipeline: text to speech (Eleven v4) returned as 44.1 kHz mono WAV bytes.
// The key is read by name (ELEVEN_API_KEY) from the environment or shorts/.env and is never printed.
// Spend guard: the key cannot read the subscription, so every call is logged in eleven-ledger.json and refused
// once this project's characters would pass the cap in budget.json ("eleven_chars", default 20000).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const API = 'https://api.elevenlabs.io/v1';

function key() {
  if (process.env.ELEVEN_API_KEY) return process.env.ELEVEN_API_KEY;
  const env = path.join(here, '.env');
  if (fs.existsSync(env)) {
    for (const line of fs.readFileSync(env, 'utf8').split('\n')) {
      const m = line.match(/^\s*ELEVEN_API_KEY\s*=\s*(.+)\s*$/);
      if (m) return m[1].replace(/^['"]|['"]$/g, '');
    }
  }
  throw new Error('No ELEVEN_API_KEY in the environment or shorts/.env');
}

const ledgerFile = path.join(here, 'eleven-ledger.json');
const ledger = () => (fs.existsSync(ledgerFile) ? JSON.parse(fs.readFileSync(ledgerFile, 'utf8')) : { chars: 0, calls: 0 });
function cap() {
  const b = path.join(here, 'budget.json');
  return (fs.existsSync(b) && JSON.parse(fs.readFileSync(b, 'utf8')).eleven_chars) || 20000;
}
export function used() { return ledger().chars; }

/** Text to speech. opts: { voice, model = 'eleven_v4', seed, stability } -> WAV bytes */
export async function tts(text, opts = {}) {
  const L = ledger(), n = text.length;
  if (L.chars + n > cap()) throw new Error(`Spend guard: ${L.chars} + ${n} chars would pass the ElevenLabs cap of ${cap()}. Refusing.`);
  const body = { text, model_id: opts.model || 'eleven_v4' };
  if (opts.seed != null) body.seed = opts.seed;
  if (opts.stability != null) body.voice_settings = { stability: opts.stability };
  const r = await fetch(`${API}/text-to-speech/${opts.voice}?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'xi-api-key': key(), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`ElevenLabs TTS failed: ${r.status} ${(await r.text()).slice(0, 300)}`);
  const mp3 = Buffer.from(await r.arrayBuffer());
  L.chars += n; L.calls += 1; fs.writeFileSync(ledgerFile, JSON.stringify(L, null, 1));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'el-'));
  fs.writeFileSync(`${tmp}/a.mp3`, mp3);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `${tmp}/a.mp3`, '-ar', '44100', '-ac', '1', `${tmp}/a.wav`]);
  const wav = fs.readFileSync(`${tmp}/a.wav`);
  fs.rmSync(tmp, { recursive: true, force: true });
  return wav;
}
