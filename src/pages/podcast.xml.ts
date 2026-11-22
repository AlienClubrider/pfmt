// /podcast.xml: every post that has narration becomes an episode (AAC .m4a enclosure).
import type { APIRoute } from 'astro';
import { allPosts } from '../lib/site';
import audio from '../data/audio.json';
import { podcastFeed, type Episode } from '../lib/podcast';

type AudioEntry = { fallback: string; fallbackBytes: number; seconds: number };
const manifest = audio as Record<string, AudioEntry>;

export const GET: APIRoute = async ({ site }) => {
  const root = new URL(import.meta.env.BASE_URL.replace(/\/?$/, '/'), site);
  const abs = (path: string) => new URL(path.replace(/^\//, ''), root).href;

  const posts = (await allPosts()).filter((p) => p.id in manifest);
  const episodes: Episode[] = posts.map((p) => {
    const a = manifest[p.id];
    return {
      slug: p.id,
      title: p.data.title,
      summary: p.data.summary,
      pageUrl: abs(`posts/${p.id}/`),
      // Parts of a series often share a date; nudge each by its part number in minutes
      // so podcast apps list them in reading order.
      date: new Date(p.data.date.getTime() + (p.data.part ?? 0) * 60_000),
      audioUrl: abs(a.fallback),
      audioBytes: a.fallbackBytes,
      seconds: a.seconds,
      season: p.data.series?.title,
      episode: p.data.part,
    };
  });

  const xml = podcastFeed(
    {
      title: 'Penny for My Thoughts',
      description: 'Bryson Bailey on faith and tech, every post read aloud.',
      author: 'Bryson Bailey',
      siteUrl: root.href,
      feedUrl: abs('podcast.xml'),
      artworkUrl: abs('podcast-cover-v2.png'),
      language: 'en-us',
      categories: [{ name: 'Religion & Spirituality', sub: 'Christianity' }, { name: 'Technology' }],
    },
    episodes,
  );
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
