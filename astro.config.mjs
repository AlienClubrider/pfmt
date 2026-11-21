// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://alienclubrider.github.io',
  base: '/pfmt',
  trailingSlash: 'always',
  integrations: [mdx()],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
});
