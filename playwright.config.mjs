// Browser checks against the built site (npm run build first). Run with: npm run test:e2e
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4398/pfmt/', ...devices['Desktop Chrome'] },
  webServer: {
    command: 'npx astro preview --port 4398 --ignore-lock',
    url: 'http://localhost:4398/pfmt/',
    reuseExistingServer: false,
    env: { ASTRO_TELEMETRY_DISABLED: '1' },
  },
});
