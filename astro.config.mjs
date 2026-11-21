// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { createCssVariablesTheme } from 'shiki';

// Code colours come from CSS variables (src/styles/book-figures.css), so they follow the site theme.
const codeTheme = createCssVariablesTheme({ name: 'pfmt', variablePrefix: '--shiki-', fontStyle: true });

export default defineConfig({
  site: 'https://alienclubrider.github.io',
  base: '/pfmt',
  trailingSlash: 'always',
  integrations: [mdx()],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  markdown: { shikiConfig: { theme: codeTheme } },
});
