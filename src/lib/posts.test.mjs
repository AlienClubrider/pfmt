import { test } from 'node:test';
import assert from 'node:assert/strict';
import { published, seriesParts, neighbours, partLabel, listenQueue, countIn } from './posts.ts';

const S = { id: 'tfq', title: 'Threads, Futures and Queues' };
const post = (id, day, extra = {}) => ({ id, data: { title: id, summary: '', date: new Date(Date.UTC(2026, 10, day)), category: 'tech', readingMinutes: 5, ...extra } });
const posts = [
  post('tfq-3', 20, { series: S, part: 3, partsTotal: 3 }),
  post('older', 10),
  post('tfq-1', 20, { series: S, part: 1, partsTotal: 3 }),
  post('faith-a', 15, { category: 'faith' }),
  post('tfq-2', 20, { series: S, part: 2, partsTotal: 3 }),
  post('newest', 21),
  post('hidden', 22, { draft: true }),
];

test('listing is newest first, and a series published together stays in part order', () => {
  assert.deepEqual(published(posts).map(p => p.id), ['newest', 'tfq-1', 'tfq-2', 'tfq-3', 'faith-a', 'older']);
});

test('series parts come back in part order whatever the input order', () => {
  assert.deepEqual(seriesParts(posts, posts[0]).map(p => p.id), ['tfq-1', 'tfq-2', 'tfq-3']);
  assert.deepEqual(seriesParts(posts, posts[1]), []);
});

test('next and previous stay inside the series, with none past either end', () => {
  const byId = id => posts.find(p => p.id === id);
  assert.deepEqual(Object.fromEntries(Object.entries(neighbours(posts, byId('tfq-2'))).map(([k, v]) => [k, v?.id])), { prev: 'tfq-1', next: 'tfq-3' });
  assert.equal(neighbours(posts, byId('tfq-1')).prev, undefined);
  assert.equal(neighbours(posts, byId('tfq-3')).next, undefined);
});

test('a standalone post links to the older and newer standalone posts in its topic', () => {
  const n = neighbours(posts, posts.find(p => p.id === 'newest'));
  assert.equal(n.prev?.id, 'older');
  assert.equal(n.next, undefined);
});

test('the part label reads "Part 2 of 3", and is empty outside a series', () => {
  assert.equal(partLabel(posts[4].data), 'Part 2 of 3');
  assert.equal(partLabel(posts[1].data), '');
});

test('the listen queue keeps only posts with audio, series in order', () => {
  const q = listenQueue(posts, id => id !== 'tfq-2' && id !== 'older');
  assert.deepEqual(q.map(p => p.id), ['newest', 'tfq-1', 'tfq-3', 'faith-a']);
});

test('topic counts skip drafts', () => {
  assert.equal(countIn(posts, 'tech'), 5);
  assert.equal(countIn(posts, 'faith'), 1);
});
