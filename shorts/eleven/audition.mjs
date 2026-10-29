// Voice auditions on drama-3 at natural speed: the same two emotional excerpts per candidate voice.
//   NODE_USE_ENV_PROXY=1 node eleven/audition.mjs
import fs from 'node:fs';
import { tts, credit } from '../lib-fish.mjs';
const MIRA = '[hushed and intimate, like confessing a secret she has never told anyone] Every night at eleven eleven... [soft breath] a stranger sends me a voice message. [quieter, unsettled, almost afraid to say it] And everything he says... comes true.';
const KABIR = '[low and tender, heavy with guilt, his voice catching] If you\'ve met me... [shaky breath] I\'m sorry. [pleading, barely above a whisper] Don\'t fall in love with me.';
const CAST = [
  ['mira', 'A-Sarah', '933563129e564b19a115bedd57b7406a', MIRA], ['mira', 'B-Sheila', 'f3a2b90078d54a65af4b95f63bc7798e', MIRA],
  ['mira', 'C-Delia', 'c70cfb98867a4bfb9ae20d2401257b92', MIRA], ['mira', 'D-Selene', 'b347db033a6549378b48d00acb0d06cd', MIRA],
  ['kabir', 'A-Miles', 'f983ef416c87413f986e1a5a000c385e', KABIR], ['kabir', 'B-Adrian', 'bf322df2096a46f18c579d0baa36f41d', KABIR],
  ['kabir', 'C-Alex', '1d52151a55eb4878a997bd06e816b5f6', KABIR], ['kabir', 'D-Han', 'dd2d6f3c27d346f48370989aa0a353ad', KABIR],
];
const before = await credit();
for (const [who, name, id, text] of CAST) {
  const out = `eleven/auditions/${who}-${name}.mp3`;
  if (!fs.existsSync(out)) fs.writeFileSync(out, await tts(text, { model: 'drama-3', voice: id, format: 'mp3', speed: 1 }));
  console.log(out);
}
console.log(`spent $${(before - (await credit())).toFixed(4)}`);
