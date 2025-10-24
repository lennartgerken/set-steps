import { dirname, join } from 'path'
import { test, expect } from './custom-test'
import { fileURLToPath } from 'url'
import { TestName } from './test-names'

const filePath = join(dirname(fileURLToPath(import.meta.url)), 'test.html')
const url = `file:///${filePath}`

test(TestName.BROWSER, async ({ browser }) => {
    await browser.newContext()
})

test(TestName.CONTEXT, async ({ context }) => {
    await context.newPage()
})

test(TestName.PAGE, async ({ page }) => {
    await page.goto(url)
})

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

    test(TestName.LOCATOR_DESCRIBE_OPTIONS, async ({ page }) => {
        await page
            .getByRole('button', { name: 'click me' })
            .describe('Button: click me')
            .click({ clickCount: 2 })
    })

    test(TestName.LOCATOR_DESCRIBE_CHAIN, async ({ page }) => {
        await page
            .getByRole('form')
            .describe('Formular')
            .getByLabel('text-enabled')
            .describe('Textfeld')
            .fill('Test')
    })

    test(TestName.LOCATOR_DESCRIBE_CHAIN_HIDE, async ({ page }) => {
        await page
            .getByRole('form')
            .describe('Formular')
            .getByLabel('text-enabled')
            .describe('')
            .fill('Test')
    })

    test(TestName.LOCATOR_DESCRIBE_CHAIN_FILTER, async ({ page }) => {
        await page
            .getByRole('form')
            .describe('Formular')
            .filter({ has: page.getByLabel('text-enabled') })
            .describe('Filter: Textfeld')
            .click()
    })

    test(TestName.LOCATOR_DESCRIBE_CHAIN_OR, async ({ page }) => {
        await page
            .getByLabel('text-enabled')
            .describe('Textfeld')
            .or(page.getByRole('button', { name: 'click me' }))
            .describe('oder Button: click me')
            .first()
            .describe('erstes Element')
            .click()
    })

    test(TestName.LOCATOR_EXPECT, async ({ page }) => {
        await expect(
            page.getByRole('heading').describe('Überschrift')
        ).toHaveText('Header')
    })

    test(TestName.LOCATOR_EXPECT_OPTIONS, async ({ page }) => {
        await expect(
            page.getByLabel('text-disabled').describe('Deaktiviertes Input')
        ).toBeEditable({ editable: false })
    })

    test(TestName.LOCATOR_EXPECT_NOT, async ({ page }) => {
        await expect(
            page.getByRole('heading').describe('Überschrift')
        ).not.toHaveText('Test')
    })

    test(TestName.CUSTOM_EXPECT_LOCATOR, async ({ page }) => {
        await expect(
            page.getByRole('button').describe('Button')
        ).toBeButtonType()
    })

    test(TestName.CUSTOM_EXPECT_LOCATOR_NOT, async ({ page }) => {
        await expect(
            page.getByRole('heading').describe('Überschrift')
        ).not.toBeButtonType()
    })
})

test(TestName.CUSTOM_EXPECT_STRING, async () => {
    expect('test').toBeTestText()
})
