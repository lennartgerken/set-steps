import '@playwright/test'
import {
    browserExtension,
    contextExtension,
    locatorExtension,
    pageExtension,
    requestExtension
} from './custom-test'
import {
    ExtendBrowser,
    ExtendContext,
    ExtendLocator,
    ExtendPage,
    ExtendRequest
} from '@dist/log-elements'

declare module '@playwright/test' {
    interface Browser extends ExtendBrowser<typeof browserExtension> {}
    interface BrowserContext extends ExtendContext<typeof contextExtension> {}
    interface Page extends ExtendPage<typeof pageExtension> {}
    interface Locator extends ExtendLocator<typeof locatorExtension> {}
    interface APIRequestContext
        extends ExtendRequest<typeof requestExtension> {}
}
