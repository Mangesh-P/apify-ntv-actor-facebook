/**
 * This template is a production ready boilerplate for developing with `PlaywrightCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

// For more information, see https://docs.apify.com/sdk/js
import { Actor, log } from "apify";
// For more information, see https://crawlee.dev
import { ProxyConfiguration, launchPlaywright } from "crawlee";
// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// note that we need to use `.js` even when inside TS files

import { Page } from "playwright";

import {
    getIframe,
    injectFacebookEmbedIframe,
    saveError,
    saveOutput,
    validateFacebookUrl,
} from "./utils.js";

const DEMO_SITE = "https://demo.ntv.io/genericsite.com/sponsoredcontent.html";
const IFRAME_ID = "ntv-fb-iframe";

interface IInput {
    url: string;
    proxy: ProxyConfiguration;
}

// Initialize the Apify SDK
await Actor.init();

try {
    const input = await Actor.getInput<IInput>();

    if (!input) throw new Error("Input is missing!");
    const { url, proxy } = input;
    // const url = 'https://www.facebook.com/MazdaUSA/photos/a.429757820362/10167170515805363';

    if (!validateFacebookUrl(url)) {
        throw new Error("Not a valid Facebook URL.");
    }

    const proxyConfiguration = await Actor.createProxyConfiguration({
        useApifyProxy: true,
        ...proxy,
    });

    let proxyUrl: any;
    if (proxyConfiguration) {
        proxyUrl = await proxyConfiguration.newUrl();
    }
    const browser = await launchPlaywright({
        proxyUrl,
        launchOptions: {
            devtools: false,
            headless: true,
        },
    });
    if (browser) {
        log.info("Launching new page");
        const page: Page = await browser.newPage();

        await page.goto(DEMO_SITE, {
            waitUntil: "domcontentloaded",
        });

        // Inject facebook embed iframe
        await injectFacebookEmbedIframe(page, {
            iframeId: IFRAME_ID,
            url,
        });

        // Use a random timeout to help with bot detection
        await page.waitForTimeout(3000);

        // Get content from injected facebook iframe
        const iframeContent = await getIframe(page, IFRAME_ID);

        // The iframe will still exist even if facebook blocks the current
        // session. Thus, if there is no text or images, then it usually means it
        // wasn't able to load the iframe content (ie. ip address blocked).
        if (iframeContent) {
            log.info("Extracting text and images");
            const images: string[] = await iframeContent.$$eval(
                "img.img",
                (imgs: any[]) => {
                    return imgs.map((img: any) => img.src);
                }
            );

            const text = await iframeContent.evaluate(
                () => document.querySelector("p")?.textContent
            );

            if (!text && !images.length) {
                log.error("Unable to extract text or images.");
            } else {
                await saveOutput(images, text);
                log.info("Successfully extracted text and images.");
            }
        }
    } else {
        throw new Error("Browser is not defined");
    }
} catch (error) {
    await saveError(error);
} finally {
    // Exit successfully
    await Actor.exit();
}
