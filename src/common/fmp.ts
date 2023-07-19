import type Router from 'vue-router';
import { nextTick } from 'vue';
import { fmp } from './logger';
import { hideLoadingPage } from './utils/yoda';

let hasSentFMP = false;

const FMP_MAP: Record<string, Set<string> | undefined> = {};

export async function trackFMP(router: Router, url: string) {
    const routeName = router.currentRoute.name;
    if (!routeName) {
        return;
    }
    const fmpUrls = router.currentRoute.meta?.FMP_URLS as string[] | undefined;
    // 没有配置 fmp urls, 不走后面的上报、关闭 loading 逻辑
    if (!fmpUrls || fmpUrls.length === 0) {
        return;
    }
    const currentFMPInfo = FMP_MAP[routeName] ?? (FMP_MAP[routeName] = new Set(fmpUrls));
    currentFMPInfo.delete(url.split('?')[0] ?? '');
    if (!currentFMPInfo.size) {
        // 重置接口列表，之后通过路由再次进入页面时，重新判断主接口请求状态
        FMP_MAP[routeName] = new Set(fmpUrls);
        if (!router.currentRoute.meta?.MANUAL_HIDE_LOADING) {
            setTimeout(hideLoadingPage, 0);
        }
        if (hasSentFMP) {
            return;
        }
        await nextTick();
        fmp();
        hasSentFMP = true;
        // eslint-disable-next-line sonar/deprecation
        console.info('FMP Loaded', Date.now() - performance.timing.navigationStart);
    }
}
