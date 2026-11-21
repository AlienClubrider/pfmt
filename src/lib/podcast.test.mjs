import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duration, podcastFeed } from './podcast.ts';

/** @type {import('./podcast.ts').Show} */
const show = {
  title: 'Penny for My Thoughts',
  description: 'Faith & tech, read aloud.',
  author: 'Bryson Bailey',
  siteUrl: 'https://example.test/pfmt/',
  feedUrl: 'https://example.test/pfmt/podcast.xml',
  artworkUrl: 'https://example.test/pfmt/podcast-cover.png',
  language: 'en-us',
  categories: [{ name: 'Technology' }, { name: 'Religion & Spirituality', sub: 'Christianity' }],
};
const ep = (slug, day) => ({
  slug, title: `Post <${slug}>`, summary: 'S', pageUrl: `https://example.test/pfmt/${slug}/`,
  date: new Date(Date.UTC(2026, 10, day)), audioUrl: `https://example.test/pfmt/audio/${slug}.m4a`,
  audioBytes: 1234, seconds: 3725.6, season: 'Threads, Futures and Queues', episode: 2,
});

test('duration is HH:MM:SS', () => {
  assert.equal(duration(3725.6), '01:02:06');
  assert.equal(duration(59.4), '00:00:59');
});

test('feed has the tags Apple and Spotify check', () => {
  const xml = podcastFeed(show, [ep('a', 1), ep('b', 2)]);
  assert.match(xml, /<enclosure url="https:\/\/example.test\/pfmt\/audio\/a.m4a" length="1234" type="audio\/mp4"\/>/);
  assert.match(xml, /<itunes:explicit>false<\/itunes:explicit>/);
  assert.match(xml, /<itunes:image href="https:\/\/example.test\/pfmt\/podcast-cover.png"\/>/);
  assert.match(xml, /<itunes:category text="Religion &amp; Spirituality"><itunes:category text="Christianity"\/>/);
  assert.match(xml, /<itunes:duration>01:02:06<\/itunes:duration>/);
  assert.match(xml, /<guid isPermaLink="false">pfmt:a<\/guid>/);
  assert.ok(xml.indexOf('pfmt:b') < xml.indexOf('pfmt:a'), 'newest first');
  assert.match(xml, /Post &lt;a&gt;/, 'titles are escaped');
  assert.doesNotMatch(xml, /itunes:owner/, 'no owner email unless given');
});
