import { execSync } from 'child_process'
import { expect, test, describe } from 'vitest'
import { TestName } from '../playwright/report-based-test-names'
import { url } from '../shared'

for (const browser of ['chromium', 'firefox', 'webkit']) {
    describe(browser, () => {
        const tests = new Map<string, { title: string; subtitle?: string }>()

        test.beforeAll(() => {
            const getSpecs = (suites: any) => {
                if (suites.specs) {
                    suites.specs.forEach((spec: any) => {
                        const step = spec.tests[0].results[0].steps[0]
                        tests.set(spec.title, {
                            title: step.title,
                            subtitle: step.subtitle
                        })
                    })
                }
                if (suites.suites) getSpecs(suites.suites[0])
            }

            getSpecs(
                JSON.parse(
                    execSync(
                        `npx playwright test report-based.spec.ts --project ${browser} --reporter json`
                    ).toString()
                ).suites[0]
            )
        }, 15000)

        test(TestName.BROWSER, () => {
            expect(tests.get(TestName.BROWSER)?.title).toBe(
                'Öffne neuen Context.'
            )
        })

        test(TestName.CONTEXT, () => {
            expect(tests.get(TestName.CONTEXT)?.title).toBe('Öffne neue Page.')
        })

        test(TestName.PAGE, () => {
            expect(tests.get(TestName.PAGE)?.title).toBe(
                `Navigiere zu URL '${url}'.`
            )
        })

        test(TestName.REQUEST, () => {
            expect(tests.get(TestName.REQUEST)?.title).toBe(
                `Sende GET Request an '${url}'.`
            )
        })

        test(TestName.LOCATOR_DESCRIBE, () => {
            expect(tests.get(TestName.LOCATOR_DESCRIBE)?.title).toBe(
                "Klicke Element 'Button: click me'."
            )
        })

        test(TestName.LOCATOR_DESCRIBE_OPTIONS, () => {
            expect(tests.get(TestName.LOCATOR_DESCRIBE_OPTIONS)?.title).toBe(
                "Klicke 2 mal Element 'Button: click me'."
            )
        })

        test(TestName.LOCATOR_DESCRIBE_CHAIN, () => {
            expect(tests.get(TestName.LOCATOR_DESCRIBE_CHAIN)?.title).toBe(
                "Schreibe Wert 'Test' in 'Formular > Textfeld'."
            )
        })

        test(TestName.LOCATOR_DESCRIBE_CHAIN_HIDE, () => {
            expect(tests.get(TestName.LOCATOR_DESCRIBE_CHAIN_HIDE)?.title).toBe(
                "Schreibe Wert 'Test' in 'Text in Formular'."
            )
        })

        test(TestName.LOCATOR_DESCRIBE_CHAIN_FILTER, () => {
            expect(
                tests.get(TestName.LOCATOR_DESCRIBE_CHAIN_FILTER)?.title
            ).toBe("Klicke Element 'Formular > Filter: Textfeld'.")
        })

        test(TestName.LOCATOR_DESCRIBE_CHAIN_OR, () => {
            expect(tests.get(TestName.LOCATOR_DESCRIBE_CHAIN_OR)?.title).toBe(
                "Klicke Element 'Textfeld > oder Button: click me > erstes Element'."
            )
        })

        test(TestName.LOCATOR_NO_CHAIN, () => {
            expect(tests.get(TestName.LOCATOR_NO_CHAIN)?.title).toBe(
                "Schreibe Wert 'Test' in 'getByRole('form').getByLabel('text-enabled')'."
            )
        })

        test(TestName.LOCATOR_DESCRIBE_NO_CHAIN, () => {
            expect(tests.get(TestName.LOCATOR_DESCRIBE_NO_CHAIN)?.title).toBe(
                "Schreibe Wert 'Test' in 'Textfeld'."
            )
        })

        test(TestName.LOCATOR_EXPECT, () => {
            expect(tests.get(TestName.LOCATOR_EXPECT)?.title).toBe(
                "Prüfe, ob 'Überschrift' den Text 'Header' beinhaltet."
            )
        })

        test(TestName.LOCATOR_EXPECT_OPTIONS, () => {
            expect(tests.get(TestName.LOCATOR_EXPECT_OPTIONS)?.title).toBe(
                "Prüfe, ob 'Deaktiviertes Input' nicht editierbar ist."
            )
        })

        test(TestName.LOCATOR_EXPECT_NOT, () => {
            expect(tests.get(TestName.LOCATOR_EXPECT_NOT)?.title).toBe(
                "Prüfe, ob 'Überschrift' nicht den Text 'Test' beinhaltet."
            )
        })

        test(TestName.CUSTOM_EXPECT_LOCATOR, () => {
            expect(tests.get(TestName.CUSTOM_EXPECT_LOCATOR)?.title).toBe(
                "Prüfe, ob 'Button' den Typ 'button' hat."
            )
        })

        test(TestName.CUSTOM_EXPECT_LOCATOR_NOT, () => {
            expect(tests.get(TestName.CUSTOM_EXPECT_LOCATOR_NOT)?.title).toBe(
                "Prüfe, ob 'Überschrift' nicht den Typ 'button' hat."
            )
        })

        test(TestName.EXTENSION_BROWSER, () => {
            expect(tests.get(TestName.EXTENSION_BROWSER)?.title).toBe(
                'Öffne neuen Context.'
            )
        })

        test(TestName.EXTENSION_CONTEXT, () => {
            expect(tests.get(TestName.EXTENSION_CONTEXT)?.title).toBe(
                'Öffne neue Page.'
            )
        })

        test(TestName.EXTENSION_PAGE, () => {
            expect(tests.get(TestName.EXTENSION_PAGE)?.title).toBe(
                `Navigiere zu URL '${url}'.`
            )
        })

        test(TestName.EXTENSION_LOCATOR, () => {
            expect(tests.get(TestName.LOCATOR_DESCRIBE)?.title).toBe(
                "Klicke Element 'Button: click me'."
            )
        })

        test(TestName.EXTENSION_LOCATOR_PARAM, () => {
            expect(tests.get(TestName.EXTENSION_LOCATOR_PARAM)?.title).toBe(
                "Gebe Text 'Test' in 'Formular > Textfeld' ein."
            )
        })

        test(TestName.EXTENSION_LOCATOR_RETURN, () => {
            expect(tests.get(TestName.EXTENSION_LOCATOR_RETURN)?.title).toBe(
                'Click me'
            )
        })

        test(TestName.EXTENSION_REQUEST, () => {
            expect(tests.get(TestName.EXTENSION_REQUEST)?.title).toBe(
                `Sende GET Request an '${url}'.`
            )
        })

        test(TestName.SUBTITLE, () => {
            const result = tests.get(TestName.SUBTITLE)
            expect(result?.title).toBe('Fokusiere Element.')
            expect(result?.subtitle).toBe('Textfeld')
        })
    })
}
