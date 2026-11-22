import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unlinkUnpublished, linksTo } from './unlink-unpublished.mjs';

test('a link to a post still in review turns into plain text; other links stay', () => {
  const html = '<p>See <a href="../tfq-5/#lost">Chapter <b>5</b></a>, <a class="x" href="../tfq-50/">other</a> and <a href="https://example.com">ext</a>.</p>';
  assert.equal(unlinkUnpublished(html, ['tfq-5']),
    '<p>See <span>Chapter <b>5</b></span>, <a class="x" href="../tfq-50/">other</a> and <a href="https://example.com">ext</a>.</p>');
});

test('matches the slug as a whole path segment only', () => {
  assert.ok(linksTo('/pfmt/posts/tfq-5/', ['tfq-5']));
  assert.ok(!linksTo('../tfq-5-extra/', ['tfq-5']));
});
