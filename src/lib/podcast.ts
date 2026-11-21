// Podcast RSS for Apple Podcasts and Spotify: one episode per narrated post.
// Pure: takes plain data, returns XML. The Astro endpoint feeds it.

export interface Show {
  title: string;
  description: string;
  author: string;
  siteUrl: string; // absolute, ends with '/'
  feedUrl: string; // absolute URL of this feed
  artworkUrl: string; // absolute, square PNG 1400-3000 px
  language: string; // e.g. 'en-us'
  categories: { name: string; sub?: string }[]; // Apple category names
  ownerEmail?: string; // optional itunes:owner email; Apple only needs it to verify ownership
}

export interface Episode {
  slug: string;
  title: string;
  summary: string;
  pageUrl: string; // absolute
  date: Date;
  audioUrl: string; // absolute URL of the .m4a (podcast apps want AAC/MP3, not Opus)
  audioBytes: number;
  seconds: number;
  season?: string; // series name, shown in the description prefix
  episode?: number; // part within a series
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** 754.3 -> "00:12:34" (itunes:duration accepts HH:MM:SS). */
export function duration(seconds: number): string {
  const s = Math.round(seconds);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function category(c: Show['categories'][number]): string {
  return c.sub
    ? `<itunes:category text="${esc(c.name)}"><itunes:category text="${esc(c.sub)}"/></itunes:category>`
    : `<itunes:category text="${esc(c.name)}"/>`;
}

function item(e: Episode, show: Show): string {
  const description = e.season && e.episode ? `${e.season}, part ${e.episode}. ${e.summary}` : e.summary;
  return `<item>
<title>${esc(e.title)}</title>
<link>${esc(e.pageUrl)}</link>
<guid isPermaLink="false">pfmt:${esc(e.slug)}</guid>
<pubDate>${e.date.toUTCString()}</pubDate>
<description>${esc(description)}</description>
<enclosure url="${esc(e.audioUrl)}" length="${e.audioBytes}" type="audio/mp4"/>
<itunes:title>${esc(e.title)}</itunes:title>
<itunes:author>${esc(show.author)}</itunes:author>
<itunes:summary>${esc(description)}</itunes:summary>
<itunes:duration>${duration(e.seconds)}</itunes:duration>
<itunes:image href="${esc(show.artworkUrl)}"/>
<itunes:explicit>false</itunes:explicit>
<itunes:episodeType>full</itunes:episodeType>${e.episode ? `\n<itunes:episode>${e.episode}</itunes:episode>` : ''}
</item>`;
}

export function podcastFeed(show: Show, episodes: Episode[]): string {
  const sorted = [...episodes].sort((a, b) => b.date.getTime() - a.date.getTime());
  const latest = sorted[0]?.date ?? new Date(0);
  const owner = show.ownerEmail
    ? `<itunes:owner><itunes:name>${esc(show.author)}</itunes:name><itunes:email>${esc(show.ownerEmail)}</itunes:email></itunes:owner>\n`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(show.title)}</title>
<link>${esc(show.siteUrl)}</link>
<atom:link href="${esc(show.feedUrl)}" rel="self" type="application/rss+xml"/>
<description>${esc(show.description)}</description>
<language>${esc(show.language)}</language>
<copyright>© ${latest.getUTCFullYear() || new Date().getUTCFullYear()} ${esc(show.author)}</copyright>
<lastBuildDate>${latest.toUTCString()}</lastBuildDate>
<image><url>${esc(show.artworkUrl)}</url><title>${esc(show.title)}</title><link>${esc(show.siteUrl)}</link></image>
<itunes:author>${esc(show.author)}</itunes:author>
<itunes:summary>${esc(show.description)}</itunes:summary>
${owner}<itunes:image href="${esc(show.artworkUrl)}"/>
${show.categories.map(category).join('\n')}
<itunes:explicit>false</itunes:explicit>
<itunes:type>episodic</itunes:type>
${sorted.map((e) => item(e, show)).join('\n')}
</channel>
</rss>
`;
}
