import { execSync } from 'child_process'
import { expect, test } from 'vitest'
import { TestName } from '../playwright/test-names'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const getStepOutput = (title: TestName): string => {
    const results = JSON.parse(
        execSync(`npx playwright test --grep '${title}'`).toString()
    )

    let currentSuites = results.suites[0]
    while (currentSuites.suites && currentSuites.suites[0])
        currentSuites = currentSuites.suites[0]

    return currentSuites.specs[0].tests[0].results[0].steps[0].title
}

test(TestName.LOCATOR, () => {
    expect(getStepOutput(TestName.LOCATOR)).toBe(
        "Klicke Element 'getByRole('button', { name: 'click me' })'."
    )
})

test(TestName.LOCATOR_DESCRIBE, () => {
    expect(getStepOutput(TestName.LOCATOR_DESCRIBE)).toBe(
        "Klicke Element 'Button: click me'."
    )
})

test(TestName.LOCATOR_EXPECT, () => {
    expect(getStepOutput(TestName.LOCATOR_EXPECT)).toBe(
        "Prüfe, ob 'Überschrift' den Text 'Header' beinhaltet."
    )
})

test(TestName.PAGE, () => {
    const filePath = join(
        dirname(fileURLToPath(import.meta.url)),
        '..',
        'playwright',
        'test.html'
    )
    const url = `file:///${filePath}`

    expect(getStepOutput(TestName.PAGE)).toBe(`Navigiere zu URL '${url}'.`)
})
