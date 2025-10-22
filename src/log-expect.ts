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

type ExpectReturn<
    E extends (...args: any) => any,
    CM extends Record<string, any>,
    T
> = Omit<ReturnType<E> & ExtractCustomMatchers<CM, T>, 'not'> & {
    not: ExpectReturn<E, CM, T>
}

type CustomMatchersBase = Parameters<Expect['extend']>[0]

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export class LogExpect<CustomMatchers extends CustomMatchersBase = {}> {
    protected base: Expect
    protected logs: Logs<typeof this.base<any>>

    constructor(
        base: Expect,
        logs: Logs<typeof base<any>>,
        customMatchers?: CustomMatchers,
        customLogs?: CustomLogs<CustomMatchers>
    ) {
        this.base = base
        this.logs = logs

        if (customMatchers) this.base = this.base.extend(customMatchers)
        if (customLogs)
            this.logs = {
                ...this.logs,
                ...customLogs
            }
    }

    protected getMatchers<T>(actual: T, soft: boolean, message?: string) {
        const realActual =
            actual instanceof LogElement ? actual.getBase() : actual

        const baseMatchers = soft
            ? this.base.soft<T>(realActual)
            : this.base<T>(realActual)

        const createMatchers = (
            matchers: typeof baseMatchers,
            not: boolean
        ) => {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const parent = this

            return new Proxy(matchers, {
                get(target, prop) {
                    const original = Reflect.get(target, prop, target)

                    if (prop === 'not') {
                        return createMatchers(
                            original as typeof baseMatchers,
                            true
                        )
                    }

                    if (typeof original === 'function') {
                        return (...args: any[]) => {
                            const logFunction = (parent.logs as any)[prop]
                            if (message || logFunction) {
                                return test.step(
                                    message || logFunction(actual, not, args),
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

        return createMatchers(baseMatchers, false) as any
    }

    soft<T>(
        actual: T,
        message?: string
    ): ExpectReturn<typeof this.base<T>, CustomMatchers, T> {
        return this.getMatchers(actual, true, message)
    }

    expect<T>(
        actual: T,
        message?: string
    ): ExpectReturn<typeof this.base<T>, CustomMatchers, T> {
        return this.getMatchers(actual, false, message)
    }
}

/**
 * Creates a new `LogExpect` instance.
 *
 * Wraps the Playwright `expect` so that each expect call can be logged as a custom test step.
 *
 * @param base The base Playwright `expect` function to wrap.
 * @param logs Defines a test step for each `expect` method.
 * @param customMatchers Defines custom matcher functions.
 * @param customLogs Defines the corresponding test steps for the custom matcher functions.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function createLogExpect<CustomMatchers extends CustomMatchersBase = {}>(
    base: Expect,
    logs: Logs<typeof base<any>>,
    customMatchers?: CustomMatchers,
    customLogs?: CustomLogs<CustomMatchers>
) {
    const logExpect = new LogExpect(base, logs, customMatchers, customLogs)
    const callableExpect = (<T>(actual: T, message?: string) =>
        logExpect.expect(actual, message)) as LogExpect<CustomMatchers> &
        (<T>(
            actual: T,
            message?: string
        ) => ExpectReturn<typeof base<T>, CustomMatchers, T>)
    Object.setPrototypeOf(callableExpect, logExpect)
    return callableExpect
}
