// The site's one audio player. Nothing shows until the reader presses a Listen button.
// The <audio> and the mini bar live in a transition:persist element, so audio keeps going across page changes.
// Rules from the mockups: X stops and hides it; the chevron shrinks it to a pill; auto-next plays the queue in order.
// The lock screen and car get title, series and part, the penny, play/pause, ±15 s, scrub and previous/next.
// Once the reader is into an episode, the service worker is asked to keep it for offline listening.
import { worthKeeping } from '../lib/offline';

interface Item { id: string; title: string; cat: string; album: string; href: string; src: string; fallback: string; seconds: number }
interface State { cur?: string; pos: Record<string, number>; speed: number; auto: boolean; open: boolean; collapsed: boolean }

const KEY = 'pfmt-player-v1';
const SPEEDS = [1, 1.25, 1.5, 2];
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5Z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.5" width="4.2" height="15" rx="1"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1"/></svg>';
const ic = (d: string) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  down: ic('<path d="m6 9 6 6 6-6"/>'), up: ic('<path d="m6 15 6-6 6 6"/>'), x: ic('<path d="M6 6l12 12M18 6 6 18"/>'),
  rew: ic('<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/><text x="12" y="15.2" font-size="7" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui" font-weight="700">15</text>'),
  fwd: ic('<path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v4h-4"/><text x="12" y="15.2" font-size="7" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui" font-weight="700">30</text>'),
};

let queue: Item[] = [];
const byId = (id?: string) => queue.find(q => q.id === id);
const st: State = (() => {
  try { return { pos: {}, speed: 1, auto: true, open: false, collapsed: false, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { pos: {}, speed: 1, auto: true, open: false, collapsed: false }; }
})();
st.open = st.open && !!st.cur;   // a fresh page load never starts sound; the bar comes back paused if it was open
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* private mode */ } };

const fmt = (s: number) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const dur = (id: string) => byId(id)?.seconds || 1;
const pos = (id: string) => st.pos[id] || 0;
const progress = (id: string) => Math.min(1, pos(id) / dur(id));
const nextOf = (id: string) => { const i = queue.findIndex(q => q.id === id); return i >= 0 ? queue[i + 1] : undefined; };
const prevOf = (id: string) => { const i = queue.findIndex(q => q.id === id); return i > 0 ? queue[i - 1] : undefined; };

let audio: HTMLAudioElement;
const playing = () => !!audio && !audio.paused && !audio.ended;

function load(it: Item) {
  if (audio.dataset.id === it.id) return;
  audio.dataset.id = it.id;
  audio.innerHTML = `<source src="${it.src}" type="audio/ogg; codecs=opus"><source src="${it.fallback}" type="audio/mp4">`;
  audio.load();
  const start = pos(it.id) >= it.seconds - 1 ? 0 : pos(it.id);
  audio.addEventListener('loadedmetadata', () => { audio.currentTime = start; audio.playbackRate = st.speed; }, { once: true });
}

function play(id: string) {
  const it = byId(id); if (!it) return;
  st.cur = id; st.open = true; load(it);
  audio.playbackRate = st.speed;
  audio.play().catch(() => render());
  mediaSession(it); save(); render();
}
function toggle() { if (!st.cur) return; if (playing()) audio.pause(); else play(st.cur); }
function close() { audio.pause(); st.open = false; st.collapsed = false; save(); render(); }
function seek(d: number) { if (!st.cur) return; const t = Math.min(dur(st.cur), Math.max(0, (audio.dataset.id === st.cur ? audio.currentTime : pos(st.cur)) + d)); st.pos[st.cur] = t; if (audio.dataset.id === st.cur) audio.currentTime = t; save(); render(); }
function setSpeed(s: number) { st.speed = s; if (audio) audio.playbackRate = s; save(); render(); }

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const ARTWORK = [192, 512].map(n => ({ src: `${BASE}icons/v4/icon-${n}.png`, sizes: `${n}x${n}`, type: 'image/png' }));
const jump = (to?: Item) => { if (to) { st.pos[to.id] = 0; play(to.id); } };

function mediaSession(it: Item) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({ title: it.title, artist: 'Penny for My Thoughts', album: it.album, artwork: ARTWORK });
  const h: [MediaSessionAction, MediaSessionActionHandler][] = [
    ['play', () => st.cur && play(st.cur)], ['pause', () => audio.pause()],
    ['seekbackward', d => seek(-(d.seekOffset || 15))], ['seekforward', d => seek(d.seekOffset || 15)],
    ['seekto', d => { if (d.seekTime != null && st.cur) seek(d.seekTime - (audio.dataset.id === st.cur ? audio.currentTime : pos(st.cur))); }],
    ['previoustrack', () => { if (!st.cur) return; if (audio.currentTime > 5) seek(-audio.currentTime); else jump(prevOf(st.cur)); }],
    ['nexttrack', () => jump(st.cur ? nextOf(st.cur) : undefined)],
  ];
  for (const [k, f] of h) try { navigator.mediaSession.setActionHandler(k, f); } catch { /* unsupported action */ }
}

function sessionPosition() {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = playing() ? 'playing' : 'paused';
  if (!audio.duration || !isFinite(audio.duration)) return;
  try { navigator.mediaSession.setPositionState({ duration: audio.duration, position: Math.min(audio.currentTime, audio.duration), playbackRate: audio.playbackRate || 1 }); } catch { /* older browsers */ }
}

// Ask the service worker to keep this episode on the device (it decides about room and the 150 MB cap).
const kept = new Set<string>();
function keepOffline(id: string) {
  const src = audio.currentSrc;
  if (kept.has(id) || !src || !worthKeeping(pos(id), dur(id)) || !navigator.serviceWorker?.controller) return;
  kept.add(id);
  navigator.serviceWorker.controller.postMessage({ type: 'keep-audio', src });
}

