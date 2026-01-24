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
type BrowserExtension = Record<
    string,
    (browser: Browser, ...args: unknown[]) => unknown
>

type ContextExtension = Record<
    string,
    (context: BrowserContext, ...args: unknown[]) => unknown
>

type PageExtension = Record<string, (page: Page, ...args: unknown[]) => unknown>

type LocatorExtension = Record<
    string,
    (locator: Locator, ...args: unknown[]) => unknown
>

type RequestExtension = Record<
    string,
    (request: APIRequestContext, ...args: unknown[]) => unknown
>

export type Extension<
    T extends
        | BrowserExtension
        | ContextExtension
        | PageExtension
        | RequestExtension
        | LocatorExtension
> = {
    [Key in keyof T]: T[Key] extends (base: any, ...args: infer A) => infer R
        ? (...args: A) => R
        : never
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

type Options = {
    /**Defines a test step for each method of `Browser`, `BrowserContext`, `APIRequestContext`, `Page`, and `Locator`.*/
    logs?: AllLogs
    /**Specifies additional methods for `Browser` objects.*/
    browserExtension?: BrowserExtension
    /**Specifies additional methods for `BrowserContext` objects.*/
    contextExtension?: ContextExtension
    /**Specifies additional methods for `Page` objects.*/
    pageExtension?: PageExtension
    /**Specifies additional methods for `APIRequestContext` objects.*/
    requestExtension?: RequestExtension
    /**Specifies additional methods for `Locator` objects.*/
    locatorExtension?: LocatorExtension
    /**When `true`, each newly created `Locator` will have its name merged with its parent locator’s name.*/
    chainLocatorNames?: boolean
}

export interface LogBrowser extends Browser {}
export interface LogContext extends BrowserContext {}
export interface LogRequest extends APIRequestContext {}
export interface LogPage extends Page {}
export interface LogLocator extends Locator {}

export abstract class LogElement<T extends object> {
    protected base: T
    protected usedName: string
    protected options: Required<Options>

    constructor(base: T, name: string, options: Options = {}) {
        this.base = base
        this.usedName = name
        this.options = {
            logs: options.logs ?? {},
            browserExtension: options.browserExtension ?? {},
            contextExtension: options.contextExtension ?? {},
            pageExtension: options.pageExtension ?? {},
            requestExtension: options.requestExtension ?? {},
            locatorExtension: options.locatorExtension ?? {},
            chainLocatorNames:
                options.chainLocatorNames === undefined
                    ? true
                    : options.chainLocatorNames
        }

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
                    return new LogBrowser(returnValue, options)

                if (isContext(returnValue))
                    return new LogContext(returnValue, options)

                if (isPage(returnValue))
                    return new LogPage(returnValue, options)

                if (isLocator(returnValue))
                    return new LogLocator(returnValue, {
                        ...options,
                        parentName:
                            this instanceof LogLocator
                                ? this.usedName
                                : undefined
                    })

                if (isRequest(returnValue))
                    return new LogRequest(returnValue, options)
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

                let extensionToUse: any

                if (isBrowser(target.base))
                    extensionToUse = target.options.browserExtension
                else if (isContext(target.base))
                    extensionToUse = target.options.contextExtension
                else if (isRequest(target.base))
                    extensionToUse = target.options.requestExtension
                else if (isPage(target.base))
                    extensionToUse = target.options.pageExtension
                else if (isLocator(target.base))
                    extensionToUse = target.options.locatorExtension

                if (extensionToUse && prop in extensionToUse) {
                    return (...args: any[]) => {
                        return extensionToUse[prop as string](receiver, ...args)
                    }
                }
                const original = Reflect.get(target.base, prop, receiver)

                if (typeof original === 'function') {
                    return (...args: any[]) => {
                        const realArgs = alterArgs(args)

                        let logsToUse: any

                        if (isBrowser(target.base))
                            logsToUse = target.options.logs.browserLogs
                        else if (isContext(target.base))
                            logsToUse = target.options.logs.contextLogs
                        else if (isRequest(target.base))
                            logsToUse = target.options.logs.requestLogs
                        else if (isPage(target.base))
                            logsToUse = target.options.logs.pageLogs
                        else if (isLocator(target.base))
                            logsToUse = target.options.logs.locatorLogs

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
     * @param options Options to configure the `LogBrowser`.
     */
    constructor(browser: Browser, options: Options = {}) {
        super(browser, browser.browserType().name(), options)
    }
}

export class LogContext extends LogElement<BrowserContext> {
    constructor(context: BrowserContext, options: Options = {}) {
        super(context, 'context', options)
    }
}

export class LogRequest extends LogElement<APIRequestContext> {
    constructor(request: APIRequestContext, options: Options = {}) {
        super(request, 'request', options)
    }
}

export class LogPage extends LogElement<Page> {
    constructor(page: Page, options: Options = {}) {
        super(page, 'page', options)
    }
}

export class LogLocator extends LogElement<Locator> {
    protected parentName: string | undefined

    constructor(
        locator: Locator,
        options: Options & { parentName?: string } = {}
    ) {
        super(locator, String(locator), options)
        this.parentName = options.parentName
        if (this.options.chainLocatorNames) this.describe('')
        else this.describe(this.usedName)
    }

    describe(description: string) {
        let name = description

        if (this.options.chainLocatorNames) {
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
