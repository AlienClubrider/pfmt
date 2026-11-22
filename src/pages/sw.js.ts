// The service worker for the installed app, built to /sw.js under the site base.
// It works out its own base from its scope, so it runs the same under /pfmt/ or a domain root.
//   pages  — network first; every page the reader opens is kept so it reads offline later.
//   assets — hashed /_astro/ files and icons, cache first (they never change under one name).
//   audio  — passed through to the network, except episodes the player asked to keep (see player.ts),
//            which are served from the cache with byte ranges. Capped at AUDIO_CAP_BYTES, oldest out first.
//   shell  — the offline page and what it needs; versioned per build, old versions deleted.
import { byteRange, audioToEvict, AUDIO_CAP_BYTES } from '../lib/offline';
import worker from '../scripts/service-worker.js?raw';

const VERSION = Date.now().toString(36);

export function GET() {
  const body = [
    `'use strict';`,
    `const VERSION = ${JSON.stringify(VERSION)};`,
    `const AUDIO_CAP_BYTES = ${AUDIO_CAP_BYTES};`,
    byteRange.toString(),
    audioToEvict.toString(),
    worker,
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
}
