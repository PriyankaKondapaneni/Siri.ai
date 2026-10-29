// Audition voices for Kabir on his two hardest lines (urgent, then breaking).
import fs from 'node:fs';
import { tts, credit } from '../lib-fish.mjs';
const V = { miles: 'f983ef416c87413f986e1a5a000c385e', wesley: '8634617958764b539e0cdd5eb6c7723e', hollis: 'f1c025d3f1ce4018a26b47948c1e172b', kai: '0db6e93af420470b9d9b9a886dbaa954', beau: '732ea755bd9e446eb31dc79966b50428', aarav: '659f2173c5e346c198ea856f5f22eb15' };
const LINE = '[urgent, low, trying to stay calm] Mira. Tomorrow, six-forty, Fifth Street. Stay on the curb. Promise me. [long pause] [voice breaking, close to the phone, barely holding it together] If you\'ve met me... I\'m sorry. Don\'t fall in love with me.';
const before = await credit();
for (const [n, id] of Object.entries(V)) {
  const p = `eleven/build/audition/${n}.wav`;
  if (!fs.existsSync(p)) fs.writeFileSync(p, await tts(LINE, { model: 'drama-3', voice: id }));
  console.log(n, 'ok');
}
console.log(`spent $${(before - (await credit())).toFixed(4)}`);
