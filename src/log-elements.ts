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
    protected mergeLocatorNames: boolean

    constructor(
        base: T,
        name: string,
        logs: AllLogs,
        mergeLocatorNames: boolean
    ) {
        this.base = base
        this.usedName = name
        this.logs = logs
        this.mergeLocatorNames = mergeLocatorNames

        const alterReturn = (returnValue: unknown): unknown => {
            if (returnValue !== undefined) {
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
                        this.mergeLocatorNames
                    )

                if (isContext(returnValue))
                    return new LogContext(
                        returnValue,
                        this.logs,
                        this.mergeLocatorNames
                    )

                if (isPage(returnValue))
                    return new LogPage(
                        returnValue,
                        this.logs,
                        this.mergeLocatorNames
                    )

                if (isLocator(returnValue))
                    return new LogLocator(
                        returnValue,
                        this.logs,
                        this.mergeLocatorNames,
                        this instanceof LogLocator ? this.usedName : undefined
                    )

                if (isRequest(returnValue))
                    return new LogRequest(
                        returnValue,
                        this.logs,
                        this.mergeLocatorNames
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

                        if (logFunction !== undefined) {
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
     * @param mergeLocatorNames When `true`, each newly created `Locator` will have its name merged with its parent locator’s name.
     */
    constructor(browser: Browser, logs: AllLogs, mergeLocatorNames = false) {
        super(browser, browser.browserType().name(), logs, mergeLocatorNames)
    }
}

export class LogContext extends LogElement<BrowserContext> {
    constructor(
        context: BrowserContext,
        logs: AllLogs,
        mergeLocatorNames = false
    ) {
        super(context, 'context', logs, mergeLocatorNames)
    }
}

export class LogRequest extends LogElement<APIRequestContext> {
    constructor(
        request: APIRequestContext,
        logs: AllLogs,
        mergeLocatorNames = false
    ) {
        super(request, 'request', logs, mergeLocatorNames)
    }
}

export class LogPage extends LogElement<Page> {
    constructor(page: Page, logs: AllLogs, mergeLocatorNames = false) {
        super(page, 'page', logs, mergeLocatorNames)
    }
}

export class LogLocator extends LogElement<Locator> {
    protected parentName: string | undefined

    constructor(
        locator: Locator,
        logs: AllLogs,
        mergeLocatorNames = false,
        parentName?: string
    ) {
        super(locator, String(locator), logs, mergeLocatorNames)
        this.parentName = parentName
        this.describe(this.usedName)
    }

    describe(description: string) {
        let name = description

        if (this.mergeLocatorNames && this.parentName) {
            if (description === '') name = this.parentName
            else name = `${this.parentName} > ${description}`
        } else if (description === '') name = this.base.toString()

        this.base = this.base.describe(name)
        this.usedName = name
        return this
    }
}
