// Cover art: small meaning-coloured SVG compositions, ported from the mockups' thumbnails.
// Colours come from the post's category (--cc / --cc-soft), so they follow light and dark.
// A post picks one with `cover:` in its frontmatter; otherwise it gets its category's art, varied by part.

/* eslint-disable */
function draw(cat: string, seed = 0, square = false): string {
    const W = square ? 160 : 320, H = square ? 160 : 180, cx = W / 2, cy = H / 2;
    const c = 'var(--cc)', s = 'var(--cc-soft)', paper = 'var(--svg-surface)';
    const sh = (seed % 3) * 14 - 14;
    let g = '';
    if (cat === 'bible') {
      g = `<path d="M${cx} ${cy - 34} C${cx - 22} ${cy - 46} ${cx - 62} ${cy - 46} ${cx - 86} ${cy - 38} V${cy + 40} C${cx - 62} ${cy + 32} ${cx - 22} ${cy + 32} ${cx} ${cy + 44} C${cx + 22} ${cy + 32} ${cx + 62} ${cy + 32} ${cx + 86} ${cy + 40} V${cy - 38} C${cx + 62} ${cy - 46} ${cx + 22} ${cy - 46} ${cx} ${cy - 34}Z" fill="${paper}" stroke="${c}" stroke-width="2.5"/>
        <path d="M${cx} ${cy - 34}V${cy + 44}" stroke="${c}" stroke-width="2"/>` +
        [0, 1, 2, 3].map(k => `<path d="M${cx - 70} ${cy - 20 + k * 14}h${50 - (k == 3 ? 20 : 0)}M${cx + 16} ${cy - 20 + k * 14}h${54 - (k == 1 ? 18 : 0)}" stroke="${c}" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>`).join('') +
        `<path d="M${cx + 40} ${cy - 44}v${60 + sh}l7 -7 7 7v-${60 + sh}" fill="var(--accent)" opacity=".9"/>`;
      if (seed % 2) g = `<rect x="${cx - 70}" y="${cy - 50}" width="140" height="100" fill="${paper}" stroke="${c}" stroke-width="2.5"/><rect x="${cx - 86}" y="${cy - 58}" width="16" height="116" rx="8" fill="${c}"/><rect x="${cx + 70}" y="${cy - 58}" width="16" height="116" rx="8" fill="${c}"/>` + [0,1,2,3].map(k => `<path d="M${cx - 52} ${cy - 30 + k * 20}h${104 - (k == 3 ? 40 : 0)}" stroke="${c}" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>`).join('');
    } else if (cat === 'theo') {
      g = `<circle cx="${cx}" cy="${cy - 18}" r="40" fill="${c}" fill-opacity=".18" stroke="${c}" stroke-width="2.5"/>
        <circle cx="${cx - 24}" cy="${cy + 22}" r="40" fill="${c}" fill-opacity=".18" stroke="${c}" stroke-width="2.5"/>
        <circle cx="${cx + 24}" cy="${cy + 22}" r="40" fill="${c}" fill-opacity=".18" stroke="${c}" stroke-width="2.5"/>
        <circle cx="${cx}" cy="${cy + 9}" r="9" fill="${c}"/>`;
      if (seed % 2) g = `<path d="M${cx} ${cy - 56}v112M${cx - 34} ${cy - 22}h68" stroke="${c}" stroke-width="12" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="62" fill="none" stroke="${c}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>`;
    } else if (cat === 'apol') {
      g = `<rect x="${cx - 96}" y="${cy - 46}" width="104" height="58" rx="14" fill="${paper}" stroke="${c}" stroke-width="2.5"/><path d="M${cx - 70} ${cy + 12}l-6 18 22-18" fill="${paper}" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M${cx - 80} ${cy - 26}h70M${cx - 80} ${cy - 10}h48" stroke="${c}" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>
        <rect x="${cx - 6}" y="${cy - 10}" width="104" height="58" rx="14" fill="${c}"/><path d="M${cx + 72} ${cy + 48}l6 18 -22-18" fill="${c}"/>
        <text x="${cx + 46}" y="${cy + 32}" text-anchor="middle" font-family="Georgia,serif" font-size="34" font-weight="700" fill="var(--svg-surface)">?</text>`;
      if (seed % 3 === 1) g = `<path d="M${cx} ${cy - 58} ${cx - 50} ${cy - 40}v34c0 32 22 54 50 64 28-10 50-32 50-64v-34Z" fill="${paper}" stroke="${c}" stroke-width="3"/><path d="m${cx - 20} ${cy} 14 14 28-28" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${cx + 74}" cy="${cy - 44}" r="10" fill="var(--accent)"/>`;
      if (seed % 3 === 2) g = `<rect x="${cx - 80}" y="${cy - 54}" width="110" height="112" rx="8" fill="${paper}" stroke="${c}" stroke-width="2.5"/>` + [0,1,2,3,4].map(k => `<path d="M${cx - 64} ${cy - 34 + k * 18}h${78 - (k % 2) * 24}" stroke="${c}" stroke-opacity=".4" stroke-width="5" stroke-linecap="round"/>`).join('') + `<circle cx="${cx + 34}" cy="${cy + 4}" r="34" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-width="6"/><path d="M${cx + 58} ${cy + 28}l30 30" stroke="${c}" stroke-width="10" stroke-linecap="round"/>`;
    } else if (cat === 'tech') {
      const nodes = [[cx - 80, cy - 36], [cx - 10, cy - 50], [cx + 70, cy - 30], [cx - 60, cy + 38], [cx + 20, cy + 22], [cx + 86, cy + 44]];
      g = `<path d="M${nodes[0]}L${nodes[1]}L${nodes[2]}M${nodes[1]}L${nodes[4]}L${nodes[3]}M${nodes[4]}L${nodes[5]}M${nodes[0]}L${nodes[3]}" stroke="${c}" stroke-width="2.5" fill="none" stroke-opacity=".6"/>` +
        nodes.map((n, k) => `<rect x="${n[0] - 16}" y="${n[1] - 12}" width="32" height="24" rx="6" fill="${k === (seed % 6) ? c : paper}" stroke="${c}" stroke-width="2.5"/>`).join('');
      if (seed % 3 === 1) g = `<rect x="${cx - 100}" y="${cy - 58}" width="200" height="116" rx="10" fill="${paper}" stroke="${c}" stroke-width="2.5"/><path d="M${cx - 100} ${cy - 38}h200" stroke="${c}" stroke-width="2"/><circle cx="${cx - 86}" cy="${cy - 48}" r="3.5" fill="var(--accent)"/><circle cx="${cx - 74}" cy="${cy - 48}" r="3.5" fill="var(--c-books)"/><circle cx="${cx - 62}" cy="${cy - 48}" r="3.5" fill="${c}"/><path d="m${cx - 82} ${cy - 20} 12 10-12 10" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M${cx - 60} ${cy}h80M${cx - 82} ${cy + 22}h120M${cx - 82} ${cy + 40}h60" stroke="${c}" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>`;
      if (seed % 3 === 2) g = [0,1,2].map(k => `<rect x="${cx - 70}" y="${cy - 52 + k * 36}" width="140" height="28" rx="6" fill="${k === 1 ? c : paper}" stroke="${c}" stroke-width="2.5"/><circle cx="${cx + 52}" cy="${cy - 38 + k * 36}" r="4.5" fill="${k === 1 ? paper : 'var(--c-tech)'}"/><path d="M${cx - 56} ${cy - 38 + k * 36}h60" stroke="${k === 1 ? paper : c}" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>`).join('');
    } else {
      const cols = ['var(--c-books)', 'var(--link)', 'var(--accent)', 'var(--c-faith)', 'var(--c-tech)'];
      g = [0, 1, 2, 3, 4].map(k => {
        const h = 92 - ((k * 17 + seed * 7) % 30), x = cx - 86 + k * 30;
        return `<rect x="${x}" y="${cy + 50 - h}" width="24" height="${h}" rx="3" fill="${cols[(k + seed) % 5]}"/><path d="M${x + 5} ${cy + 60 - h}h14M${x + 5} ${cy + 38}h14" stroke="var(--svg-surface)" stroke-opacity=".7" stroke-width="2.5"/>`;
      }).join('') + `<rect x="${cx + 66}" y="${cy - 40}" width="26" height="90" rx="3" fill="${paper}" stroke="${c}" stroke-width="2.5" transform="rotate(12 ${cx + 79} ${cy + 50})"/><path d="M${cx - 100} ${cy + 52}h200" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="${W}" height="${H}" fill="${s}"/>${square ? `<g transform="translate(${cx} ${cy}) scale(.62) translate(${-cx} ${-cy})">${g}</g>` : g}</svg>`;
  }

const KEYS: Record<string, [string, number]> = {
  'tech-graph': ['tech', 0], 'tech-window': ['tech', 1], 'tech-stack': ['tech', 2],
  'faith-circles': ['theo', 0], 'faith-cross': ['theo', 1],
  'faith-book': ['bible', 0], 'faith-scroll': ['bible', 1],
  'faith-question': ['apol', 0], 'faith-shield': ['apol', 1], 'faith-search': ['apol', 2],
  shelf: ['all', 1],
};
export const COVER_KEYS = Object.keys(KEYS);

export function coverSvg(opts: { cover?: string; category: string; seed?: number; square?: boolean }): string {
  const k = opts.cover && KEYS[opts.cover];
  if (k) return draw(k[0], k[1], opts.square);
  return draw(opts.category === 'faith' ? 'theo' : opts.category, opts.seed ?? 0, opts.square);
}
