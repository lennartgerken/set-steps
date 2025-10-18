import test from '@playwright/test'
import type { Expect } from '@playwright/test'
import { LogElement } from './log-elements'
import { getLocation } from './get-location'

type Logs<T extends (...args: any) => any> = {
    [K in keyof ReturnType<T>]?: ReturnType<T>[K] extends (
        ...args: infer P
    ) => any
        ? (actual: any, not: boolean, ...args: P) => string
        : never
}

type CustomLogs<T extends Record<string, any>> = {
    [K in keyof T]?: T[K] extends (
        this: any,
        receiver: any,
        ...args: infer P
    ) => any
        ? (actual: any, not: boolean, ...args: P) => string
        : never
}

type ExtractCustomMatchers<Matchers extends Record<string, any>, Actual> = {
    [K in keyof Matchers as Actual extends Parameters<Matchers[K]>[0]
        ? K
        : never]: Matchers[K] extends (
        this: any,
        receiver: any,
        ...args: infer Args
    ) => infer ReturnType
        ? (
              ...args: Args
          ) => ReturnType extends Promise<any> ? Promise<void> : void
        : never
}

export class LogExpect<CustomMatchers extends Parameters<Expect['extend']>[0]> {
    protected base: Expect
    protected logs: Logs<typeof this.base<any>>

    /**
     * Creates a new `LogExpect` instance.
     *
     * Wraps the Playwright `expect` so that each expect call can be logged as a custom test step.
     *
     * @param base The base Playwright `expect` function to wrap.
     * @param logs Defines a test step for each `expect` method.
     * @param custom Defines custom matchers and the corresponding test steps.
     */
    constructor(
        base: Expect,
        logs: Logs<typeof base<any>>,
        custom?: {
            matchers: CustomMatchers
            logs: CustomLogs<CustomMatchers>
        }
    ) {
        this.base = base
        this.logs = logs

        if (custom) {
            this.base = this.base.extend(custom.matchers)
            this.logs = {
                ...this.logs,
                ...custom.logs
            }
        }
    }

    expect<T>(
        actual: T
    ): ReturnType<typeof this.base<T>> &
        ExtractCustomMatchers<CustomMatchers, T> {
        const realActual =
            actual instanceof LogElement ? actual.getBase() : actual

        const baseMatcher = this.base<T>(realActual)

        const createMatcher = (matchers: typeof baseMatcher, not: boolean) => {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const parent = this

            return new Proxy(matchers, {
                get(target, prop) {
                    const original = Reflect.get(target, prop, target)

                    if (prop === 'not') {
                        return createMatcher(
                            original as typeof baseMatcher,
                            true
                        )
                    }

                    if (typeof original === 'function') {
                        return (...args: any[]) => {
                            const logFunction = (parent.logs as any)[prop]
                            if (logFunction !== undefined) {
                                return test.step(
                                    logFunction(actual, not, args),
                                    () => {
                                        return original.apply(target, args)
                                    },
                                    { location: getLocation() }
                                )
                            }
                            return original.apply(target, args)
                        }
                    }

                    return original
                }
            })
        }

        return createMatcher(baseMatcher, false) as any
    }
}
