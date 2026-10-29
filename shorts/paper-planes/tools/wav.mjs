// Minimal WAV reading and writing (PCM 16-bit and float32), so the audio tools stay plain JavaScript.
import fs from 'node:fs';

export function readWav(path) {
  const b = fs.readFileSync(path);
  let o = 12, fmt, data;
  while (o < b.length - 8) {
    const id = b.toString('ascii', o, o + 4), size = b.readUInt32LE(o + 4);
    if (id === 'fmt ') fmt = { format: b.readUInt16LE(o + 8), channels: b.readUInt16LE(o + 10), rate: b.readUInt32LE(o + 12), bits: b.readUInt16LE(o + 22) };
    if (id === 'data') { data = b.subarray(o + 8, o + 8 + Math.min(size, b.length - o - 8)); break; }
    o += 8 + size + (size & 1);
  }
  const n = data.length / (fmt.bits / 8) / fmt.channels;
  const ch = Array.from({ length: fmt.channels }, () => new Float32Array(n));
  for (let i = 0; i < n; i++) for (let c = 0; c < fmt.channels; c++) {
    const k = (i * fmt.channels + c) * (fmt.bits / 8);
    ch[c][i] = fmt.bits === 16 ? data.readInt16LE(k) / 32768 : fmt.bits === 32 && fmt.format === 3 ? data.readFloatLE(k) : data.readInt32LE(k) / 2147483648;
  }
  return { rate: fmt.rate, channels: ch };
}

/** Write float channels as 32-bit float WAV (no clipping at this stage; the mix masters it). */
export function writeWav(path, rate, channels) {
  const n = channels[0].length, nc = channels.length;
  const b = Buffer.alloc(44 + n * nc * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * nc * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(3, 20); b.writeUInt16LE(nc, 22); b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * nc * 4, 28); b.writeUInt16LE(nc * 4, 32); b.writeUInt16LE(32, 34); b.write('data', 36); b.writeUInt32LE(n * nc * 4, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) b.writeFloatLE(channels[c][i], 44 + (i * nc + c) * 4);
  fs.writeFileSync(path, b);
}
