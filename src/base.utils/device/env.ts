export const isInBrowser = typeof window !== 'undefined';

const KWAI_APP_TOKENS = ['kwai', 'ksthanos', 'ksnebula', 'ksgzone', 'livemate'];
const YODA_APP_TOKENS = ['yoda'];
export function useYodaBridge(userAgent: string) {
    return [...YODA_APP_TOKENS, ...KWAI_APP_TOKENS].some((token) => userAgent.toLowerCase().includes(token));
}

const KS_APP_LIST = ['Yoda', 'Kwai', 'Kwai_Lite', 'Kwai_Pro', 'ksthanos', 'ksNebula', 'ksnebula'];

export function isInWebview(userAgent = navigator.userAgent) {
    return KS_APP_LIST.some((k) => userAgent.toLowerCase().includes(k.toLowerCase()));
}

export function isInIOS(userAgent = navigator.userAgent) {
    return /iPhone|iPad|iPod/i.test(userAgent);
}

export function isInNebula(userAgent = navigator.userAgent) {
    return /ksNebula/i.test(userAgent);
}
const ua = navigator.userAgent;

// TODO这货后面尽可能使用uaParser的信息使用
export function isIOS() {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    return !!/\(i[^;]+;( U;)? CPU.+Mac OS X/.exec(ua);
}

// TODO这货后面尽可能使用uaParser的信息使用
export function isAndroid() {
    return ua.includes('Android') || ua.includes('Adr');
}

// 用cookie来判断isInKwai会包含isInNebula
export function isInKwai() {
    return /(Kwai(_\w+)?|ksthanos)\//i.test(ua);
}

export function isInEnterpriseWeChat() {
    // 企业微信
    return / wxwork\//i.test(ua);
}

export function isInWeChat() {
    return /MicroMessenger/i.test(ua) && !isInEnterpriseWeChat();
}

export function isInQQ() {
    return / QQ\//i.test(ua);
}

export function isInQzone() {
    return /Qzone\//i.test(ua);
}

export function isInAndroidWeChat() {
    return isAndroid() && isInWeChat();
}

export function isInIOSWeChat() {
    return isIOS() && isInWeChat();
}

export function isInIOSQQ() {
    return isIOS() && isInQQ();
}

export function isInAlipay() {
    return /alipay/i.test(ua);
}

export function isInAndroidAlipay() {
    return isAndroid() && isInAlipay();
}

export function isInWeibo() {
    return /Weibo/i.test(ua);
}

export function isInBaidu() {
    // 百度手机客户端
    return / baiduboxapp\//i.test(ua);
}

export function isInUC() {
    // UC浏览器
    return / UCBrowser\//i.test(ua);
}

export function getBrowserDesc() {
    if (isInQQ()) {
        return 'qq';
    }
    if (isInWeChat()) {
        return 'wechat';
    }
    if (isInQzone()) {
        return 'qzone';
    }
    if (isInWeibo()) {
        return 'weibo';
    }
    if (isInBaidu()) {
        return 'baidu';
    }
    if (isInUC()) {
        return 'uc';
    }
    if (isIOS()) {
        return 'ios';
    }
    if (isAndroid()) {
        return 'android';
    }
    return '';
}

export function getKpf() {
    if (isAndroid()) {
        return isInNebula() || isInKwai() ? 'ANDROID_PHONE_H5' : 'OUTSIDE_ANDROID_H5';
    }
    if (isIOS()) {
        return isInNebula() || isInKwai() ? 'IPHONE_H5' : 'OUTSIDE_IOS_H5';
    }
    return 'UNKNOWN_PLATFORM';
}

// 获取 ios 版本
export function getIOSVersion() {
    if (!isIOS()) {
        return false;
    }
    const match = /OS (\d+)_(\d+)_?(\d+)?/.exec(ua);
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!match || match.length < 3) {
        return false;
    }
    const version = parseFloat(String(parseInt(match[1]!, 10) + 0.1 * +match[2]!));
    if (version > 0) {
        return version;
    }
    return false;
}

export function getKpn() {
    return isInNebula() ? 'NEBULA' : 'KUAISHOU';
}

export function compareVersion(a: string, b: string) {
    let v1 = a.split('.').map((i) => +i);
    let v2 = b.split('.').map((i) => +i);
    const maxLen = Math.max(v1.length, v2.length);
    // 补零
    v1 = v1.concat(new Array(maxLen - v1.length).fill(0)).map((item) => Number(item));
    v2 = v2.concat(new Array(maxLen - v2.length).fill(0)).map((item) => Number(item));

    for (let i = 0; i < maxLen; i++) {
        if (v1[i]! < v2[i]!) {
            return 'lt';
        }
        if (v1[i]! > v2[i]!) {
            return 'gt';
        }
    }
    console.log(999);
    return 'eq';
}
