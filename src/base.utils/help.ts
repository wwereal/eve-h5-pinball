/**
 * Resolve after wait milliseconds.
 * @param wait
 * @returns
 */
export function sleep(wait = 0): Promise<void> {
    // from 申天义
    // 注意，该时间并不准确，不要用在精确场景；
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, wait);
    });
}

type ElementPlus = Element & {
    $currentObserver?: IntersectionObserver;
};

export const unbindObserver = (element: ElementPlus) => {
    element.$currentObserver?.unobserve(element);
    element.$currentObserver?.disconnect();
};

export const bindObserver = (
    element: ElementPlus,
    inCallback: () => void,
    outCallback?: () => void,
    options?: IntersectionObserverInit,
) => {
    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
        if (entries.length > 0) {
            const entry = entries[entries.length - 1];
            if (entry) {
                const isInElement = entry.isIntersecting;
                isInElement ? inCallback() : outCallback?.();
            }
        }
    }, options);

    observer.observe(element);
    const ele = element;
    ele.$currentObserver = observer;
};

const TIMEOUT = 100;

export function openUrlInIframe(link: string) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', link);
    iframe.setAttribute('style', 'display:none');
    document.body.appendChild(iframe);
    setTimeout(() => document.body.removeChild(iframe), TIMEOUT);
}

export function loadImage(el: HTMLImageElement, src: string): Promise<HTMLImageElement> {
    const img = el;
    return new Promise((resolve, reject) => {
        img.onload = () => {
            resolve(img);
        };
        img.onerror = () => {
            reject(src);
        };
        img.src = src;
    });
}

export function retry<F extends (...args: any[]) => Promise<any>>(fn: F, params: any[], retryTimes = 3) {
    let count = retryTimes - 1;
    return new Promise((resolve, reject) => {
        function tryLoad() {
            fn.apply(null, [...params])
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    if (count > 0) {
                        tryLoad();
                        count--;
                    } else {
                        reject(err);
                    }
                });
        }
        tryLoad();
    });
}

export async function retryLoadImage(
    el: HTMLImageElement,
    src: string,
    fallbackSrc: string,
    retryTimes = 1,
    onLoad?: () => void,
    onError?: () => void,
) {
    const imgElm = el;
    try {
        const res = await retry(loadImage, [imgElm, src, retryTimes]);
        if (res) {
            onLoad?.();
        }
    } catch (error) {
        imgElm.src = fallbackSrc;
        onError?.();
    }
}
