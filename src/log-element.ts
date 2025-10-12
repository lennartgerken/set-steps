import test from '@playwright/test'
import { getLocation } from './get-location'

export type Logs<T> = {
    [Key in keyof T]?: T[Key] extends (...args: any[]) => any
        ? (usedName: string, ...args: Parameters<T[Key]>) => string
        : never
}

export abstract class LogElement<T extends object> {
    protected base: T
    protected logs: Logs<T>
    protected usedName: string

    constructor(
        base: T,
        logs: Logs<T>,
        alterReturn: (returnValue: any) => any
    ) {
        this.base = base
        this.logs = logs
        this.usedName = String(base)

        return new Proxy(this, {
            get(target, prop, receiver) {
                if (prop in target) return Reflect.get(target, prop, receiver)

                const original = Reflect.get(target.base, prop, receiver)

                if (typeof original === 'function') {
                    return (...args: any[]) => {
                        const logFunction = (target.logs as any)[prop]
                        let returnValue: any
                        if (logFunction !== undefined) {
                            returnValue = test.step(
                                logFunction(target.usedName, args),
                                () => {
                                    return original.apply(target.base, args)
                                },
                                { location: getLocation() }
                            )
                        } else returnValue = original.apply(target.base, args)

                        return alterReturn(returnValue)
                    }
                }

                return original
            }
        })
    }

    abstract describe(description: string): LogElement<T>

    getBase() {
        return this.base
    }

    toString() {
        return this.usedName
    }
}
