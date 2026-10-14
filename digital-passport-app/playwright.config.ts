import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const apiPort = process.env.E2E_API_PORT || '18080';
const uiPort = process.env.E2E_UI_PORT || '15173';
const apiURL = process.env.E2E_API_URL || `http://127.0.0.1:${apiPort}`;
const uiURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${uiPort}`;

export default defineConfig({
  testDir: './e2e/specs',
  outputDir: process.env.E2E_OUTPUT_DIR || 'playwright-results',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: uiURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  webServer: [
    ...(!process.env.E2E_API_URL ? [{
      command: 'go run ./cmd/api',
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      url: `${apiURL}/healthz`,
      env: { PORT: apiPort, KUBECONFIG: '' },
      reuseExistingServer: false,
      timeout: 120000,
    }] : []),
    ...(!process.env.E2E_BASE_URL ? [{
      command: `npm run dev -- --host 127.0.0.1 --port ${uiPort} --strictPort`,
      url: uiURL,
      env: { VITE_API_PROXY_TARGET: apiURL, VITE_API_BASE_URL: '/api/v1' },
      reuseExistingServer: false,
      timeout: 30000,
    }] : []),
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
