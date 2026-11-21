# Penny for My Thoughts

Notes on faith and the tech I like, by Bryson Bailey. Every post can be read or heard.

Live at <https://alienclubrider.github.io/pfmt/>.

## How it's built

- [Astro](https://astro.build), static output, served by GitHub Pages (`.github/workflows/deploy.yml` builds and deploys every push to `main`).
- Posts are MDX in `src/content/posts/`. A post in a series has `series`, `part` and `partsTotal` in its frontmatter; the site builds the "Part N of M" row, previous/next part and the list of parts from those.
- Search is [Pagefind](https://pagefind.app), built after Astro and loaded only on the search page.
- Audio: each post is read aloud with the open Kokoro-82M voice. `scripts/narrate` turns `content/narration/<slug>.txt` into `public/audio/<slug>.opus` (web) and `.m4a` (fallback and podcast) and records lengths in `src/data/audio.json`. The podcast feed is `/podcast.xml`.
- No web fonts, no analytics, no trackers. The only JavaScript is the audio player, the step-through figures, search and the light/dark switch.

## Working on it

```sh
npm ci
npm run dev      # http://localhost:4321/pfmt/
npm test         # rules for ordering, series and the feed
npm run check    # types
npm run build    # site + search index into dist/
```

Astro telemetry is off (`ASTRO_TELEMETRY_DISABLED=1` in every script).
