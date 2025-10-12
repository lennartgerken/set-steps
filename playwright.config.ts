import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests/playwright/',
    forbidOnly: !!process.env.CI,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['json']],
    expect: {
        timeout: 5000
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ]
})
