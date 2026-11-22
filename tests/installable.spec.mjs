// The installed app: manifest + installability, the service worker's offline reading and kept audio,
// the lock-screen details, and the quiet install offers. Runs against the built site (npm run build).
import { test, expect, devices } from '@playwright/test';

const POST = 'posts/threads-futures-queues-1-one-request-one-thread/';
const OTHER = 'posts/threads-futures-queues-2-pools-and-queues/';

const controlled = (page) => page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });

test('manifest is linked, complete, and Chrome finds nothing stopping an install', async ({ page, request }) => {
  await page.goto('');
  const href = await page.getAttribute('link[rel=manifest]', 'href');
  const m = await (await request.get(new URL(href, page.url()).href)).json();
  expect(m).toMatchObject({ name: 'Penny for My Thoughts', short_name: 'Penny', display: 'standalone', start_url: './', scope: './' });
  for (const i of m.icons) expect((await request.get(new URL(i.src, new URL(href, page.url())).href)).ok()).toBe(true);
  expect(m.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  expect(await page.getAttribute('link[rel=apple-touch-icon]', 'href')).toContain('apple-touch-icon.png');

  await controlled(page);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  expect(installabilityErrors).toEqual([]);
});

test('a post opened once reads offline after a reload; an unopened one shows the offline page', async ({ page, context }) => {
  await page.goto('');
  await controlled(page);
  await page.goto(POST, { waitUntil: 'networkidle' });
  const title = await page.locator('article h1').textContent();

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('article h1')).toHaveText(title);
  await expect(page.locator('.prose')).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)'); // CSS came from the cache

  await page.goto(OTHER);
  await expect(page.locator('h1')).toHaveText('No connection right now');
  await expect(page.locator('[data-saved] a', { hasText: title.trim() })).toBeVisible();
  await context.setOffline(false);
});

test('an episode the reader is into is kept, then plays offline with byte ranges', async ({ page, context }) => {
  await page.goto('');
  await controlled(page);
  await page.goto(POST, { waitUntil: 'networkidle' });
  await page.locator('button.listen[data-play]').first().click();
  await page.waitForFunction(() => { const a = document.getElementById('pfmt-audio'); return a.readyState >= 1 && !a.paused; });
  await page.evaluate(() => { document.getElementById('pfmt-audio').currentTime = 40; });   // 30 s in counts as "into it"
  const src = await page.evaluate(() => document.getElementById('pfmt-audio').currentSrc);
  await expect.poll(() => page.evaluate(async (s) => !!(await (await caches.open('pfmt-audio')).match(s)), src), { timeout: 20000 }).toBe(true);
  const size = Number(await page.evaluate(async (s) => (await (await caches.open('pfmt-audio')).match(s)).headers.get('x-pfmt-bytes'), src));

  await context.setOffline(true);
  const r = await page.evaluate(async (s) => {
    const res = await fetch(s, { headers: { range: 'bytes=100-199' } });
    return { status: res.status, range: res.headers.get('content-range'), len: (await res.arrayBuffer()).byteLength };
  }, src);
  expect(r).toEqual({ status: 206, range: `bytes 100-199/${size}`, len: 100 });

  await page.reload();   // a "restart" with no network: the player comes back at the same place and still plays
  await expect(page.locator('button.listen[data-play]').first()).toHaveAttribute('aria-label', /^Resume/);
  await page.locator('button.listen[data-play]').first().click();
  await page.waitForFunction(() => { const a = document.getElementById('pfmt-audio'); return !a.paused && a.currentTime > 40.5; }, null, { timeout: 10000 });
  await context.setOffline(false);
});

test('the service worker caps kept audio at 150 MB', async ({ request }) => {
  expect(await (await request.get('sw.js')).text()).toContain('const AUDIO_CAP_BYTES = 157286400;');
});

test('lock screen gets title, series and part, the penny; place is remembered across a restart', async ({ page }) => {
  await page.goto(POST);
  await page.locator('button.listen[data-play]').first().click();
  await page.waitForFunction(() => navigator.mediaSession.metadata?.title);
  const meta = await page.evaluate(() => {
    const m = navigator.mediaSession.metadata;
    return { title: m.title, artist: m.artist, album: m.album, art: m.artwork.map((a) => a.sizes) };
  });
  expect(meta).toMatchObject({ artist: 'Penny for My Thoughts', album: 'Threads, Futures and Queues · Part 1 of 8', art: ['192x192', '512x512'] });

  await page.waitForFunction(() => document.getElementById('pfmt-audio').readyState >= 1 && !document.getElementById('pfmt-audio').paused);
  await page.evaluate(() => { document.getElementById('pfmt-audio').currentTime = 120; });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('pfmt-player-v1')).pos['threads-futures-queues-1-one-request-one-thread'] >= 120);
  await page.evaluate(() => document.getElementById('pfmt-audio').pause());
  await page.reload();
  await expect(page.locator('button.listen[data-play]').first()).toHaveAttribute('aria-label', /^Resume/);
});

test('install item appears only after the browser offers, and stays gone once dismissed', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('[data-install]')).toBeHidden();
  await page.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = async () => {}; e.userChoice = Promise.resolve({ outcome: 'dismissed' }); dispatchEvent(e); });
  await expect(page.locator('[data-install]')).toBeVisible();
  await page.click('[data-install-no]');
  await expect(page.locator('[data-install]')).toBeHidden();
  await page.reload();
  await page.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = async () => {}; dispatchEvent(e); });
  await expect(page.locator('[data-install]')).toBeHidden();
});

test.describe('on an iPhone', () => {
  const { defaultBrowserType, ...iphone } = devices['iPhone 13'];
  test.use(iphone);
  test('Safari shows the add-to-home-screen hint once, ever', async ({ page }) => {
    await page.clock.install();
    await page.goto('');
    await page.clock.runFor(5000);
    await expect(page.locator('#ios-hint')).toContainText('Add to Home Screen');
    await page.reload();
    await page.clock.runFor(5000);
    await expect(page.locator('#ios-hint')).toHaveCount(0);
  });
});
