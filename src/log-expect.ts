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

export class LogExpect {
    protected base: Expect
    protected logs: Logs<typeof this.base<any>>

    constructor(base: Expect, logs: Logs<typeof base<any>>) {
        this.base = base
        this.logs = logs
    }

    expect<T>(actual: T): ReturnType<typeof this.base<T>> {
        const baseMatcher = this.base<T>(
            actual instanceof LogElement ? actual.getBase() : actual
        )

        const createMatcher = <T>(
            actual: T,
            matchers: typeof baseMatcher,
            not: boolean
        ) => {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const parent = this

            return new Proxy(matchers, {
                get(target, prop, receiver) {
                    const original = Reflect.get(target, prop, receiver)

                    if (prop === 'not') {
                        return createMatcher(
                            actual,
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

        return createMatcher(actual, baseMatcher, false)
    }
}
