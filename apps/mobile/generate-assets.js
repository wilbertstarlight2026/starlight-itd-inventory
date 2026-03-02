const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

function computeCRC(buf) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) | 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeInt32BE(computeCRC(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPNG(width, height, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2;

  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rs = y * (1 + width * 3);
    raw[rs] = 0;
    for (let x = 0; x < width; x++) {
      raw[rs + 1 + x * 3] = r;
      raw[rs + 1 + x * 3 + 1] = g;
      raw[rs + 1 + x * 3 + 2] = b;
    }
  }

  const comp = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', comp), chunk('IEND', Buffer.alloc(0))]);
}

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

// Navy blue #1E3A5F = rgb(30, 58, 95)
fs.writeFileSync(path.join(assetsDir, 'icon.png'), createPNG(1024, 1024, 30, 58, 95));
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), createPNG(1024, 1024, 30, 58, 95));
fs.writeFileSync(path.join(assetsDir, 'splash.png'), createPNG(1284, 2778, 30, 58, 95));

console.log('Assets generated:', assetsDir);
