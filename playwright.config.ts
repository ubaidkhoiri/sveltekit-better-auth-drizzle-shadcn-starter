import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4173';

export default defineConfig({
	testDir: './e2e',
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0,
	use: {
		baseURL,
		trace: 'on-first-retry'
	},
	webServer: process.env.E2E_BASE_URL
		? undefined
		: {
				command: 'npm run preview',
				url: baseURL,
				reuseExistingServer: !process.env.CI,
				timeout: 60_000
			},
	projects: [{ name: 'chromium', use: { browserName: 'chromium' } }]
});
