import { parsePng } from 'icon-check/src/png.mjs';

const PNG_MAGIC = 0x89504e47;

function parseJpeg(buf) {
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    // standalone markers (no length field)
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { type: 'jpeg', width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5), hasAlpha: false };
    }
    i += 2 + len;
  }
  throw new Error('could not find a JPEG frame header');
}

/** Read { type, width, height, hasAlpha } from a PNG or JPEG buffer. */
export function parseImage(buf) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  if (b.length >= 8 && b.readUInt32BE(0) === PNG_MAGIC) {
    const p = parsePng(b);
    return { type: 'png', width: p.width, height: p.height, hasAlpha: p.hasAlpha };
  }
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xd8) return parseJpeg(b);
  throw new Error('not a PNG or JPEG');
}
