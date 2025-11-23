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
    return (
        typeof value === 'object' &&
        value != null &&
        typeof (value as Browser).newContext === 'function' &&
        typeof (value as Browser).close === 'function'
    )
}

function isContext(value: unknown): value is BrowserContext {
    return (
        typeof value === 'object' &&
        value != null &&
        typeof (value as BrowserContext).addCookies === 'function' &&
        typeof (value as BrowserContext).newPage === 'function'
    )
}

function isPage(value: unknown): value is Page {
    return (
        typeof value === 'object' &&
        value != null &&
        typeof (value as Page).goto === 'function' &&
        typeof (value as Page).locator === 'function'
    )
}

function isRequest(value: unknown): value is APIRequestContext {
    return (
        typeof value === 'object' &&
        value != null &&
        typeof (value as APIRequestContext).fetch === 'function' &&
        typeof (value as APIRequestContext).get === 'function' &&
        typeof (value as APIRequestContext).post === 'function'
    )
}

function isLocator(value: unknown): value is Locator {
    return (
        typeof value === 'object' &&
        value != null &&
        typeof (value as Locator).locator === 'function' &&
        typeof (value as Locator).fill === 'function' &&
        typeof (value as Locator).click === 'function' &&
        (value as Page).goto == null
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
    protected chainLocatorNames: boolean

    constructor(
        base: T,
        name: string,
        logs: AllLogs,
        chainLocatorNames: boolean
    ) {
        this.base = base
        this.usedName = name
        this.logs = logs
        this.chainLocatorNames = chainLocatorNames

        const alterReturn = (returnValue: unknown): unknown => {
            if (returnValue != null) {
                if (returnValue instanceof Promise)
                    return returnValue.then((fullfilled) =>
                        alterReturn(fullfilled)
                    )

                if (Array.isArray(returnValue))
                    return returnValue.map((current: unknown) =>
                        alterReturn(current)
                    )

                if (returnValue instanceof LogElement) return returnValue

                if (isBrowser(returnValue))
                    return new LogBrowser(
                        returnValue,
                        this.logs,
                        this.chainLocatorNames
                    )

                if (isContext(returnValue))
                    return new LogContext(
                        returnValue,
                        this.logs,
                        this.chainLocatorNames
                    )

                if (isPage(returnValue))
                    return new LogPage(
                        returnValue,
                        this.logs,
                        this.chainLocatorNames
                    )

                if (isLocator(returnValue))
                    return new LogLocator(
                        returnValue,
                        this.logs,
                        this.chainLocatorNames,
                        this instanceof LogLocator ? this.usedName : undefined
                    )

                if (isRequest(returnValue))
                    return new LogRequest(
                        returnValue,
                        this.logs,
                        this.chainLocatorNames
                    )
            }
            return returnValue
        }

        const alterArgs = (args: unknown[]) => {
            const seen = new WeakSet<object>()

            return args.map((current): unknown => {
                const alterArg = (arg: unknown): unknown => {
                    if (arg instanceof LogElement) return arg.getBase()

                    if (Array.isArray(arg)) {
                        for (let i = 0; i < arg.length; i++) {
                            const newValue = alterArg(arg[i])
                            if (newValue !== arg[i]) arg[i] = newValue
                        }
                        return arg
                    }

                    if (typeof arg === 'object' && arg !== null) {
                        if (seen.has(arg)) return arg
                        seen.add(arg)

                        const obj = arg as any
                        for (const key of Object.keys(obj)) {
                            const newValue = alterArg(obj[key])
                            if (newValue !== obj[key]) obj[key] = newValue
                        }

                        return obj
                    }

                    return arg
                }

                return alterArg(current)
            })
        }

        return new Proxy(this, {
            get(target, prop, receiver) {
                if (prop in target) return Reflect.get(target, prop, receiver)
                const original = Reflect.get(target.base, prop, receiver)

                if (typeof original === 'function') {
                    return (...args: any[]) => {
                        const realArgs = alterArgs(args)

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

                        if (logFunction != null) {
                            return test.step(
                                logFunction(target.usedName, ...args),
                                () => {
                                    return alterReturn(
                                        original.apply(target.base, realArgs)
                                    )
                                },
                                { location: getLocation() }
                            )
                        }
                        return alterReturn(
                            original.apply(target.base, realArgs)
                        )
                    }
                }
                return alterReturn(original)
            }
        })
    }

    describe(description: string) {
        this.usedName = description
        return this
    }

    getBase() {
        return this.base
    }

    toString() {
        return this.usedName
    }
}

export class LogBrowser extends LogElement<Browser> {
    /**
     * Creates a new `LogBrowser` instance.
     *
     * Wraps the Playwright `Browser` so that each method call can be logged as a custom test step.
     *
     * All child objects (`BrowserContext`, `APIRequestContext`, `Page`, and `Locator`)
     * will also be wrapped as `LogElement` instances.
     *
     * @param browser The Playwright `Browser` instance.
     * @param logs Defines a test step for each method of `Browser`, `BrowserContext`, `APIRequestContext`, `Page`, and `Locator`.
     * @param chainLocatorNames When `true`, each newly created `Locator` will have its name merged with its parent locator’s name.
     */
    constructor(browser: Browser, logs: AllLogs, chainLocatorNames = false) {
        super(browser, browser.browserType().name(), logs, chainLocatorNames)
    }
}

export class LogContext extends LogElement<BrowserContext> {
    constructor(
        context: BrowserContext,
        logs: AllLogs,
        chainLocatorNames = false
    ) {
        super(context, 'context', logs, chainLocatorNames)
    }
}

export class LogRequest extends LogElement<APIRequestContext> {
    constructor(
        request: APIRequestContext,
        logs: AllLogs,
        chainLocatorNames = false
    ) {
        super(request, 'request', logs, chainLocatorNames)
    }
}

export class LogPage extends LogElement<Page> {
    constructor(page: Page, logs: AllLogs, chainLocatorNames = false) {
        super(page, 'page', logs, chainLocatorNames)
    }
}

export class LogLocator extends LogElement<Locator> {
    protected parentName: string | undefined

    constructor(
        locator: Locator,
        logs: AllLogs,
        chainLocatorNames = false,
        parentName?: string
    ) {
        super(locator, String(locator), logs, chainLocatorNames)
        this.parentName = parentName
        if (chainLocatorNames) this.describe('')
        else this.describe(this.usedName)
    }

    describe(description: string) {
        let name = description

        if (this.chainLocatorNames) {
            if (this.parentName) {
                if (description === '') name = this.parentName
                else name = `${this.parentName} > ${description}`
            }
        } else if (description === '') name = this.base.toString()

        this.base = this.base.describe(name)
        this.usedName = name
        return this
    }
}
