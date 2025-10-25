import { execSync } from 'child_process'
import { expect, test } from 'vitest'
import { TestName } from '../playwright/test-names'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const tests = new Map<string, string>()

test.beforeAll(() => {
    const getSpecs = (suites: any) => {
        if (suites.specs) {
            suites.specs.forEach((spec: any) => {
                tests.set(spec.title, spec.tests[0].results[0].steps[0].title)
            })
        }
        if (suites.suites) getSpecs(suites.suites[0])
    }

    getSpecs(JSON.parse(execSync(`npx playwright test`).toString()).suites[0])
})

test(TestName.BROWSER, () => {
    expect(tests.get(TestName.BROWSER)).toBe('Öffne neuen Context.')
})

test(TestName.CONTEXT, () => {
    expect(tests.get(TestName.CONTEXT)).toBe('Öffne neue Page.')
})

test(TestName.PAGE, () => {
    const filePath = join(
        dirname(fileURLToPath(import.meta.url)),
        '..',
        'playwright',
        'test.html'
    )
    const url = `file:///${filePath}`

    expect(tests.get(TestName.PAGE)).toBe(`Navigiere zu URL '${url}'.`)
})

test(TestName.LOCATOR_DESCRIBE, () => {
    expect(tests.get(TestName.LOCATOR_DESCRIBE)).toBe(
        "Klicke Element 'Button: click me'."
    )
})

test(TestName.LOCATOR_DESCRIBE_OPTIONS, () => {
    expect(tests.get(TestName.LOCATOR_DESCRIBE_OPTIONS)).toBe(
        "Klicke 2 mal Element 'Button: click me'."
    )
})

test(TestName.LOCATOR_DESCRIBE_CHAIN, () => {
    expect(tests.get(TestName.LOCATOR_DESCRIBE_CHAIN)).toBe(
        "Schreibe Wert 'Test' in 'Formular > Textfeld'."
    )
})

test(TestName.LOCATOR_DESCRIBE_CHAIN_HIDE, () => {
    expect(tests.get(TestName.LOCATOR_DESCRIBE_CHAIN_HIDE)).toBe(
        "Schreibe Wert 'Test' in 'Text in Formular'."
    )
})

test(TestName.LOCATOR_DESCRIBE_CHAIN_FILTER, () => {
    expect(tests.get(TestName.LOCATOR_DESCRIBE_CHAIN_FILTER)).toBe(
        "Klicke Element 'Formular > Filter: Textfeld'."
    )
})

test(TestName.LOCATOR_DESCRIBE_CHAIN_OR, () => {
    expect(tests.get(TestName.LOCATOR_DESCRIBE_CHAIN_OR)).toBe(
        "Klicke Element 'Textfeld > oder Button: click me > erstes Element'."
    )
})

test(TestName.LOCATOR_NO_CHAIN, () => {
    expect(tests.get(TestName.LOCATOR_NO_CHAIN)).toBe(
        "Schreibe Wert 'Test' in 'getByRole('form').getByLabel('text-enabled')'."
    )
})

test(TestName.LOCATOR_DESCRIBE_NO_CHAIN, () => {
    expect(tests.get(TestName.LOCATOR_DESCRIBE_NO_CHAIN)).toBe(
        "Schreibe Wert 'Test' in 'Textfeld'."
    )
})

test(TestName.LOCATOR_EXPECT, () => {
    expect(tests.get(TestName.LOCATOR_EXPECT)).toBe(
        "Prüfe, ob 'Überschrift' den Text 'Header' beinhaltet."
    )
})

test(TestName.LOCATOR_EXPECT_OPTIONS, () => {
    expect(tests.get(TestName.LOCATOR_EXPECT_OPTIONS)).toBe(
        "Prüfe, ob 'Deaktiviertes Input' nicht editierbar ist."
    )
})

test(TestName.LOCATOR_EXPECT_NOT, () => {
    expect(tests.get(TestName.LOCATOR_EXPECT_NOT)).toBe(
        "Prüfe, ob 'Überschrift' nicht den Text 'Test' beinhaltet."
    )
})

test(TestName.CUSTOM_EXPECT_LOCATOR, () => {
    expect(tests.get(TestName.CUSTOM_EXPECT_LOCATOR)).toBe(
        "Prüfe, ob 'Button' den Typ 'button' hat."
    )
})

test(TestName.CUSTOM_EXPECT_LOCATOR_NOT, () => {
    expect(tests.get(TestName.CUSTOM_EXPECT_LOCATOR_NOT)).toBe(
        "Prüfe, ob 'Überschrift' nicht den Typ 'button' hat."
    )
})

test(TestName.CUSTOM_EXPECT_STRING, () => {
    expect(tests.get(TestName.CUSTOM_EXPECT_STRING)).toBe(
        "Prüfe, ob 'test' 'test' ist."
    )
})
