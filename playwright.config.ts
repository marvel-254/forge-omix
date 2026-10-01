import { defineConfig } from '@playwright/test';

/**
 * Phase 12 E2E (docs/13 §13.2): critical user flows against real dev
 * servers on isolated ports (API :3102 with a tmp database, client :5174).
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'pnpm exec tsx src/server/index.ts',
      port: 3102,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
      env: {
        API_PORT: '3102',
        DATABASE_URL: 'file:/tmp/omix-e2e-test.db',
        AI_MODE: 'mock',
        GIT_WORKSPACES: '/tmp/omix-e2e-git',
      },
    },
    {
      command: 'pnpm exec vite --port 5174 --strictPort',
      port: 5174,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        VITE_API_URL: 'http://localhost:3102',
      },
    },
  ],
});
