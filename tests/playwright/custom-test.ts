import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { LogBrowser, LogExpect } from '@dist/index'

export const test = baseTest.extend({
    browser: async ({ browser }, use) => {
        await use(
            new LogBrowser(browser, {
                pageLogs: {
                    goto: (_name, url) => `Navigiere zu URL '${url}'.`
                },
                locatorLogs: {
                    click: (name) => `Klicke Element '${name}'.`
                },
                browserLogs: {
                    newContext: () => 'Erstelle neuen Context.'
                }
            })
        )
    }
})

const logExpect = new LogExpect(baseExpect, {
    toHaveText: (actual, not, expected) =>
        `Prüfe, ob '${actual}'${not ? ' nicht ' : ' '}den Text '${expected}' beinhaltet.`
})

export const expect = <T>(actual: T) => logExpect.expect(actual)
