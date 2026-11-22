// Render the header penny mark (Logo.astro, dark theme) into the app icons and podcast artwork.
// Run: node scripts/make-icons.mjs. Uses Playwright's Chromium so no image library is needed.
// When the mark changes, bump ICON_DIR (and the paths that point at it) so installed apps refetch.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const ICON_DIR = 'public/icons/v2';
// Dark-theme header colours: the p and ring are the page colour, so they read as cut out of the coin.
const COIN = '#ef8a5c', INK = '#16181c', NAME = '#e9e5dc';
const SERIF = "'Iowan Old Style', Palatino, Georgia, 'Liberation Serif', serif";

// The header mark in its 40×40 box. `scale` grows or shrinks it about the centre.
const mark = (scale = 1) => `<g transform="translate(20 20) scale(${scale}) translate(-20 -20)">
    <circle cx="20" cy="20" r="18" fill="${COIN}"/>
    <circle cx="20" cy="20" r="14.2" fill="none" stroke="${INK}" stroke-opacity=".5" stroke-width="1.2"/>
    <text x="20" y="27" text-anchor="middle" font-family="${SERIF}" font-size="19" font-weight="700" font-style="italic" fill="${INK}">p</text>
  </g>`;
const icon = (bg, scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${bg ? `<rect width="40" height="40" fill="${bg}"/>` : ''}${mark(scale)}</svg>`;

const ICONS = [
  ['icon-192.png', 192, icon(null, 1)],
  ['icon-512.png', 512, icon(null, 1)],
  // The coin fills the square and the launcher's circle crop becomes its edge. At 0.9 the ring sits
  // at 32% of the width, inside the 40% safe circle, and about where it sits in the header coin.
  ['maskable-512.png', 512, icon(COIN, 0.9)],
  // iOS rounds the corners itself and fills transparency with black, so give it the header's page colour.
  ['apple-touch-icon.png', 180, icon(INK, 0.86)],
];

const COVER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3000 3000">
  <rect width="3000" height="3000" fill="${INK}"/>
  <g transform="translate(900 520) scale(30)">${mark()}</g>
  <g font-family="${SERIF}" fill="${NAME}" text-anchor="middle" font-weight="600" letter-spacing="38">
    <text x="1519" y="2120" font-size="190">PENNY FOR</text>
    <text x="1519" y="2390" font-size="190">MY THOUGHTS</text>
  </g></svg>`;

const browser = await chromium.launch();
const page = await browser.newPage();
const shoot = async (path, size, svg) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path, omitBackground: true });
};
mkdirSync(ICON_DIR, { recursive: true });
for (const [name, size, svg] of ICONS) await shoot(`${ICON_DIR}/${name}`, size, svg);
await shoot('public/podcast-cover-v2.png', 3000, COVER);
await browser.close();
