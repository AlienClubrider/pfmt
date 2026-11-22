// Rules for what the installed app keeps offline. Pure functions: unit-tested here, and copied
// verbatim into the service worker (src/pages/sw.js.ts) with Function.toString, so each must stay
// self-contained (no imports, no outside variables).

/** Bytes of episode audio the app may keep on the device. */
export const AUDIO_CAP_BYTES = 150 * 1024 * 1024;

/** Turn a Range header into an inclusive byte span of a file of `size` bytes. null = whole file; 'bad' = 416. */
export function byteRange(header: string | null, size: number): { start: number; end: number } | null | 'bad' {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return 'bad';
  let start: number, end: number;
  if (m[1] === '') { start = Math.max(0, size - Number(m[2])); end = size - 1; }  // last N bytes
  else { start = Number(m[1]); end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1); }
  return start > end || start >= size ? 'bad' : { start, end };
}

/** Which kept episodes to drop, oldest first, so that adding `incoming` bytes stays under `cap`. */
export function audioToEvict(kept: { url: string; bytes: number; at: number }[], incoming: number, cap: number): string[] {
  let total = incoming + kept.reduce((n, k) => n + k.bytes, 0);
  const out: string[] = [];
  for (const k of [...kept].sort((a, b) => a.at - b.at)) {
    if (total <= cap) break;
    out.push(k.url); total -= k.bytes;
  }
  return out;
}

/** Keep an episode once the reader is properly into it (30 s or 5%) or has finished it. */
export const worthKeeping = (position: number, seconds: number) =>
  seconds > 0 && (position >= Math.min(30, seconds * 0.05) || position >= seconds - 1);
