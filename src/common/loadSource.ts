export const sleep = (t = 0, willBreak = false): Promise<void> => {
    // from shentianyi
    // 注意，该时间并不准确，不要用在精确场景；
    return new Promise((resolve, reject) => {
        // eslint-disable-next-line no-underscore-dangle
        const _t = setTimeout(() => {
            clearTimeout(_t);
            if (willBreak) {
                reject(new Error('sleep_timeout'));
            } else {
                resolve();
            }
        }, t);
    });
};

/** 加载图片配置 */
type LoadImageOptions = {
    /** 图片是否跨域请求，默认 true */
    crossOrigin?: boolean;
};

/** 通用配置 */
type LoadCommonOptions = {
    /** 超时时间 */
    timeout?: number;
    /** 低端机是否加载 */
    lpDisable?: boolean;
};

type Options = LoadCommonOptions & LoadImageOptions;

type LoadResult = boolean | undefined;
type Result = {
    success: LoadResult;
    source: string;
};
type PromiseLoadRes = Promise<LoadResult>;
type PromiseRes = Promise<Result>;

type LoadSourceResult = Promise<{
    done: boolean;
    detail: Result[];
}>;

type SourceLoader = (url: string, options?: Options) => PromiseLoadRes;

const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pjpeg', 'apng'];
const audioTypes = ['mp3', 'wav'];

const sourceCache: Record<string, PromiseLoadRes> = {};
const sources: {
    type: 'image' | 'video' | 'audio' | 'model' | 'magic';
    includes: string[];
    loader: SourceLoader;
}[] = [
    {
        type: 'image',
        includes: imageTypes,
        loader: async (url, options = {}) => {
            if (!sourceCache[url]) {
                sourceCache[url] = (() =>
                    new Promise((resolve) => {
                        const { crossOrigin = true, timeout } = options;
                        console.log('image source:', url);
                        const img = new Image();
                        if (crossOrigin) {
                            img.crossOrigin = 'anonymous';
                        }

                        img.onload = () => {
                            resolve(true);
                        };
                        img.onerror = () => {
                            resolve(false);
                        };

                        img.src = url;
                        if (timeout) {
                            sleep(timeout).then(() => {
                                resolve(false);
                            });
                        }
                    }))();
            }
            return sourceCache[url];
        },
    },
    {
        type: 'audio',
        includes: audioTypes,
        loader: async (url, options) => {
            if (!sourceCache[url]) {
                sourceCache[url] = (() =>
                    new Promise((resolve) => {
                        fetch(url)
                            .then(() => {
                                resolve(true);
                            })
                            .catch(() => {
                                resolve(false);
                            });

                        if (options?.timeout) {
                            sleep(options?.timeout).then(() => {
                                resolve(false);
                            });
                        }
                    }))();
            }

            return sourceCache[url];
        },
    },
];

const loadSourceByType = (sourceUrl: string, options?: Options): PromiseRes => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
        const tailName = sourceUrl.split('.').pop() ?? '';
        if (!tailName) {
            resolve({
                success: false,
                source: sourceUrl,
            });
            return;
        }

        try {
            const loader = sources.find((item) => item.includes.includes(tailName))?.loader;
            if (loader) {
                resolve({
                    success: await loader(sourceUrl, options),
                    source: sourceUrl,
                });
                return;
            }

            resolve({
                success: undefined,
                source: sourceUrl,
            });
        } catch (error) {
            console.log('load error:', error);
            resolve({
                success: false,
                source: sourceUrl,
            });
            return;
        }
    });
};

type PreloadSource = (sourceUrl: string[] | string, options?: Options) => LoadSourceResult;

export const preloadSource: PreloadSource = (sourceUrl, options = {}) => {
    const { lpDisable = false } = options;
    if (lpDisable && (window as any).ENV_INFO.islp) {
        return Promise.resolve({
            done: true,
            detail: [],
        });
    }

    if (!Array.isArray(sourceUrl)) {
        return preloadSource([sourceUrl], options);
    }

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
        if (!sourceUrl.length) {
            resolve({
                done: true,
                detail: [],
            });
            return;
        }

        const result = await Promise.all(sourceUrl.map((source) => loadSourceByType(source, options)));
        resolve({
            done: true,
            detail: result,
        });
    });
};
