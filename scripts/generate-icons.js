import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate an SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e40af" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#4338ca" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Badge background -->
  <rect x="56" y="56" width="400" height="400" rx="80" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.2" stroke-width="4" />

  <!-- School / Canteen Icon Graphics -->
  <g filter="url(#shadow)" transform="translate(0, -10)">
    <!-- Roof / Top Building -->
    <polygon points="256,120 110,210 402,210" fill="#ffffff" />
    <polygon points="256,135 130,210 382,210" fill="#f8fafc" />
    
    <!-- Building Pillars -->
    <rect x="140" y="225" width="36" height="130" rx="8" fill="#ffffff" />
    <rect x="204" y="225" width="36" height="130" rx="8" fill="#ffffff" />
    <rect x="272" y="225" width="36" height="130" rx="8" fill="#ffffff" />
    <rect x="336" y="225" width="36" height="130" rx="8" fill="#ffffff" />

    <!-- Building Base -->
    <rect x="100" y="365" width="312" height="32" rx="10" fill="#ffffff" />
    <rect x="80" y="395" width="352" height="24" rx="8" fill="#e2e8f0" />
  </g>

  <!-- Cash / Coin Badge at bottom right -->
  <g filter="url(#shadow)" transform="translate(320, 310)">
    <circle cx="65" cy="65" r="65" fill="url(#accentGrad)" stroke="#ffffff" stroke-width="6" />
    <text x="65" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="62" font-weight="900" text-anchor="middle" fill="#ffffff">Rp</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

console.log('SVG icons generated in public directory successfully.');
