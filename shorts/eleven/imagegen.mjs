// Generate character and background art with OpenAI's image model, using the approved portraits as references so
// faces, outfits and style stay consistent. Logs token usage per image to assets/art/gen/usage.json.
//   NODE_USE_ENV_PROXY=1 node imagegen.mjs <name> [--bg]   (prompts in art.json)
import fs from 'node:fs';
import path from 'node:path';

const env = fs.readFileSync('../.env', 'utf8');
const KEY = process.env.OPENAI_API_KEY || env.match(/^OPENAI_API_KEY=(.+)$/m)[1].trim();
const ART = JSON.parse(fs.readFileSync('art.json', 'utf8'));
const name = process.argv[2];
const job = ART.images[name];
if (!job) throw new Error(`no ${name} in art.json`);
const out = `assets/art/gen/${name}.png`;
if (fs.existsSync(out) && !process.argv.includes('--again')) { console.log(`${name}: already made`); process.exit(0); }
const form = new FormData();
form.append('model', ART.model);
form.append('prompt', `${ART.style} ${job.prompt}`);
form.append('size', job.size || '1024x1536');
form.append('quality', 'high');
form.append('output_format', 'png');
if (job.transparent) form.append('background', 'transparent');
for (const ref of job.refs || []) form.append('image[]', new Blob([fs.readFileSync(`assets/art/source/${ref}.png`)], { type: 'image/png' }), `${ref}.png`);
const url = job.refs?.length ? 'https://api.openai.com/v1/images/edits' : 'https://api.openai.com/v1/images/generations';
let body = form, headers = { Authorization: `Bearer ${KEY}` };
if (!job.refs?.length) { body = JSON.stringify(Object.fromEntries([...form.entries()].map(([k, v]) => [k, v]))); headers['Content-Type'] = 'application/json'; }
const t0 = Date.now();
const r = await fetch(url, { method: 'POST', headers, body });
const j = await r.json();
if (!r.ok) { console.error(`${name}: ${r.status} ${JSON.stringify(j.error || j).slice(0, 400)}`); process.exit(1); }
fs.writeFileSync(out, Buffer.from(j.data[0].b64_json, 'base64'));
const usageFile = 'assets/art/gen/usage.json';
const usage = fs.existsSync(usageFile) ? JSON.parse(fs.readFileSync(usageFile, 'utf8')) : {};
usage[name] = j.usage || null;
fs.writeFileSync(usageFile, JSON.stringify(usage, null, 1));
console.log(`${name}: ${out} in ${((Date.now() - t0) / 1000).toFixed(0)} s, usage ${JSON.stringify(j.usage)}`);
