// Service worker body. Built into /sw.js by src/pages/sw.js.ts, which puts VERSION,
// AUDIO_CAP_BYTES, byteRange and audioToEvict (from src/lib/offline.ts) in front of this.
// Plain JS on purpose: it runs in the worker scope, not the page.
/* global VERSION, AUDIO_CAP_BYTES, byteRange, audioToEvict */
const BASE = new URL(self.registration.scope).pathname;
const SHELL = `pfmt-shell-${VERSION}`, PAGES = 'pfmt-pages', ASSETS = 'pfmt-assets', AUDIO = 'pfmt-audio';
const PAGE_LIMIT = 80, ASSET_LIMIT = 120;
const OFFLINE = BASE + 'offline/';
const SHELL_URLS = [BASE, OFFLINE, BASE + 'app-v6.webmanifest', BASE + 'icons/v4/icon-192.png', BASE + 'icons/v4/icon-512.png'];

// Keep at most `limit` entries in a cache; the oldest put goes first.
const trim = async (name, limit) => {
  const c = await caches.open(name), keys = await c.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map(k => c.delete(k)));
};

self.addEventListener('install', e => e.waitUntil((async () => {
  const shell = await caches.open(SHELL);
  await shell.addAll(SHELL_URLS);
  // The offline page and home page must render offline, so keep the CSS and JS they point at too.
  const assets = new Set();
  for (const u of [BASE, OFFLINE]) {
    const html = await (await shell.match(u)).text();
    for (const m of html.matchAll(/(?:href|src)="([^"]*\/_astro\/[^"]+)"/g)) assets.add(m[1]);
  }
  await shell.addAll([...assets]);   // versioned with the shell, so trimming the asset cache never drops them
  await self.skipWaiting();
})()));

self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('pfmt-shell-') && k !== SHELL) await caches.delete(k);
  await self.clients.claim();
})()));

const isPage = (req, url) =>
  req.mode === 'navigate' || url.pathname.endsWith('/') || (req.headers.get('accept') || '').includes('text/html');
const isPrefetch = req => /prefetch/i.test(req.headers.get('sec-purpose') || req.headers.get('purpose') || '');

async function page(e, req, url) {
  try {
    const res = await fetch(req);
    if (res.ok && (res.headers.get('content-type') || '').includes('text/html') && !isPrefetch(req)) {
      const copy = res.clone();
      e.waitUntil(caches.open(PAGES).then(c => c.put(url.origin + url.pathname, copy)).then(() => trim(PAGES, PAGE_LIMIT)));
    }
    return res;
  } catch {
    return (await caches.match(url.origin + url.pathname, { ignoreSearch: true })) || (await caches.match(OFFLINE)) || Response.error();
  }
}

async function asset(e, req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) { const copy = res.clone(); e.waitUntil(caches.open(ASSETS).then(c => c.put(req, copy)).then(() => trim(ASSETS, ASSET_LIMIT))); }
  return res;
}

async function audio(req, url) {
  const hit = await (await caches.open(AUDIO)).match(url.origin + url.pathname);
  if (!hit) return fetch(req);
  const blob = await hit.blob(), type = hit.headers.get('content-type') || 'application/octet-stream';
  const r = byteRange(req.headers.get('range'), blob.size);
  const base = { 'content-type': type, 'accept-ranges': 'bytes' };
  if (r === 'bad') return new Response(null, { status: 416, headers: { 'content-range': `bytes */${blob.size}` } });
  if (!r) return new Response(blob, { headers: { ...base, 'content-length': String(blob.size) } });
  return new Response(blob.slice(r.start, r.end + 1), { status: 206, headers: { ...base,
    'content-range': `bytes ${r.start}-${r.end}/${blob.size}`, 'content-length': String(r.end - r.start + 1) } });
}

// The player asks to keep an episode once the reader is into it. Fetch it whole, then make room.
async function keepAudio(src) {
  const url = new URL(src, self.registration.scope);
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE + 'audio/')) return;
  const key = url.origin + url.pathname, c = await caches.open(AUDIO);
  if (await c.match(key)) return;
  const res = await fetch(key);
  if (!res.ok || Number(res.headers.get('content-length')) > AUDIO_CAP_BYTES) return;
  const blob = await res.blob();
  if (navigator.storage?.estimate) {
    const { quota = 0, usage = 0 } = await navigator.storage.estimate();
    if (quota && quota - usage < blob.size * 2) return;   // the device is short on room; just stream it
  }
  const kept = await Promise.all((await c.keys()).map(async k => {
    const h = (await c.match(k)).headers;
    return { url: k.url, bytes: Number(h.get('x-pfmt-bytes')) || 0, at: Number(h.get('x-pfmt-at')) || 0 };
  }));
  for (const u of audioToEvict(kept, blob.size, AUDIO_CAP_BYTES)) await c.delete(u);
  await c.put(key, new Response(blob, { headers: {
    'content-type': res.headers.get('content-type') || blob.type, 'x-pfmt-bytes': String(blob.size), 'x-pfmt-at': String(Date.now()) } }));
}

self.addEventListener('message', e => {
  if (e.data?.type === 'keep-audio' && typeof e.data.src === 'string') e.waitUntil(keepAudio(e.data.src).catch(() => {}));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  const path = url.pathname.slice(BASE.length);
  if (path.startsWith('audio/')) e.respondWith(audio(req, url));
  else if (path.startsWith('_astro/') || path.startsWith('icons/')) e.respondWith(asset(e, req));
  else if (path.startsWith('pagefind/') || path === 'sw.js') return;
  else if (isPage(req, url)) e.respondWith(page(e, req, url));
  else e.respondWith(fetch(req).catch(async () => (await caches.match(req)) || Response.error()));
});
