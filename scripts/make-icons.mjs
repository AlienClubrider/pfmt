// Render the copper penny mark into the app icons (public/icons/). Run: node scripts/make-icons.mjs
// Uses Playwright's Chromium so no image library is needed. Re-run only when the mark changes.
import { chromium } from '@playwright/test';

const COPPER = '#b4532a', PAPER = '#fbf8f2';
const SERIF = "'Iowan Old Style', Palatino, Georgia, 'Liberation Serif', serif";
// The penny drawn in a 40×40 box; `inset` shrinks it so maskable icons keep it inside the safe circle.
const penny = (bg, inset) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  ${bg ? `<rect width="40" height="40" fill="${bg}"/>` : ''}
  <g transform="translate(20 20) scale(${inset}) translate(-20 -20)">
    <circle cx="20" cy="20" r="18" fill="${COPPER}"/>
    <circle cx="20" cy="20" r="14.2" fill="none" stroke="${PAPER}" stroke-opacity=".5" stroke-width="1.2"/>
    <text x="20" y="27" text-anchor="middle" font-family="${SERIF}" font-size="19" font-weight="700" font-style="italic" fill="${PAPER}">p</text>
  </g></svg>`;

const ICONS = [
  ['icon-192.png', 192, penny(null, 1)],
  ['icon-512.png', 512, penny(null, 1)],
  ['maskable-512.png', 512, penny(COPPER, 0.8)],   // copper fills the square; the coin sits in the 80% safe zone
  ['apple-touch-icon.png', 180, penny(PAPER, 0.86)], // iOS fills transparency with black, so give it paper
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, svg] of ICONS) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: true });
}
await browser.close();
