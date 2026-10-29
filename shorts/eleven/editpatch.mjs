// Edit only the masked region of a face crop (eyes closed for a blink, mouth open for speech) at medium quality:
// a small, cheap edit that leaves the rest of the face untouched. Inputs/outputs in assets/art/patch/.
//   NODE_USE_ENV_PROXY=1 node editpatch.mjs <name> <b|m>
import fs from 'node:fs';
const env = fs.readFileSync('../.env', 'utf8');
const KEY = env.match(/^OPENAI_API_KEY=(.+)$/m)[1].trim();
const [name, v] = process.argv.slice(2);
const dir = 'assets/art/patch';
const out = `${dir}/${name}${v}_out.png`;
if (fs.existsSync(out) && !process.argv.includes('--again')) { console.log(`${name}${v}: already made`); process.exit(0); }
const who = name.startsWith('M') ? 'her' : 'his';
const prompt = v === 'b'
  ? `Exactly the same illustration, same style and lighting. Only change: ${who} eyes are gently closed mid-blink, eyelids down with lashes visible. Everything else identical.`
  : `Exactly the same illustration, same style and lighting. Only change: ${who} lips are slightly parted as if speaking softly, a hint of teeth. Everything else identical.`;
const form = new FormData();
form.append('model', 'gpt-image-2');
form.append('prompt', prompt);
form.append('size', '1024x1024');
form.append('quality', process.env.Q || 'medium');
form.append('image[]', new Blob([fs.readFileSync(`${dir}/${name}${v}_in.png`)], { type: 'image/png' }), 'in.png');
form.append('mask', new Blob([fs.readFileSync(`${dir}/${name}${v}_mask.png`)], { type: 'image/png' }), 'mask.png');
const r = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${KEY}` }, body: form });
const j = await r.json();
if (!r.ok) { console.error(`${name}${v}: ${r.status} ${JSON.stringify(j.error || j).slice(0, 300)}`); process.exit(1); }
fs.writeFileSync(out, Buffer.from(j.data[0].b64_json, 'base64'));
const uf = 'assets/art/gen/usage.json', u = JSON.parse(fs.readFileSync(uf, 'utf8'));
u[`patch_${name}${v}`] = j.usage; fs.writeFileSync(uf, JSON.stringify(u, null, 1));
console.log(`${name}${v}: ok ${JSON.stringify(j.usage)}`);
