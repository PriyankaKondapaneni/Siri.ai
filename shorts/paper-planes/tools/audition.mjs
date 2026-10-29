// Step 2a: audition narrator voices on two lines of the script, so the voice is chosen by ear (and by measurement)
// before the full take. node --env-file? no: run with NODE_USE_ENV_PROXY=1 from shorts/.
import fs from 'node:fs';
import { tts, credit } from '../../lib-fish.mjs';

const VOICES = {
  sarah: '933563129e564b19a115bedd57b7406a',
  selene: 'b347db033a6549378b48d00acb0d06cd',
  delia: 'c70cfb98867a4bfb9ae20d2401257b92',
  sheila: 'f3a2b90078d54a65af4b95f63bc7798e',
};
const LINE = '[hushed, intimate, drawing the listener in] She sent him forty-seven paper planes... before she ever heard his voice. [warm, tender, a small smile] Mira never did hear his voice. She learned it instead.';
fs.mkdirSync('paper-planes/build/audition', { recursive: true });
const before = await credit();
for (const [name, id] of Object.entries(process.argv[2] ? { [process.argv[2]]: VOICES[process.argv[2]] } : VOICES)) {
  const wav = await tts(LINE, { model: 'drama-3', voice: id });
  fs.writeFileSync(`paper-planes/build/audition/${name}.wav`, wav);
  console.log(name, wav.length, 'bytes');
}
const after = await credit();
console.log(`credit $${before.toFixed(4)} -> $${after.toFixed(4)} (spent $${(before - after).toFixed(4)})`);
