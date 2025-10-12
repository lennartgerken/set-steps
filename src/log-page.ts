import { Locator, Page } from '@playwright/test'
import { LogElement, Logs } from './log-element'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LogPage extends Page {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LogLocator extends Locator {}

export class LogLocator extends LogElement<Locator> {
    constructor(locator: Locator, logs: Logs<Locator>, pageLogs: Logs<Page>) {
        super(locator, logs, (returnValue) => {
            if (returnValue.fill) {
                if (returnValue.goto)
                    return new LogPage(returnValue, pageLogs, logs)
                return new LogLocator(returnValue, logs, pageLogs)
            }
            return returnValue
        })
    }

    describe(description: string) {
        this.base = this.base.describe(description)
        this.usedName = description
        return this
    }
}

export class LogPage extends LogElement<Page> {
    constructor(page: Page, logs: Logs<Page>, locatorLogs: Logs<Locator>) {
        super(page, logs, (returnValue) => {
            if (returnValue.fill) {
                if (returnValue.goto)
                    return new LogPage(returnValue, logs, locatorLogs)
                return new LogLocator(returnValue, locatorLogs, logs)
            }
            return returnValue
        })
    }

    describe(description: string) {
        this.usedName = description
        return this
    }
}
