// Adapter between Astro (content collection, base path, audio manifest) and the pure rules in posts.ts.
import { getCollection, type CollectionEntry } from 'astro:content';
import audioJson from '../data/audio.json';
import { published, listenQueue, type Post } from './posts';

export type PostEntry = CollectionEntry<'posts'>;
export interface Audio { src: string; fallback: string; seconds: number; bytes: number; fallbackBytes?: number; voice?: string }

const manifest = audioJson as Record<string, Audio>;
export const audioOf = (id: string): Audio | undefined => manifest[id];

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
/** A site path ('', 'tech/', 'posts/x/') under the GitHub Pages base. */
export const url = (path = '') => BASE + path.replace(/^\//, '');
export const postUrl = (p: { id: string }) => url(`posts/${p.id}/`);

export const SITE = {
  title: 'Penny for My Thoughts',
  author: 'Bryson Bailey',
  description: 'Notes on faith and the tech I like, by Bryson Bailey. Every post can be read or heard.',
  repo: 'https://github.com/AlienClubrider/pfmt',
};

export async function allPosts(): Promise<PostEntry[]> {
  return published((await getCollection('posts')) as unknown as Post[]) as unknown as PostEntry[];
}

/** What the player needs about each episode, in queue order. Embedded once per page as JSON. */
export async function queueData() {
  const posts = await allPosts();
  return listenQueue(posts as unknown as Post[], id => !!audioOf(id)).map(p => {
    const e = p as unknown as PostEntry, a = audioOf(e.id)!;
    return { id: e.id, title: e.data.title, cat: e.data.category, href: postUrl(e), src: url(a.src), fallback: url(a.fallback), seconds: a.seconds };
  });
}
export type QueueItem = Awaited<ReturnType<typeof queueData>>[number];
