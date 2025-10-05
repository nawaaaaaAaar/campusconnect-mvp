import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    // Use vite directly to avoid shell-specific scripts
    command: 'VITE_SUPABASE_URL=https://dummy.supabase.co VITE_SUPABASE_ANON_KEY=dummy VITE_FIREBASE_API_KEY=dummy VITE_FIREBASE_AUTH_DOMAIN=dummy.firebaseapp.com VITE_FIREBASE_PROJECT_ID=dummy VITE_FIREBASE_MESSAGING_SENDER_ID=123 VITE_FIREBASE_APP_ID=1:123:web:abc VITE_FIREBASE_STORAGE_BUCKET=dummy.appspot.com npx vite',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
