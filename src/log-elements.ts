import test from '@playwright/test'
import type {
    APIRequestContext,
    Browser,
    BrowserContext,
    Locator,
    Page
} from '@playwright/test'
import { getLocation } from './get-location'

type Logs<T> = {
    [Key in keyof T]?: T[Key] extends (...args: any[]) => any
        ? (usedName: string, ...args: Parameters<T[Key]>) => string
        : never
}

type AllLogs = {
    browserLogs?: Logs<Browser>
    contextLogs?: Logs<BrowserContext>
    requestLogs?: Logs<APIRequestContext>
    pageLogs?: Logs<Page>
    locatorLogs?: Logs<Locator>
}

function isBrowser(value: unknown): value is Browser {
    return (value as Browser).newContext !== undefined
}

function isContext(value: unknown): value is BrowserContext {
    return (value as BrowserContext).addCookies !== undefined
}

function isPage(value: unknown): value is Page {
    return (value as Page).goto !== undefined
}

function isRequest(value: unknown): value is APIRequestContext {
    return (value as APIRequestContext).fetch !== undefined
}

function isLocator(value: unknown): value is Locator {
    return (
        (value as Locator).fill !== undefined &&
        (value as Page).goto === undefined
    )
}

export interface LogBrowser extends Browser {}
export interface LogContext extends BrowserContext {}
export interface LogRequest extends APIRequestContext {}
export interface LogPage extends Page {}
export interface LogLocator extends Locator {}

export abstract class LogElement<T extends object> {
    protected base: T
    protected usedName: string
    protected logs: AllLogs

    constructor(base: T, name: string, logs: AllLogs) {
        this.base = base
        this.usedName = name
        this.logs = logs

        const alterReturn = (returnValue: any): any => {
            if (returnValue instanceof Promise)
                return returnValue.then((fullfilled) => alterReturn(fullfilled))

            if (Array.isArray(returnValue))
                return returnValue.map((current: any) => alterReturn(current))

            if (returnValue !== undefined) {
                if (isBrowser(returnValue))
                    return new LogBrowser(returnValue, logs)

                if (isContext(returnValue))
                    return new LogContext(returnValue, logs)

                if (isPage(returnValue)) return new LogPage(returnValue, logs)

                if (isLocator(returnValue))
                    return new LogLocator(returnValue, logs)

                if (isRequest(returnValue))
                    return new LogRequest(returnValue, logs)
            }
            return returnValue
        }

        return new Proxy(this, {
            get(target, prop, receiver) {
                if (prop in target) return Reflect.get(target, prop, receiver)
                const original = Reflect.get(target.base, prop, receiver)

                if (typeof original === 'function') {
                    return (...args: any[]) => {
                        let logsToUse: any

                        if (isBrowser(target.base))
                            logsToUse = target.logs.browserLogs
                        else if (isContext(target.base))
                            logsToUse = target.logs.contextLogs
                        else if (isRequest(target.base))
                            logsToUse = target.logs.requestLogs
                        else if (isPage(target.base))
                            logsToUse = target.logs.pageLogs
                        else if (isLocator(target.base))
                            logsToUse = target.logs.locatorLogs

                        const logFunction = logsToUse
                            ? logsToUse[prop]
                            : undefined

                        if (logFunction !== undefined) {
                            return test.step(
                                logFunction(target.usedName, args),
                                () => {
                                    return alterReturn(
                                        original.apply(target.base, args)
                                    )
                                },
                                { location: getLocation() }
                            )
                        }
                        return alterReturn(original.apply(target.base, args))
                    }
                }
                return alterReturn(original)
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

export class LogBrowser extends LogElement<Browser> {
    constructor(browser: Browser, logs: AllLogs) {
        super(browser, browser.browserType().name(), logs)
    }

    describe(description: string) {
        this.usedName = description
        return this
    }
}

export class LogContext extends LogElement<BrowserContext> {
    constructor(context: BrowserContext, logs: AllLogs) {
        super(context, 'context', logs)
    }

    describe(description: string) {
        this.usedName = description
        return this
    }
}

export class LogRequest extends LogElement<APIRequestContext> {
    constructor(request: APIRequestContext, logs: AllLogs) {
        super(request, 'request', logs)
    }

    describe(description: string) {
        this.usedName = description
        return this
    }
}

export class LogPage extends LogElement<Page> {
    constructor(page: Page, logs: AllLogs) {
        super(page, 'page', logs)
    }

    describe(description: string) {
        this.usedName = description
        return this
    }
}

export class LogLocator extends LogElement<Locator> {
    constructor(locator: Locator, logs: AllLogs) {
        super(locator, String(locator), logs)
    }

    describe(description: string) {
        this.base = this.base.describe(description)
        this.usedName = description
        return this
    }
}
