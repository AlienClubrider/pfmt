// Render the penny coin (src/lib/coin.mjs, also the header logo) into the favicons, app icons and podcast artwork.
// Run: node scripts/make-icons.mjs. Uses Playwright's Chromium so no image library is needed.
// When the mark changes, bump ICON_DIR and the cover name (and the paths that point at them) so installed apps refetch.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { COPPER, SERIF, coinShapes, coinSvg } from '../src/lib/coin.mjs';

const ICON_DIR = 'public/icons/v3', COVER_PATH = 'public/podcast-cover-v3.png';
const INK = '#16181c', NAME = '#e9e5dc';

// The coin in its 40×40 box. `scale` grows or shrinks it about the centre.
const mark = (scale = 1) => `<g transform="translate(20 20) scale(${scale}) translate(-20 -20)">${coinShapes()}</g>`;
const icon = (bg, scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${bg ? `<rect width="40" height="40" fill="${bg}"/>` : ''}${mark(scale)}</svg>`;

const ICONS = [
  ['favicon-16.png', 16, coinSvg()],
  ['favicon-32.png', 32, coinSvg()],
  ['icon-192.png', 192, coinSvg()],
  ['icon-512.png', 512, coinSvg()],
  // Copper to the corners, coin at 80%: the edge line sits on the 40% safe circle, so whatever circle
  // Android crops to, it shows the whole coin and only copper beyond it. No plate.
  ['maskable-512.png', 512, icon(COPPER, 0.8)],
  // iOS rounds the corners itself and fills transparency with black, so fill the corners with copper.
  ['apple-touch-icon.png', 180, icon(COPPER, 1)],
];

// Same layout as before: the coin's centre at (1500, 1120), 1080 across, name underneath.
const COVER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3000 3000">
  <rect width="3000" height="3000" fill="${INK}"/>
  <g transform="translate(960 580) scale(27)">${mark()}</g>
  <g font-family="${SERIF}, 'Liberation Serif'" fill="${NAME}" text-anchor="middle" font-weight="600" letter-spacing="38">
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
writeFileSync(`${ICON_DIR}/favicon.svg`, coinSvg() + '\n');
for (const [name, size, svg] of ICONS) await shoot(`${ICON_DIR}/${name}`, size, svg);
await shoot(COVER_PATH, 3000, COVER);
await browser.close();
