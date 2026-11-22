// The penny coin: the one mark behind the header logo, favicon, app icons and podcast art.
// Bryson picked it on 2026-11-22 (wiz-share/pfmt/icon-chosen.png); this is a path trace of that image,
// so the p renders the same everywhere without a font. Same colours on light and dark.
export const COPPER = '#c27c5a';
const RIM = '#efc09f', CREAM = '#fbf7e7';
export const SERIF = 'Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif';

// An upright bracketed-serif lowercase p in the coin's 40×40 box. The second subpath is the bowl's counter.
const P = 'M12.03 10.17H18.19V11.1C19.3 10.32 20.85 9.96 22.14 9.96C25.91 9.96 28.62 12.77 28.62 16.65C28.62 20.67 25.63 23.59 21.5 23.59C20.08 23.59 18.92 23.38 18.19 23.15V27.35C18.19 28.41 19.16 29.29 20.36 29.29V30.61H12.03V29.29C13.15 29.29 14.06 28.41 14.06 27.35V13.42C14.06 12.31 13.15 11.41 12.03 11.41ZM18.19 13.42C18.66 12.95 19.56 12.59 20.59 12.59C22.71 12.59 24.26 14.4 24.26 16.9C24.26 19.46 22.66 21.32 20.46 21.32C19.3 21.32 18.66 21.16 18.19 20.9Z';

// The coin's shapes in a 40×40 box.
export const coinShapes = () => `<circle cx="20" cy="20" r="20" fill="${COPPER}"/><circle cx="20" cy="20" r="18.3" fill="none" stroke="${RIM}" stroke-width=".52"/><path fill="${CREAM}" fill-rule="evenodd" d="${P}"/>`;

export const coinSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${coinShapes()}</svg>`;
