import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

// Function to generate a simple uncompressed/zlib compressed PNG
function createSolidPng(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type (RGBA)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter type 0 before each scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Gradient effect
      const factor = y / height;
      const curR = Math.round(30 * (1 - factor) + 67 * factor);
      const curG = Math.round(64 * (1 - factor) + 56 * factor);
      const curB = Math.round(175 * (1 - factor) + 202 * factor);

      rawData[pixelOffset] = curR;
      rawData[pixelOffset + 1] = curG;
      rawData[pixelOffset + 2] = curB;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(len, 0);

  const crcData = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const png192 = createSolidPng(192, 192, 30, 64, 175);
const png512 = createSolidPng(512, 512, 30, 64, 175);

fs.writeFileSync(path.join(publicDir, 'pwa-192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-icon.png'), png512);

console.log('Valid PNG icons created in public directory.');
