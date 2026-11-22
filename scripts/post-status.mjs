// Reads each post's `status` straight from its frontmatter, for build steps that run outside Astro.
// A post with no status is a draft, the same default as src/content.config.ts.
import { readdirSync, readFileSync } from 'node:fs';

const POSTS = new URL('../src/content/posts/', import.meta.url);

/** Slugs of every post that isn't published yet. */
export function unpublishedSlugs() {
  return readdirSync(POSTS).filter(f => /\.mdx?$/.test(f)).filter(f => {
    const front = readFileSync(new URL(f, POSTS), 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    return (front.match(/^status:\s*['"]?(\w+)/m)?.[1] ?? 'draft') !== 'published';
  }).map(f => f.replace(/\.mdx?$/, ''));
}
