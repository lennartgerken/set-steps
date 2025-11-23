import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests/playwright/',
    forbidOnly: !!process.env.CI,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['json']],
    expect: {
        timeout: 5000
    },
    webServer: {
        command: 'npm run serve-test',
        port: 3000,
        reuseExistingServer: !process.env.CI
    },
    use: { baseURL: 'http://localhost:3000' },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] }
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] }
        }
    ]
})
