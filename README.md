# set-steps

Automatically inject test steps into Playwright actions.

## Installation

```
npm i -D set-steps
```

## Overview

`set-steps` enhances Playwright reports by automatically wrapping actions into test steps. This allows you to define custom, localized, or more expressive messages for every action in one place.

## Example Usage

To use `set-steps`, wrap your existing Playwright `Browser` instance in a `LogBrowser` object. `LogBrowser` accepts three parameters:

- The Playwright `Browser` instance
- An object defining the step titles for methods of `Browser`, `BrowserContext`, `APIRequestContext`, `Page`, and `Locator`
- A boolean flag whether to chain names of child `Locator` objects

The simplest way to integrate `LogBrowser` is by overriding the built-in `browser` fixture:

```ts
import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { LogBrowser, LogExpect } from 'set-steps'

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
```

In this example, test steps are localized in German. Each step function receives the element name and any parameters normally passed to the Playwright method, allowing you to customize your test report messages.

As a second step, wrap Playwright’s `expect` with a `LogExpect` instance. This lets you define custom test steps for each assertion:

```ts
const logExpect = new LogExpect(baseExpect, {
    toHaveText: (actual, not, expected) =>
        `Prüfe, ob '${actual}'${not ? ' nicht ' : ' '}den Text '${expected}' beinhaltet.`
})

export const expect = <T>(actual: T) => logExpect.expect(actual)
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

Because we imported our `LogExpect` function as expect, the report output would look like this:

```
Prüfe, ob 'Überschrift' den Text 'Header' beinhaltet.
```

## Custom Matchers

You can define custom matchers by passing a third argument to the `LogExpect` constructor.
This parameter is an object that specifies the matcher functions along with their corresponding test steps:

```ts
const logExpect = new LogExpect(
    baseExpect,
    {
        toHaveText: (actual, not, expected) =>
            `Prüfe, ob '${actual}'${not ? ' nicht ' : ' '}den Text '${expected}' beinhaltet.`
    },
    {
        matchers: {
            async toBeButtonType(locator: Locator) {
                ...
            }
        },
        logs: {
            toBeButtonType: (actual, not) =>
                `Prüfe, ob '${actual}'${not ? ' nicht ' : ' '}den Typ 'button' hat.`
        }
    }
)

export const expect = <T>(actual: T) => logExpect.expect(actual)
```

## License

This package is licensed under the [MIT License](./LICENSE).
