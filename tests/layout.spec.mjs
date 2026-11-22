// Regression checks for things that only show up in a real browser:
// step-through figures must have exactly one row of controls (also after client-side
// navigation, which re-runs page scripts), and no page may scroll sideways on a phone.
import { test, expect } from '@playwright/test';

const FIXED = ['', 'faith/', 'tech/', 'posts/', 'listen/', 'search/?q=queue', 'no-such-page/'];

async function postPaths(request) {
  const html = await (await request.get('posts/')).text();
  return [...new Set(html.match(/\/pfmt\/posts\/[a-z0-9-]+\//g))].map((p) => p.replace('/pfmt/', ''));
}

const controlsPerFigure = (page) =>
  page.$$eval('.fig.stepper', (figs) => figs.map((f) => f.querySelectorAll('.step-controls').length));

// Follow a link the way a reader would, so Astro's client router swaps the page.
async function clientNavigate(page, path) {
  await page.evaluate((href) => {
    const a = Object.assign(document.createElement('a'), { href, textContent: 'go' });
    document.body.append(a);
    a.click();
  }, new URL(path, page.url()).href);
  await page.waitForURL((u) => u.pathname.endsWith(path.split('?')[0]));
  await page.waitForLoadState('networkidle');
}

test('every step-through figure has one row of controls, on load and after client navigation', async ({ page, request }) => {
  const posts = await postPaths(request);
  expect(posts.length).toBeGreaterThan(0);
  let figures = 0;
  for (const p of posts) {
    await page.goto(p, { waitUntil: 'networkidle' });
    const counts = await controlsPerFigure(page);
    figures += counts.length;
    expect(counts.every((n) => n === 1), `${p} first load: ${counts}`).toBe(true);
  }
  expect(figures).toBeGreaterThan(0);

  // Start on one post, start the audio player, then hop through all posts without a full reload.
  await page.goto(posts[0], { waitUntil: 'networkidle' });
  await page.locator('button.listen[data-play]').first().click();
  for (const p of [...posts.slice(1), posts[0]]) {
    await clientNavigate(page, `/pfmt/${p}`);
    const counts = await controlsPerFigure(page);
    expect(counts.every((n) => n === 1), `${p} after client navigation: ${counts}`).toBe(true);
  }
});

test('step-through figure numbers its notes and fits the current step', async ({ page }) => {
  // a published post: a post still in review isn't in the public build these tests run against
  await page.goto('posts/threads-futures-queues-1-one-request-one-thread/', { waitUntil: 'networkidle' });
  const fig = page.locator('#fig-1-1');
  const svg = fig.locator('svg');
  const h1 = (await svg.boundingBox()).height;
  await fig.getByRole('button', { name: 'Next →' }).click();
  await expect(fig.locator('.step-notes li.current')).toHaveAttribute('data-n', '2');
  const h2 = (await svg.boundingBox()).height;
  expect(h2).toBeGreaterThan(h1);
});

test.describe('phone width', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const scheme of ['light', 'dark']) {
    test(`no page scrolls sideways at 390px (${scheme})`, async ({ page, request }) => {
      await page.emulateMedia({ colorScheme: scheme });
      for (const p of [...FIXED, ...(await postPaths(request))]) {
        await page.goto(p, { waitUntil: 'networkidle' });
        const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
        expect(sw, `${p || 'home'} is ${sw}px wide in a ${vw}px window`).toBeLessThanOrEqual(vw);
      }
    });
  }
});
