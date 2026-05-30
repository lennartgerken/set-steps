import { expect } from '@playwright/test'
import { test } from './custom-test'

test('compare objects', ({ browser, context, page, request }) => {
    expect(context.browser()).toBe(browser)
    expect(browser.contexts()[0]).toBe(context)
    expect(context.pages()[0]).toBe(page)
    expect(context.request).toBe(request)
})
