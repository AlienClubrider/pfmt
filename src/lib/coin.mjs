// The penny coin: the one mark behind the header logo, favicon, app icons and podcast art.
// Bryson approved it on 2026-11-22 (wiz-share/pfmt/icon-simple/final.svg). Same colours on light and dark.
export const COPPER = '#a24a25';
const EDGE = '#7a3418', CREAM = '#f4ece2';
export const SERIF = 'Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif';

// The coin's shapes in a 40×40 box. `id` names the clip path; give each copy on a page its own.
export const coinShapes = (id = 'coin') => `<defs><clipPath id="${id}"><circle cx="20" cy="20" r="20"/></clipPath></defs><circle cx="20" cy="20" r="20" fill="${COPPER}"/><circle cx="20" cy="20" r="19.2" fill="none" stroke="${EDGE}" stroke-width=".9"/><g clip-path="url(#${id})"><text x="20" y="36" text-anchor="middle" font-family="${SERIF}" font-size="36" font-weight="600" font-style="normal" fill="${CREAM}">p</text></g>`;

export const coinSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${coinShapes()}</svg>`;
