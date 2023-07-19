import { immersiveShare as rawShare, getShareLink, isShareError } from '@ks-share/share';
import type { ShareOptions } from '@ks-share/share/types/types';
import { computed, type Ref, ref, watch } from 'vue';
import { useRoute } from 'vue-router/composables';
import type { Dictionary } from 'vue-router/types/router';
import { invoke } from '@yoda/bridge';
import { radarCustomEvent } from '@/common/logger';
import { SHARE_QR_STATE } from './constants';
import { generateQRDataURL } from './qr';
import { getUserId } from './utils';

// 中台保留字段：https://docs.corp.kuaishou.com/k/home/VHHgAA-GxraU/fcACYAqVirTB7OIhiJ7JZZPcd#section=h.erufkt5m5lgh
// string类型还可以缩小到字符串联合类型，不清楚哪些是可选字段
interface DefaultPlaceholder {
    url: string;
    shareObjectId: number;
    shareId: number;
    fid: number;
    appName: string;
    shareUserName: string;
    shareUserHead: string;
}
interface DefaultQuery {
    cc: string;
    kpn: string;
    subBiz: string;
    fid: number;
    shareMethod: string;
    shareMode: string;
    shareId: number;
    shareObjectId: number;
    kpf?: string;
    originShareId: number;
    followRefer: string;
    shareUrlOpened: string;
    shareToken: string; // 口令
    shareResourceType: string;
    springPosterTemplateId: number;
    timestamp: number;
    source: string;
}

// 上面的这些中台保留字段，在业务透传参数时要避开这些字段
type DefaultKey = keyof DefaultPlaceholder | keyof DefaultQuery;
type ShareParamsPlaceholder<T extends string> = {
    [key in T]: key extends DefaultKey ? never : string;
};
interface ShareParams<T extends string> {
    subBiz: string;
    placeholder?: ShareParamsPlaceholder<T>;
    logExt?: Record<string, string>;
}

function fillShareParams(params: ShareParams<string>) {
    const userId = getUserId();
    if (!userId) {
        throw new Error('get user id error');
    }

    const filledParams = {
        ...params,
        shareObjectId: userId,
        placeholder: params.placeholder ?? {},
        logExt: params.logExt ?? {},
    };

    return filledParams;
}

async function share<T extends string>(params: ShareParams<T>, options?: ShareOptions) {
    const shareParams = fillShareParams(params);

    try {
        await rawShare(shareParams, options);
    } catch (error) {
        // 上报失败
        if (isShareError(error)) {
            radarCustomEvent({
                name: 'share-result',
                event_type: 'failed',
                result_type: `${error.code}`,
                extra_info: JSON.stringify({ context: error.context, message: error.message }),
            });
        }
    }
}

function getBackflowInfo() {
    const route = useRoute();

    let isBackflow = false;
    let placeholder: Dictionary<string | (string | null)[]> | undefined;
    const subBiz = route.query?.subBiz;
    if (typeof subBiz === 'string' && subBiz !== '') {
        isBackflow = true;
        placeholder = route.query;
    }

    return {
        isBackflow,
        placeholder,
    };
}

type ValueOf<T> = T[keyof T];
function useShareQR<T extends string>(params: Ref<ShareParams<T> | undefined>, size = 132) {
    const shareParams = computed(() => params.value && fillShareParams(params.value));
    const shareOptions = computed(() => {
        return {
            logExt: shareParams.value?.logExt,
            timeout: 10 * 1000,
        };
    });

    const qrDataURL = ref<string>();
    const state = ref<ValueOf<typeof SHARE_QR_STATE>>(SHARE_QR_STATE.LOADING);

    async function loadQRDataURL() {
        try {
            if (shareParams.value) {
                state.value = SHARE_QR_STATE.LOADING;
                const shareLink = await getShareLink(shareParams.value, shareOptions.value);
                qrDataURL.value = await generateQRDataURL(shareLink, size);
                state.value = SHARE_QR_STATE.SUCCESS;
            }
        } catch (err) {
            state.value = SHARE_QR_STATE.FAIL;
            if (isShareError(err)) {
                // 这里的错误码比较多，目前后端也没有统一整理，后面遇上了挨个看吧。
                const { context } = err;
            }
        }
    }

    watch(
        params,
        () => {
            loadQRDataURL();
        },
        {
            immediate: true,
            deep: true,
        },
    );

    return {
        qrDataURL,
        state,
        refetchQR: loadQRDataURL,
    };
}

async function prefetchImageToDisk(urls: string[]) {
    try {
        await invoke('social.prefetchImageToDisk', { urls });
    } catch (error) {
        if (isShareError(error)) {
            radarCustomEvent({
                name: 'share-poster',
                event_type: 'prefetch',
                result_type: 'error',
                extra_info: JSON.stringify({ context: error.context, message: error.message }),
            });
        }
    }
}

export { share, getBackflowInfo, useShareQR, prefetchImageToDisk, SHARE_QR_STATE };
export type { ShareParams, ShareParamsPlaceholder };
export * from './constants';
