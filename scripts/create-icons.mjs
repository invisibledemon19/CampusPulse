import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

mkdirSync('public', { recursive: true });

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function generatePng(width, height, pixelShader) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines: each row starts with filter byte 0
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = pixelShader(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatChunk = makeChunk('IDAT', deflateSync(rawData));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Shader for icon mark: teal background (#0F766E = [15, 118, 110]), white plus sign
function iconShader(x, y, width, height) {
  const normX = x / width;
  const normY = y / height;
  const isHorizontalBar = (normY >= 0.4375 && normY <= 0.5625) && (normX >= 0.21875 && normX <= 0.78125);
  const isVerticalBar = (normX >= 0.4375 && normX <= 0.5625) && (normY >= 0.21875 && normY <= 0.78125);

  if (isHorizontalBar || isVerticalBar) {
    return [255, 255, 255, 255]; // White plus
  }
  return [15, 118, 110, 255]; // Flat teal #0F766E
}

// 1. favicon.svg
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0F766E"/>
  <path d="M14 7h4v7h7v4h-7v7h-4v-7H7v-4h7z" fill="#FFFFFF"/>
</svg>\n`;
writeFileSync('public/favicon.svg', faviconSvg);

// 2. 32x32 PNG for favicon.ico
const png32 = generatePng(32, 32, iconShader);
// ICO header: 6 bytes + 16 bytes entry + PNG payload
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type 1 = ICO
icoHeader.writeUInt16LE(1, 4); // 1 image

const icoEntry = Buffer.alloc(16);
icoEntry[0] = 32; // width
icoEntry[1] = 32; // height
icoEntry[2] = 0;  // colors
icoEntry[3] = 0;  // reserved
icoEntry.writeUInt16LE(1, 4); // color planes
icoEntry.writeUInt16LE(32, 6); // bpp
icoEntry.writeUInt32LE(png32.length, 8); // size
icoEntry.writeUInt32LE(6 + 16, 12); // offset

writeFileSync('public/favicon.ico', Buffer.concat([icoHeader, icoEntry, png32]));

// 3. apple-touch-icon.png (180x180)
writeFileSync('public/apple-touch-icon.png', generatePng(180, 180, iconShader));

// 4. icon-192.png (192x192)
writeFileSync('public/icon-192.png', generatePng(192, 192, iconShader));

// 5. icon-512.png (512x512)
writeFileSync('public/icon-512.png', generatePng(512, 512, iconShader));

// 6. og-image.png (1200x630)
// Flat #0F766E background
function ogShader(x, y, width, height) {
  // Render central plus mark in center
  const cx = width / 2;
  const cy = height / 2 - 40;
  const size = 120;
  const dx = x - cx;
  const dy = y - cy;
  const inH = Math.abs(dx) <= size / 2 && Math.abs(dy) <= size / 6;
  const inV = Math.abs(dy) <= size / 2 && Math.abs(dx) <= size / 6;

  if (inH || inV) {
    return [255, 255, 255, 255];
  }
  return [15, 118, 110, 255];
}
writeFileSync('public/og-image.png', generatePng(1200, 630, ogShader));

// 7. site.webmanifest
const manifest = {
  name: 'CampusPlus',
  short_name: 'CampusPlus',
  theme_color: '#0F766E',
  background_color: '#FFFFFF',
  display: 'browser',
  icons: [
    {
      src: '/icon-192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/icon-512.png',
      sizes: '512x512',
      type: 'image/png'
    }
  ]
};
writeFileSync('public/site.webmanifest', JSON.stringify(manifest, null, 2));

// 8. public/404.html (standalone static file)
const html404 = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Page not found | CampusPlus</title>
    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta name="theme-color" content="#0F766E" />
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        padding: 48px 16px;
        font-family: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
        background-color: #F7F8FA;
        color: #111827;
        line-height: 1.5;
        display: flex;
        justify-content: center;
      }
      .container {
        max-width: 600px;
        width: 100%;
        background-color: #FFFFFF;
        border: 1px solid #D1D5DB;
        border-radius: 8px;
        padding: 32px 24px;
      }
      h1 {
        font-size: 28px;
        font-weight: 600;
        margin: 0 0 16px 0;
        color: #111827;
      }
      p {
        margin: 0 0 24px 0;
        color: #4B5563;
        font-size: 16px;
      }
      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 16px;
        border-radius: 6px;
        font-weight: 500;
        font-size: 14px;
        text-decoration: none;
      }
      .btn-primary {
        background-color: #0F766E;
        color: #FFFFFF;
      }
      .btn-primary:hover {
        background-color: #115E59;
      }
      .btn-secondary {
        background-color: #FFFFFF;
        color: #111827;
        border: 1px solid #D1D5DB;
      }
      a:focus-visible {
        outline: 2px solid #0F766E;
        outline-offset: 2px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Page not found</h1>
      <p>The page you asked for does not exist or has moved.</p>
      <div class="actions">
        <a href="/" class="btn-primary">Go to Discover</a>
        <a href="/nearby" class="btn-secondary">View Nearby</a>
      </div>
    </div>
  </body>
</html>\n`;
writeFileSync('public/404.html', html404);

console.log('Successfully generated public assets: favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, og-image.png, site.webmanifest, 404.html');
