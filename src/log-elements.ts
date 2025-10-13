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

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LogBrowser extends Browser {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LogContext extends BrowserContext {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LogRequest extends APIRequestContext {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LogPage extends Page {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
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

            if (returnValue) {
                if (returnValue.newContext)
                    return new LogBrowser(returnValue, logs)

                if (returnValue.addCookies)
                    return new LogContext(returnValue, logs)

                if (returnValue.fill) {
                    if (returnValue.goto) return new LogPage(returnValue, logs)
                    return new LogLocator(returnValue, logs)
                }

                if (returnValue.fetch) return new LogRequest(returnValue, logs)
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
                        if (target instanceof LogBrowser)
                            logsToUse = target.logs.browserLogs
                        if (target instanceof LogContext)
                            logsToUse = target.logs.contextLogs
                        if (target instanceof LogRequest)
                            logsToUse = target.logs.requestLogs
                        if (target instanceof LogPage)
                            logsToUse = target.logs.pageLogs
                        if (target instanceof LogLocator)
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
        this.usedName = description
        return this
    }
}
