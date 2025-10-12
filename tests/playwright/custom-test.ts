import { test as base } from '@playwright/test'
import { LogPage, LogExpect } from '@dist/index'

export const test = base.extend({
    page: async ({ page }, use) => {
        await use(
            new LogPage(
                page,
                {
                    goto: (_name, url) => `Navigiere zu URL '${url}'.`
                },
                {
                    click: (name) => `Klicke Element '${name}'.`
                }
            )
        )
    }
})

const logExpect = new LogExpect({
    toHaveText: (actual, not, expected) =>
        `Prüfe, ob '${actual}'${not ? ' nicht ' : ' '}den Text '${expected}' beinhaltet.`
})

export const expect = <T>(actual: T) => logExpect.expect(actual)