function listenLabel(id: string, mins: number) {
  const on = st.cur === id && playing(), pr = progress(id);
  if (on) return { on, text: `Pause · ${fmt((dur(id) - pos(id)) / st.speed)} left` };
  if (pr > 0.01 && pr < 0.99) return { on, text: `Resume · ${Math.ceil((dur(id) - pos(id)) / 60)} min left` };
  return { on, text: `Listen · ${mins} min` };
}

function render() {
  const mini = document.getElementById('mini');
  const it = byId(st.cur);
  if (mini) {
    const show = st.open && !!it;
    mini.hidden = !show;
    document.body.classList.toggle('has-mini', show && !st.collapsed);
    if (show && it) {
      const p = pos(it.id), pct = p / it.seconds * 100, on = playing(), n = nextOf(it.id);
      mini.className = `mini cat-${it.cat} ${st.collapsed ? 'pill' : ''}`;
      mini.innerHTML = st.collapsed
        ? `<button class="pbtn xs" data-toggle aria-label="${on ? 'Pause' : 'Play'}">${on ? PAUSE : PLAY}</button>
           <button class="pill-t" data-expand aria-label="Show player"><span class="ring" style="--p:${pct}"></span>${fmt(p)}${I.up}</button>
           <button class="icon-btn sm" data-close aria-label="Stop and close">${I.x}</button>`
        : `<div class="prog" style="width:${pct}%"></div>
           <button class="pbtn sm" data-toggle aria-label="${on ? 'Pause' : 'Play'}">${on ? PAUSE : PLAY}</button>
           <a class="t" href="${it.href}"><b>${esc(it.title)}</b><small>${fmt(p)} / ${fmt(it.seconds)}${st.auto && n ? ` · then ${esc(n.title)}` : ''}</small></a>
           <div class="ctl"><button class="icon-btn sm hide-sm" data-rew aria-label="Back 15 seconds">${I.rew}</button>
             <button class="icon-btn sm hide-sm" data-fwd aria-label="Forward 30 seconds">${I.fwd}</button>
             <button class="spd" data-speed aria-label="Playback speed">${st.speed}×</button>
             <button class="icon-btn sm" data-collapse aria-label="Make smaller">${I.down}</button>
             <button class="icon-btn sm" data-close aria-label="Stop and close">${I.x}</button></div>`;
    }
  }
  document.querySelectorAll<HTMLButtonElement>('button.listen[data-play]').forEach(b => {
    const l = listenLabel(b.dataset.play!, +(b.dataset.mins || 1));
    b.classList.toggle('on', l.on); b.setAttribute('aria-label', l.text);
    b.innerHTML = `<span class="disc">${l.on ? PAUSE : PLAY}</span><span class="lbl">${l.text}</span>`;
  });
  document.querySelectorAll<HTMLElement>('[data-speed-label]').forEach(e => { e.textContent = `${st.speed}×`; });
  document.dispatchEvent(new CustomEvent('pfmt:player', { detail: { st, playing: playing(), queue } }));
}

function readQueue() {
  const el = document.getElementById('pfmt-queue');
  queue = el ? JSON.parse(el.textContent || '[]') : [];
}

function init() {
  const el = document.getElementById('pfmt-audio') as HTMLAudioElement | null;
  if (!el) return;
  if (audio !== el) {
    audio = el;
    let last = -1;
    audio.addEventListener('timeupdate', () => {
      const id = audio.dataset.id; if (!id) return;
      st.pos[id] = audio.currentTime;
      const s = Math.floor(audio.currentTime); if (s !== last) { last = s; save(); render(); sessionPosition(); keepOffline(id); }
    });
    audio.addEventListener('play', () => { render(); sessionPosition(); }); audio.addEventListener('pause', () => { save(); render(); sessionPosition(); });
    audio.addEventListener('ended', () => {
      const id = audio.dataset.id!; st.pos[id] = dur(id); keepOffline(id);
      const n = nextOf(id);
      if (st.auto && n) { st.pos[n.id] = 0; play(n.id); } else { save(); render(); }
    });
  }
  readQueue(); render();
}

// Wire clicks once; buttons are matched by data attributes so they work on every page after a swap.
document.addEventListener('click', e => {
  const t = (e.target as Element).closest<HTMLElement>('[data-play],[data-toggle],[data-speed],[data-set-speed],[data-rew],[data-fwd],[data-close],[data-collapse],[data-expand],[data-auto]');
  if (!t || !audio) return;
  if (t.dataset.play) { e.preventDefault(); const id = t.dataset.play; if (st.cur === id && playing()) audio.pause(); else { if (playing()) audio.pause(); play(id); } }
  else if (t.hasAttribute('data-toggle')) toggle();
  else if (t.hasAttribute('data-speed')) setSpeed(SPEEDS[(SPEEDS.indexOf(st.speed) + 1) % SPEEDS.length]);
  else if (t.dataset.setSpeed) setSpeed(+t.dataset.setSpeed);
  else if (t.hasAttribute('data-rew')) seek(-15);
  else if (t.hasAttribute('data-fwd')) seek(30);
  else if (t.hasAttribute('data-close')) close();
  else if (t.hasAttribute('data-collapse')) { st.collapsed = true; save(); render(); }
  else if (t.hasAttribute('data-expand')) { st.collapsed = false; save(); render(); }
  else if (t.hasAttribute('data-auto')) { st.auto = !st.auto; save(); render(); }
});
document.addEventListener('astro:page-load', init);

export const player = { fmt, progress, pos, dur, nextOf, byId, st, playing: () => playing() };
