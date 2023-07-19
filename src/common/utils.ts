/*
 * 给定一个金额数值，把它转化成以元为单位的字符串形式
 * val 金额（分）
 * trimTrailingZeros 是否截取末尾的零
 * return 金额（元）
 */
export function fenToYuan(val: number | string, trimTrailingZeros?: boolean) {
    if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
        return '';
    }
    let yuanVal = (val / 100).toFixed(2);
    if (trimTrailingZeros && yuanVal.endsWith('0')) {
        yuanVal = yuanVal.slice(0, -1);
        if (yuanVal.endsWith('0')) {
            yuanVal = yuanVal.slice(0, -2);
        }
    }
    return yuanVal;
}

/**
 * 传入一个url地址，返回searchObject
 * @param search
 * @returns
 */
export const parseSearch = (search = '') => {
    if (!search) {
        return {};
    }
    let targetStr = search;
    if (targetStr.includes('?')) {
        targetStr = search.substring(1);
    }

    return targetStr.split('&').reduce((pre: Record<string, string>, str) => {
        if (str && str.indexOf('=') > 0) {
            const [k, v] = str.split('=');
            // WARN: 不考虑参数重复, 后者覆盖前者
            // eslint-disable-next-line no-param-reassign
            pre[k!] = decodeURIComponent(v ?? '');
        }

        return pre;
    }, {});
};

/**
 * 传入encode后的直播间内H5页面地址，decode出H5链接
 * @param search
 * @returns
 */
export const parseKwaiLiveUrl = (url = '') => {
    if (!url) {
        return '';
    }
    const decodedUrl = decodeURIComponent(decodeURIComponent(url));
    const targetUrl = decodedUrl.split('url=')[1] ?? '';
    return targetUrl;
};
