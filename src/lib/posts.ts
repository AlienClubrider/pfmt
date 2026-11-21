// The blog's rules about posts, kept free of Astro so they can be unit tested.
// A post is { id, data }; the same shape getCollection('posts') returns.

export type Category = 'faith' | 'tech';
export interface PostData {
  title: string;
  summary: string;
  date: Date;
  category: Category;
  series?: { id: string; title: string };
  part?: number;
  partsTotal?: number;
  readingMinutes: number;
  cover?: string;
  draft?: boolean;
}
export interface Post { id: string; data: PostData }

export const CATEGORIES: Record<Category, { name: string; blurb: string }> = {
  faith: { name: 'Faith', blurb: 'Reading the Bible slowly, big words made plain, and honest answers to hard questions.' },
  tech: { name: 'Tech', blurb: 'Tools, homelab notes and the odd deep dive, some of it as illustrated series read in parts. Things I actually use, and why.' },
};

/** Newest first. Parts of one series published the same day stay in part order, so a series reads (and plays) 1, 2, 3. */
export function byListingOrder(a: Post, b: Post): number {
  const d = b.data.date.getTime() - a.data.date.getTime();
  if (d) return d;
  const sa = a.data.series?.id ?? '', sb = b.data.series?.id ?? '';
  if (sa !== sb) return sa < sb ? -1 : 1;
  return (a.data.part ?? 0) - (b.data.part ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export const published = (posts: Post[]) => posts.filter(p => !p.data.draft).sort(byListingOrder);

/** All parts of a post's series, in part order. Empty for a standalone post. */
export function seriesParts(posts: Post[], post: Post): Post[] {
  const id = post.data.series?.id;
  if (!id) return [];
  return posts.filter(p => p.data.series?.id === id && !p.data.draft).sort((a, b) => (a.data.part ?? 0) - (b.data.part ?? 0));
}

/** Previous and next for the bottom of a post: neighbouring parts within a series, otherwise neighbouring posts in the same topic. */
export function neighbours(posts: Post[], post: Post): { prev?: Post; next?: Post } {
  const list = post.data.series ? seriesParts(posts, post) : published(posts).filter(p => p.data.category === post.data.category && !p.data.series);
  const i = list.findIndex(p => p.id === post.id);
  if (post.data.series) return { prev: list[i - 1], next: list[i + 1] };
  // listing is newest first: "previous" is the older post
  return { prev: list[i + 1], next: list[i - 1] };
}

export const partLabel = (p: PostData) => (p.series && p.part ? `Part ${p.part} of ${p.partsTotal ?? p.part}` : '');

/** The listen queue: every post with audio, in listing order, so a series plays in order. */
export function listenQueue<T extends Post>(posts: T[], hasAudio: (id: string) => boolean): T[] {
  return (published(posts) as T[]).filter(p => hasAudio(p.id));
}

export const countIn = (posts: Post[], c: Category) => published(posts).filter(p => p.data.category === c).length;

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
