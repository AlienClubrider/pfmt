// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { createCssVariablesTheme } from 'shiki';

// Code colours come from CSS variables (src/styles/book-figures.css), so they follow the site theme.
const codeTheme = createCssVariablesTheme({ name: 'pfmt', variablePrefix: '--shiki-', fontStyle: true });

// PFMT_PREVIEW=1 builds the private preview (drafts and posts in review included) for
// https://wiz.theprintingpixel.com/pfmt/preview/. See "Review before publishing" in the README.
const PREVIEW = /** @type {any} */ (globalThis).process.env.PFMT_PREVIEW === '1'; // no @types/node here

export default defineConfig({
  site: PREVIEW ? 'https://wiz.theprintingpixel.com' : 'https://alienclubrider.github.io',
  base: PREVIEW ? '/pfmt/preview' : '/pfmt',
  outDir: PREVIEW ? './dist-preview' : './dist',
  vite: { define: { __PFMT_PREVIEW__: JSON.stringify(PREVIEW) } },
  trailingSlash: 'always',
  integrations: [mdx()],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  markdown: { shikiConfig: { theme: codeTheme } },
});
