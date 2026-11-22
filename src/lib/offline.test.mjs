import { test } from 'node:test';
import assert from 'node:assert/strict';
import { byteRange, audioToEvict, worthKeeping } from './offline.ts';

test('byte ranges cover open, closed, suffix and bad requests', () => {
  assert.equal(byteRange(null, 100), null);
  assert.deepEqual(byteRange('bytes=0-', 100), { start: 0, end: 99 });
  assert.deepEqual(byteRange('bytes=10-19', 100), { start: 10, end: 19 });
  assert.deepEqual(byteRange('bytes=90-500', 100), { start: 90, end: 99 });
  assert.deepEqual(byteRange('bytes=-10', 100), { start: 90, end: 99 });
  assert.equal(byteRange('bytes=100-', 100), 'bad');
  assert.equal(byteRange('bytes=5-2', 100), 'bad');
  assert.equal(byteRange('bytes=-', 100), 'bad');
  assert.equal(byteRange('items=0-1', 100), 'bad');
});

test('eviction drops the oldest episodes until the new one fits', () => {
  const kept = [{ url: 'b', bytes: 40, at: 2 }, { url: 'a', bytes: 40, at: 1 }, { url: 'c', bytes: 40, at: 3 }];
  assert.deepEqual(audioToEvict(kept, 10, 150), []);
  assert.deepEqual(audioToEvict(kept, 40, 150), ['a']);
  assert.deepEqual(audioToEvict(kept, 100, 150), ['a', 'b']);
  assert.deepEqual(audioToEvict([], 200, 150), []);
});

test('an episode is kept once the reader is into it or has finished', () => {
  assert.equal(worthKeeping(5, 600), false);
  assert.equal(worthKeeping(30, 600), true);
  assert.equal(worthKeeping(3, 40), true);    // 5% of a short clip
  assert.equal(worthKeeping(599.5, 600), true);
  assert.equal(worthKeeping(10, 0), false);
});
