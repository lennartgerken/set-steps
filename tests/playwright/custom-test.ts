import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { LogBrowser, LogExpect } from '@dist/index'

export const test = baseTest.extend({
    browser: async ({ browser }, use) => {
        await use(
            new LogBrowser(
                browser,
                {
                    browserLogs: {
                        newContext: () => 'Öffne neuen Context.'
                    },
                    contextLogs: {
                        newPage: () => 'Öffne neue Page.'
                    },
                    pageLogs: {
                        goto: (_name, url) => `Navigiere zu URL '${url}'.`
                    },
                    locatorLogs: {
                        click: (name) => `Klicke Element '${name}'.`,
                        fill: (name, value) =>
                            `Schreibe Wert '${value}' in '${name}'.`
                    }
                },
                true
            )
        )
    }
})

const logExpect = new LogExpect(baseExpect, {
    toHaveText: (actual, not, expected) =>
        `Prüfe, ob '${actual}'${not ? ' nicht ' : ' '}den Text '${expected}' beinhaltet.`
})

export const expect = <T>(actual: T) => logExpect.expect(actual)
