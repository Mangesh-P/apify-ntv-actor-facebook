import { Actor, log } from 'apify';
import { Page } from 'playwright';

const { ACTOR_DEFAULT_DATASET_ID, ACTOR_DEFAULT_KEY_VALUE_STORE_ID } = process.env;

export const FB_ASSET_TYPE = {
    POST: 'post',
    VIDEO: 'video',
};

/**
 * It injects a Facebook embed iframe into the page
 * @param {Page} page - Page - the page object from puppeteer
 * @param opts - {
 * @returns The iframe element
 */
export async function injectFacebookEmbedIframe(
    page: Page,
    opts: {
        iframeId: string;
        url: string;
    },
) {
    const { iframeId = 'ntv-fb-iframe', url = '' } = opts;

    const width = '700';
    const height = '700';

    // Determine whether it's a post or a video.
    const assetType = getAssetTypeFromUrl(url);
    const fbEmbedBaseUrl = `https://www.facebook.com/plugins/${assetType}.php`;
    const encodedFbUrl = encodeURIComponent(url);
    const queryParams = `?href=${encodedFbUrl}&show_text=true&width=${width}&height=${height}&appId`;

    const fullUrl = url ? fbEmbedBaseUrl + queryParams : '';

    log.info('Injecting facebook embed iframe');
    // Inject facebook embed iframe
    return await page.evaluate(
        ({ iframeId, fullUrl, width, height }: any) => {
            /**
             * <iframe
             *  src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FMazdaUSA%2Fphotos%2Fa.429757820362%2F10167170515805363%2F%3Ftype%3D3&show_text=true&width=650"
             *  width="700"
             *  style="border:none;"
             *  allowfullscreen="true"
             *  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture;"
             * >
             * </iframe>
             */

            const iframe = document.createElement('iframe');
            iframe.id = iframeId;
            iframe.src = fullUrl;
            iframe.width = width;
            iframe.height = height;
            iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture;';
            iframe.allowFullscreen = true;
            iframe.loading = 'eager';

            iframe.style.border = 'none';
            iframe.style.overflow = 'hidden';

            // log.info(`Prepending iframe to body`);

            document.body.prepend(iframe);

            return iframe;
        },
        { iframeId, fullUrl, width, height },
    );
}

export async function getIframe(page: Page, iframeId: string) {
    log.info(`Waiting for iframe with id: ${iframeId}`);
    const iframeHandle = await page.waitForSelector(`#${iframeId}`, {
        timeout: 3000,
    });

    if (iframeHandle) {
        log.info(`Getting iframe content frame`);
        return await iframeHandle.contentFrame();
    }
    return null;
}

// https://stackoverflow.com/a/37013467
export function validateFacebookUrl(url: string) {
    if (!url) return;

    const { host } = new URL(url);
    const fbTypes = ['photos', 'posts', 'videos', 'watch'];

    // We only support specific URLs so check to see that it exists.
    const hasValidType = fbTypes.some((type) => {
        return url.includes(type);
    });

    if (host.includes('facebook.com') && hasValidType) {
        log.info('It is a valid facebook URL');
        return url;
    }
    return null;
}

// https://stackoverflow.com/a/37013467
export function getAssetTypeFromUrl(url: string) {
    if (!url) return;

    const { pathname } = new URL(url);

    const postTypes = ['photos', 'posts'];
    const videoTypes = ['videos', 'watch'];

    const isPost = postTypes.some((type) => {
        return pathname.includes(type);
    });

    if (isPost) {
        log.info('It is a post');
        return FB_ASSET_TYPE.POST;
    }

    const isVideo = videoTypes.some((type) => {
        return pathname.includes(type);
    });

    if (isVideo) {
        log.info('It is a video');
        return FB_ASSET_TYPE.VIDEO;
    }

    throw new Error('Unable to get asset type from URL.');
}

export async function saveOutput(
    images: string[],
    text: string | null | undefined,
) {
    log.info(`Total images Extracted - ${images.length}`);
    const tempImageObj: { url: string }[] = [];

    images.forEach((img: string) => {
        tempImageObj.push({ url: img });
        log.info(`Image - ${img}`);
    });
    if (text) {
        log.info(`Text Extracted - ${text}`);
    }

    log.info(
        `https://api.apify.com/v2/datasets/${ACTOR_DEFAULT_DATASET_ID}/items?clean=true&format=json`,
    );
    const item = {
        tempImageObj,
        text,
    };

    return await Actor.pushData(item);
}

export async function saveError(message: string, trace: string, key = 'ERROR') {
    log.error(message);
    log.error(trace);
    log.info(
        `https://api.apify.com/v2/datasets/${ACTOR_DEFAULT_DATASET_ID}/items?clean=true&format=json`,
    );
    log.info(
        `https://api.apify.com/v2/key-value-stores/${ACTOR_DEFAULT_KEY_VALUE_STORE_ID}/records/ERROR?disableRedirect=true`,
    );

    const errMsg = {
        message,
        trace,
    };
    await Actor.pushData(errMsg);
    return await Actor.setValue(key, errMsg);
}
