# set-steps

Automatically add expressive test steps to Playwright actions and extend core APIs with custom methods.

## Installation

```
npm i -D set-steps
```

## Overview

`set-steps` enhances Playwright reports by automatically wrapping actions and assertions into test steps and by allowing you to extend Playwright’s core APIs with custom, reusable methods. This keeps test code concise while enabling custom, localized or more expressive messages for every action in one place.

## Example Usage

### Configuring Steps

To use `set-steps`, wrap your existing Playwright `Browser` instance in a `LogBrowser` object. `LogBrowser` accepts two parameters:
The Playwright `Browser` instance and an `options` object to configure the `LogBrowser`. The following options can be set:

- `logs`: An object defining the step titles for methods of `Browser`, `BrowserContext`, `APIRequestContext`, `Page`, and `Locator`
- `chainLocatorNames`: A boolean flag whether to chain names of child `Locator` objects.
- `browserExtension`, `contextExtension`, `pageExtension`, `requestExtension` and `locatorExtension`: Objects to extend every object of the respective type with additional methods.

The simplest way to integrate `LogBrowser` is by overriding the built-in `browser` fixture:

```ts
import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { LogBrowser, createLogExpect } from 'set-steps'

export const test = baseTest.extend({
    browser: async ({ browser }, use) => {
        await use(
            new LogBrowser(browser, {
                logs: {
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
                }
            })
        )
    }
})
```

In this example, test steps are localized in German. Each step function receives the element name and any parameters normally passed to the Playwright method, allowing you to customize your test report messages.

As a second step, wrap Playwright’s `expect` with a `LogExpect` instance. This lets you define custom test steps for each assertion:

```ts
export const expect = createLogExpect(baseExpect, {
    toHaveText: (actual, not, expected) =>
        `Prüfe, ob '${actual}'${not ? ' nicht ' : ' '}den Text '${expected}' beinhaltet.`
})
```

Here we define a custom test step for `toHaveText`.
Each test step definition function receives three parameters:

- actual: The value passed to `expect` (for `toHaveText` this would be the `Locator`)
- not: A boolean indicating negation
- expected: The expected value

Once your `browser` fixture is wrapped, Playwright automatically provides a `LogPage` instance as the `page` fixture in your test cases:

```ts
import { test, expect } from './custom-test'

test('Test', async ({ page }) => {
    await page
        .getByRole('form')
        .describe('Formular')
        .getByLabel('text')
        .describe('Textfeld')
        .fill('Test')
})
```

Here, chained locators are named using `.describe()`.
The generated test step in the report would look like:

```
Schreibe Wert 'Test' in 'Formular > Textfeld'.
```

Assertions also can be used as usual:

```ts
await expect(page.getByRole('heading').describe('Überschrift')).toHaveText(
    'Header'
)
```

Because we imported our `LogExpect` as expect, the report output would look like this:

```
Prüfe, ob 'Überschrift' den Text 'Header' beinhaltet.
```

### Custom Matchers

You can define custom matchers by passing them as a third argument to the `createLogExpect` function.
A fourth argument specifies the corresponding test steps:

```ts
export const expect = createLogExpect(
    baseExpect,
    {
        toHaveText: (actual, not, expected) =>
            `Prüfe, ob '${actual}'${not ? ' nicht ' : ' '}den Text '${expected}' beinhaltet.`
    },
    {
        async toBeButtonType(this: ExpectMatcherState, locator: Locator) {
            ...
        },
    },
    {
        toBeButtonType: (actual, not) =>
            `Prüfe, ob '${actual}'${not ? ' nicht ' : ' '}den Typ 'button' hat.`,
    }
)
```

### Extensions

With extensions, you can, for example, add methods to every `Locator` object. Let’s say we want to add a `write` method. This can be done by specifying a `LocatorExtension`. It is an object that defines methods which always receive a `Locator` as their first parameter:

```ts
import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { LogBrowser, createLogExpect } from 'set-steps'

export const locatorExtension = {
    async write(locator: Locator, text: string) {
        await expect(locator).toBeEditable()
        await locator.pressSequentially(text)
    }
}

export const test = baseTest.extend({
    browser: async ({ browser }, use) => {
        await use(
            new LogBrowser(browser, {
                logs: {
                    ...
                },
                locatorExtension
            })
        )
    }
})
```

As a second step, we need to create a `global.d.ts` file and extend the `Locator` type so that TypeScript knows our extension methods are available:

```ts
import '@playwright/test'
import { ExtendLocator } from 'set-steps'
import { locatorExtension } from './custom-test'

declare module '@playwright/test' {
    interface Locator extends ExtendLocator<typeof locatorExtension> {}
}
```

You may also need to create a `tsconfig.json` to ensure that the `global.d.ts` file is picked up by TypeScript.
Now we can use the extension methods on every `Locator` object:

```ts
import { test, expect } from './custom-test'

test('Test', async ({ page }) => {
    await page
        .getByRole('form')
        .describe('Formular')
        .getByLabel('text')
        .describe('Textfeld')
        .write('Test')
})
```

## License

This package is licensed under the [MIT License](./LICENSE).
