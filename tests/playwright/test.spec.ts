import { dirname, join } from 'path'
import { test, expect } from './custom-test'
import { fileURLToPath } from 'url'
import { TestName } from './test-names'

const filePath = join(dirname(fileURLToPath(import.meta.url)), 'test.html')
const url = `file:///${filePath}`

test.describe(() => {
    test.beforeEach(async ({ page }) => {
        await page.goto(url)
    })

    test(TestName.LOCATOR, async ({ page }) => {
        await page.getByRole('button', { name: 'click me' }).click()
    })

    test(TestName.LOCATOR_DESCRIBE, async ({ page }) => {
        await page
            .getByRole('button', { name: 'click me' })
            .describe('Button: click me')
            .click()
    })

    test(TestName.LOCATOR_EXPECT, async ({ page }) => {
        await expect(
            page.getByRole('heading').describe('Überschrift')
        ).toHaveText('Header')
    })
})

test(TestName.PAGE, async ({ page }) => {
    await page.goto(url)
})
