import { Extension } from '@dist/log-elements'
import '@playwright/test'
import {
    browserExtension,
    contextExtension,
    locatorExtension,
    pageExtension,
    requestExtension
} from './custom-test'

declare module '@playwright/test' {
    interface Browser extends Extension<typeof browserExtension> {}
    interface BrowserContext extends Extension<typeof contextExtension> {}
    interface Page extends Extension<typeof pageExtension> {}
    interface Locator extends Extension<typeof locatorExtension> {}
    interface APIRequestContext extends Extension<typeof requestExtension> {}
}
