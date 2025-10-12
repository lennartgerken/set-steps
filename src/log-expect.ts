import test, { expect as base } from '@playwright/test'
import { LogElement } from './log-element'

export type Logs = {
    [K in keyof ReturnType<typeof base<any>>]?: ReturnType<
        typeof base<any>
    >[K] extends (...args: infer P) => any
        ? (actual: any, not: boolean, ...args: P) => string
        : never
}

type ExpectReturn<T> = ReturnType<typeof base<T>>

export class LogExpect {
    protected logs: Logs

    constructor(logs: Logs) {
        this.logs = logs
    }

    expect<T>(actual: T): ExpectReturn<T> {
        const baseMatcher = base<T>(
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
                                        return original.apply(receiver, args)
                                    }
                                )
                            }
                            return original.apply(receiver, args)
                        }
                    }

                    return original
                }
            })
        }

        return createMatcher(actual, baseMatcher, false)
    }
}
