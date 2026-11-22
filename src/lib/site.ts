// Adapter between Astro (content collection, base path, audio manifest) and the pure rules in posts.ts.
import { getCollection, type CollectionEntry } from 'astro:content';
import audioJson from '../data/audio.json';
import { visible, listenQueue, partLabel, CATEGORIES, type Post } from './posts';

export type PostEntry = CollectionEntry<'posts'>;
export interface Audio { src: string; fallback: string; seconds: number; bytes: number; fallbackBytes?: number; voice?: string; hash?: string }

declare const __PFMT_PREVIEW__: boolean;
/** True in the private preview build, which also shows drafts and posts in review. */
export const PREVIEW: boolean = __PFMT_PREVIEW__;

const manifest = audioJson as Record<string, Audio>;
export const audioOf = (id: string): Audio | undefined => manifest[id];

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
/** A site path ('', 'tech/', 'posts/x/') under the GitHub Pages base. */
export const url = (path = '') => BASE + path.replace(/^\//, '');
export const postUrl = (p: { id: string }) => url(`posts/${p.id}/`);
/** Audio file URL. The preview sits behind Cloudflare, which caches audio for hours; a version query makes a re-recorded post load fresh. */
export const audioUrl = (path: string, a: Audio) => url(path) + (PREVIEW && a.hash ? `?v=${a.hash}` : '');

export const SITE = {
  title: 'Penny for My Thoughts',
  author: 'Bryson Bailey',
  description: 'Notes on faith and the tech I like, by Bryson Bailey. Every post can be read or heard.',
  repo: 'https://github.com/AlienClubrider/pfmt',
};

export async function allPosts(): Promise<PostEntry[]> {
  return visible((await getCollection('posts')) as unknown as Post[], PREVIEW) as unknown as PostEntry[];
}

/** What the player needs about each episode, in queue order. Embedded once per page as JSON. */
export async function queueData() {
  const posts = await allPosts();
  return listenQueue(posts as unknown as Post[], id => !!audioOf(id)).map(p => {
    const e = p as unknown as PostEntry, a = audioOf(e.id)!;
    const album = e.data.series ? `${e.data.series.title} · ${partLabel(e.data)}` : CATEGORIES[e.data.category].name;
    return { id: e.id, title: e.data.title, cat: e.data.category, album, href: postUrl(e), src: audioUrl(a.src, a), fallback: audioUrl(a.fallback, a), seconds: a.seconds };
  });
}
export type QueueItem = Awaited<ReturnType<typeof queueData>>[number];
