import test from '@playwright/test'
import type { Expect } from '@playwright/test'
import { LogElement } from './log-elements'
import { getLocation } from './get-location'

type Logs<T extends (...args: any) => any> = {
    [K in keyof ReturnType<T> as ReturnType<T>[K] extends (
        ...args: any[]
    ) => infer R
        ? R extends Promise<any>
            ? K
            : never
        : never]?: ReturnType<T>[K] extends (...args: infer P) => any
        ? (actual: any, not: boolean, ...args: P) => string
        : never
}

type CustomLogs<T extends Record<string, any>> = {
    [K in keyof T as T[K] extends (
        this: any,
        receiver: any,
        ...args: any[]
    ) => infer R
        ? R extends Promise<any>
            ? K
            : never
        : never]?: T[K] extends (
        this: any,
        receiver: infer R,
        ...args: infer P
    ) => any
        ? (actual: R, not: boolean, ...args: P) => string
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

export class LogExpect<CM extends Record<string, any> = Record<string, never>> {
    protected base: Expect
    protected logs: Logs<typeof this.base<any>>
    protected customMatchers: CM
    protected customMatcherTitles: Set<string>

    constructor(base: Expect) {
        this.base = base
        this.logs = {}
        this.customMatchers = {} as CM
        this.customMatcherTitles = new Set([])
    }

    /**
     * Defines custom log messages for the expect matchers.
     * @param logs An array of log definitions.
     */
    defineLogs<Ls extends unknown[]>(logs: {
        [I in keyof Ls]: Logs<typeof this.base<Ls[I]>>
    }) {
        this.logs = logs.reduce(
            (merged, current) => Object.assign(merged, current),
            this.logs
        )
        return this
    }

    /**
     * Defines custom matchers and optionally their corresponding log messages.
     * @param customMatchers An object containing the custom matchers to define.
     * @param customLogs An object containing the log messages for the custom matchers.
     */
    defineCustomMatchers<NewCM extends CustomMatchersBase>(
        customMatchers: NewCM,
        customLogs?: CustomLogs<NewCM>
    ) {
        this.base = this.base.extend(customMatchers)
        Object.keys(customMatchers).forEach((key) =>
            this.customMatcherTitles.add(key)
        )
        ;(this as any).customMatchers = customMatchers
        if (customLogs) {
            this.logs = {
                ...this.logs,
                ...customLogs
            }
        }
        this.customMatcherTitles = new Set(Object.keys(customMatchers))
        return this as unknown as LogExpect<NewCM>
    }

    protected getMatchers<T>(actual: T, soft: boolean, message?: string) {
        const getBaseMatchers = (actual: T) => {
            return soft
                ? this.base.soft<T>(actual, message)
                : this.base<T>(actual, message)
        }

        const baseMatchers = getBaseMatchers(actual)
        const baseUnwrappedMatchers =
            actual instanceof LogElement
                ? getBaseMatchers(actual.getBase())
                : baseMatchers

        const createMatchers = (
            matchers: typeof baseMatchers,
            unwrappedMatchers: typeof baseMatchers,
            not: boolean
        ) => {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const parent = this

            return new Proxy(matchers, {
                get(target, prop, receiver) {
                    const original = Reflect.get(target, prop, receiver)
                    const originalUnwrapped = Reflect.get(
                        unwrappedMatchers,
                        prop
                    )

                    if (prop === 'not') {
                        return createMatchers(
                            original as typeof baseMatchers,
                            originalUnwrapped as typeof baseMatchers,
                            true
                        )
                    }

                    const isCustomMatcher = parent.customMatcherTitles.has(
                        prop.toString()
                    )

                    const originalToUse = !isCustomMatcher
                        ? originalUnwrapped
                        : original

                    const targetToUse = !isCustomMatcher
                        ? unwrappedMatchers
                        : matchers

                    if (typeof originalToUse === 'function') {
                        return (...args: any[]) => {
                            const logFunction = (parent.logs as any)[prop]
                            if (logFunction) {
                                return test.step(
                                    logFunction(actual, not, ...args),
                                    () => {
                                        return originalToUse.apply(
                                            targetToUse,
                                            args
                                        )
                                    },
                                    { location: getLocation() }
                                )
                            }
                            return originalToUse.apply(targetToUse, args)
                        }
                    }

                    return originalToUse
                }
            })
        }

        return createMatchers(baseMatchers, baseUnwrappedMatchers, false) as any
    }

    soft<T>(
        actual: T,
        message?: string
    ): ExpectReturn<typeof this.base<T>, CM, T> {
        return this.getMatchers(actual, true, message)
    }

    expect<T>(
        actual: T,
        message?: string
    ): ExpectReturn<typeof this.base<T>, CM, T> {
        return this.getMatchers(actual, false, message)
    }

    /**
     * Builds the final LogExpect instance which is also a callable function. The returned function can be used as a normal expect function.
     */
    build(): LogExpect<CM> &
        (<T>(
            actual: T,
            message?: string
        ) => ExpectReturn<typeof this.base<T>, CM, T>) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const logExpect = this
        const callableExpect = (<T>(actual: T, message?: string) =>
            logExpect.expect(actual, message)) as LogExpect<CM> &
            (<T>(
                actual: T,
                message?: string
            ) => ExpectReturn<typeof logExpect.base<T>, CM, T>)
        Object.setPrototypeOf(callableExpect, logExpect)
        return callableExpect
    }
}
