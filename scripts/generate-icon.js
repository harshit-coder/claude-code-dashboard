// Generate a simple app icon (PNG) for Claude Code Dashboard
// Creates a 256x256 purple icon with "CC" text
// Run: node scripts/generate-icon.js

const fs = require('fs');
const path = require('path');

// Minimal PNG generator (no dependencies)
function createPNG(width, height, pixels) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw image data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const srcOff = (y * width + x) * 4;
      const dstOff = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstOff] = pixels[srcOff];       // R
      rawData[dstOff + 1] = pixels[srcOff + 1]; // G
      rawData[dstOff + 2] = pixels[srcOff + 2]; // B
      rawData[dstOff + 3] = pixels[srcOff + 3]; // A
    }
  }

  // Compress with zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData);

  // Build chunks
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuffer = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuffer, data]);

    // CRC32
    let crc = 0xffffffff;
    for (let i = 0; i < crcData.length; i++) {
      crc ^= crcData[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    crc ^= 0xffffffff;
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc >>> 0, 0);

    return Buffer.concat([len, typeBuffer, data, crcBuf]);
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw the icon
const SIZE = 256;
const pixels = Buffer.alloc(SIZE * SIZE * 4);

// Colors
const BG = [0x0f, 0x11, 0x17, 0xff];       // Dark background
const ACCENT = [0x6c, 0x5c, 0xe7, 0xff];    // Purple accent
const WHITE = [0xff, 0xff, 0xff, 0xff];

function setPixel(x, y, color) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const off = (y * SIZE + x) * 4;
  pixels[off] = color[0];
  pixels[off + 1] = color[1];
  pixels[off + 2] = color[2];
  pixels[off + 3] = color[3];
}

function fillCircle(cx, cy, r, color) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) {
        setPixel(Math.round(x), Math.round(y), color);
      }
    }
  }
}

function fillRoundedRect(x1, y1, x2, y2, r, color) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      let inside = false;
      if (x >= x1 + r && x <= x2 - r) inside = true;
      else if (y >= y1 + r && y <= y2 - r) inside = true;
      else {
        // Check corners
        const corners = [
          [x1 + r, y1 + r], [x2 - r, y1 + r],
          [x1 + r, y2 - r], [x2 - r, y2 - r],
        ];
        for (const [cx, cy] of corners) {
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) {
            inside = true;
            break;
          }
        }
      }
      if (inside) setPixel(x, y, color);
    }
  }
}

// Draw: rounded rectangle background
fillRoundedRect(0, 0, SIZE - 1, SIZE - 1, 40, ACCENT);

// Draw inner dark area
fillRoundedRect(12, 12, SIZE - 13, SIZE - 13, 30, BG);

// Draw terminal prompt symbol "> _"
// ">"  character — large chevron
const chevronX = 55, chevronY = 128, chevronSize = 45;
for (let i = 0; i < chevronSize; i++) {
  const thickness = 8;
  for (let t = 0; t < thickness; t++) {
    // Top half of ">"
    setPixel(chevronX + i, chevronY - i + t, WHITE);
    // Bottom half of ">"
    setPixel(chevronX + i, chevronY + i + t, WHITE);
  }
}

// "_" underscore cursor
const cursorX = 120, cursorY = 165, cursorW = 50, cursorH = 8;
fillRoundedRect(cursorX, cursorY, cursorX + cursorW, cursorY + cursorH, 3, ACCENT);

// Blinking cursor block
fillRoundedRect(cursorX + cursorW + 10, cursorY - 30, cursorX + cursorW + 22, cursorY + cursorH, 3, WHITE);

// Save
const png = createPNG(SIZE, SIZE, pixels);
const outputPath = path.join(__dirname, '..', 'assets', 'icon.png');
fs.writeFileSync(outputPath, png);
console.log(`Icon saved to ${outputPath} (${png.length} bytes)`);
