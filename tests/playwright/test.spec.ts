import { test, testNoChain, expect } from './custom-test'
import { TestName } from './test-names'
import { url } from '../shared'

test(TestName.BROWSER, async ({ browser }) => {
    await browser.newContext()
})

test(TestName.CONTEXT, async ({ context }) => {
    await context.newPage()
})

test(TestName.PAGE, async ({ page }) => {
    await page.goto(url)
})

test(TestName.REQUEST, async ({ request }) => {
    await request.get(url)
})

test.describe(() => {
    test.beforeEach(async ({ page }) => {
        await page.goto(url)
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
            .getByLabel('text-enabled')
            .describe('Text in Formular')
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

    testNoChain(TestName.LOCATOR_NO_CHAIN, async ({ page }) => {
        await page.getByRole('form').getByLabel('text-enabled').fill('Test')
    })

    testNoChain(TestName.LOCATOR_DESCRIBE_NO_CHAIN, async ({ page }) => {
        await page
            .getByRole('form')
            .describe('Formular')
            .getByLabel('text-enabled')
            .describe('Textfeld')
            .fill('Test')
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

    test(TestName.EXTENSION_LOCATOR, async ({ page }) => {
        await page
            .getByRole('button', { name: 'click me' })
            .describe('Button: click me')
            .clickMe()
    })

    test(TestName.EXTENSION_LOCATOR_PARAM, async ({ page }) => {
        await page
            .getByRole('form')
            .describe('Formular')
            .getByLabel('text-enabled')
            .describe('Textfeld')
            .write('Test')
    })

    test(TestName.EXTENSION_LOCATOR_RETURN, async ({ page }) => {
        await test.step(
            await page
                .getByRole('button', { name: 'click me' })
                .describe('Button: click me')
                .getText(),
            async () => {}
        )
    })
})

test(TestName.EXTENSION_BROWSER, async ({ browser }) => {
    await browser.getNewContext()
})

test(TestName.EXTENSION_CONTEXT, async ({ context }) => {
    await context.getNewPage()
})

test(TestName.EXTENSION_PAGE, async ({ page }) => {
    await page.nav()
})

test(TestName.EXTENSION_REQUEST, async ({ request }) => {
    await request.runGet()
})
