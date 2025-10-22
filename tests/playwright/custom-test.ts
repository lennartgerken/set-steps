import {
    test as baseTest,
    expect as baseExpect,
    Locator,
    ExpectMatcherState
} from '@playwright/test'
import { LogBrowser, createLogExpect } from '@dist/index'

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

export const expect = createLogExpect(
    baseExpect,
    {
        toHaveText: (actual, not, expected) =>
            `Prüfe, ob '${actual}'${not ? ' nicht ' : ' '}den Text '${expected}' beinhaltet.`
    },
    {
        async toBeButtonType(this: ExpectMatcherState, locator: Locator) {
            const assertionName = 'toBeButtonType'
            let pass: boolean
            let matcherResult: any
            try {
                const expectation = this.isNot
                    ? baseExpect(locator).not
                    : baseExpect(locator)
                await expectation.toHaveAttribute('type', 'button')
                pass = true
            } catch (e: any) {
                matcherResult = e.matcherResult
                pass = false
            }

            if (this.isNot) pass = !pass

            return {
                message: () => assertionName,
                pass,
                name: assertionName,
                expected: true,
                actual: matcherResult?.actual
            }
        },
        toBeTestText(this: ExpectMatcherState, text: string) {
            const assertionName = 'toBeTestText'
            let pass: boolean
            let matcherResult: any
            try {
                const expectation = this.isNot
                    ? baseExpect(text).not
                    : baseExpect(text)
                expectation.toBe('test')
                pass = true
            } catch (e: any) {
                matcherResult = e.matcherResult
                pass = false
            }

            if (this.isNot) pass = !pass

            return {
                message: () => assertionName,
                pass,
                name: assertionName,
                expected: true,
                actual: matcherResult?.actual
            }
        }
    },
    {
        toBeButtonType: (actual, not) =>
            `Prüfe, ob '${actual}'${not ? ' nicht ' : ' '}den Typ 'button' hat.`,
        toBeTestText: (actual, not) =>
            `Prüfe, ob '${actual}'${not ? ' nicht ' : ' '}'test' ist.`
    }
)
