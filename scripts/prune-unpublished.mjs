#!/usr/bin/env node
// After the public build, take out what's left of posts that aren't published yet:
// - their audio (Astro copies all of public/ into the build, so it would still be downloadable)
// - links to them from published pages (they would 404); the link text stays.
// usage: node scripts/prune-unpublished.mjs <build dir>
import { rmSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { unpublishedSlugs } from './post-status.mjs';
import { unlinkUnpublished } from '../src/lib/unlink-unpublished.mjs';

const out = process.argv[2];
if (!out) { console.error('usage: prune-unpublished.mjs <build dir>'); process.exit(2); }
const slugs = unpublishedSlugs();

let audio = 0;
for (const slug of slugs) for (const ext of ['opus', 'm4a']) {
  const file = join(out, 'audio', `${slug}.${ext}`);
  if (existsSync(file)) { rmSync(file); audio++; }
}

let pages = 0;
for (const f of readdirSync(out, { recursive: true }).filter(f => f.endsWith('.html'))) {
  const file = join(out, f), html = readFileSync(file, 'utf8'), fixed = unlinkUnpublished(html, slugs);
  if (fixed !== html) { writeFileSync(file, fixed); pages++; }
}
console.log(`prune-unpublished: ${slugs.length} unpublished post(s); removed ${audio} audio file(s), unlinked them on ${pages} page(s)`);
