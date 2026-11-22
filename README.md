# Penny for My Thoughts

Notes on faith and the tech I like, by Bryson Bailey. Every post can be read or heard.

Live at <https://alienclubrider.github.io/pfmt/>.

## How it's built

- [Astro](https://astro.build), static output, served by GitHub Pages (`.github/workflows/deploy.yml` builds and deploys every push to `main`).
- Posts are MDX in `src/content/posts/`. A post in a series has `series`, `part` and `partsTotal` in its frontmatter; the site builds the "Part N of M" row, previous/next part and the list of parts from those.
- Search is [Pagefind](https://pagefind.app), built after Astro and loaded only on the search page.
- Audio: each post is read aloud with the open Kokoro-82M voice. `scripts/narrate` turns `content/narration/<slug>.txt` into `public/audio/<slug>.opus` (web) and `.m4a` (fallback and podcast) and records lengths in `src/data/audio.json`. The podcast feed is `/podcast.xml`.
- No web fonts, no analytics, no trackers. The only JavaScript is the audio player, the step-through figures, search and the light/dark switch.

## Review before publishing

Nothing new or edited goes on the public site until Bryson says OK. Each post has a `status` in its frontmatter:

| status | where it shows |
| --- | --- |
| `draft` (the default) | private preview only, marked "DRAFT - not public" |
| `review` | private preview only, marked "IN REVIEW - not public" |
| `published` | the public site (and the preview) |

The flow:

1. Write or edit the post with `status: draft`. Editing a published post? Set it back to `review` so the public build drops it until the change is approved.
2. When it's ready, set `status: review`, re-record its audio if the text changed (`scripts/narrate <slug>`), and run `npm run preview:build`. That builds every post into `dist-preview/` and copies it to `~/wiz-share/pfmt/preview/`, served at <https://wiz.theprintingpixel.com/pfmt/preview/> behind Cloudflare login. Never link the preview from the public site.
3. Bryson reads (and listens) there and says OK, or asks for changes.
4. Only after his OK: set `status: published`, commit, push to `main`. The deploy builds the public site with published posts only.

The public build (`npm run build`) leaves out unpublished posts everywhere: pages, lists, counts, search, the listen queue and the podcast feed, and it deletes their audio files from `dist/`. A series with a part still in review shows the parts that are out ("7 of 8 parts out so far"); previous/next skip the gap.

## Working on it

```sh
npm ci
npm run dev      # http://localhost:4321/pfmt/
npm test         # rules for ordering, series and the feed
npm run check    # types
npm run build    # site + search index into dist/ (published posts only)
npm run preview:build  # private preview of everything, see above
```

Astro telemetry is off (`ASTRO_TELEMETRY_DISABLED=1` in every script).
