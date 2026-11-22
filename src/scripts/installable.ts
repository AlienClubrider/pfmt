// The installed-app bits that run on every page: register the service worker, and offer installing.
// Android and desktop get a quiet "Install the app" item in the side menu, only when the browser says
// it can install (beforeinstallprompt). iOS Safari has no such event, so it gets one small hint, once.
const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const DISMISSED = 'pfmt-install-dismissed', IOS_HINT = 'pfmt-ios-hint-shown';
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return '1'; } };
const set = (k: string) => { try { localStorage.setItem(k, '1'); } catch { /* private mode */ } };

interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: InstallPrompt | null = null;

const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

function showInstall() {
  const show = !!deferred && !get(DISMISSED) && !standalone();
  document.querySelectorAll<HTMLElement>('[data-install]').forEach(el => { el.hidden = !show; });
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${BASE}sw.js`, { scope: BASE }).catch(() => { /* not https, or blocked */ });

addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as InstallPrompt; showInstall(); });
addEventListener('appinstalled', () => { deferred = null; set(DISMISSED); showInstall(); });

document.addEventListener('click', async e => {
  const t = (e.target as Element).closest<HTMLElement>('[data-install-go],[data-install-no],[data-ios-hint-no]');
  if (!t) return;
  if (t.hasAttribute('data-install-go') && deferred) {
    const p = deferred; deferred = null;   // a prompt can be shown once; the browser fires a fresh event if it may ask again
    await p.prompt();
  } else if (t.hasAttribute('data-install-no')) set(DISMISSED);
  else if (t.hasAttribute('data-ios-hint-no')) document.getElementById('ios-hint')?.remove();
  showInstall();
});

// iOS Safari (not already on the home screen, not in another app's web view): one hint, ever.
function iosHint() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  const safari = /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua);
  if (!ios || !safari || standalone() || get(IOS_HINT) || document.getElementById('ios-hint')) return;
  set(IOS_HINT);
  const share = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5v9h14v-9h-1"/></svg>';
  const el = Object.assign(document.createElement('div'), { id: 'ios-hint', className: 'ios-hint', role: 'status' });
  el.innerHTML = `<p>Keep it on your home screen: tap ${share}<span class="visually-hidden">Share</span>, then <b>Add to Home Screen</b>.</p>
    <button class="icon-btn sm" type="button" data-ios-hint-no aria-label="Dismiss"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`;
  document.body.append(el);
}

document.addEventListener('astro:page-load', () => { showInstall(); setTimeout(iosHint, 4000); });
