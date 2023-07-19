import { useRoute, useRouter } from 'vue-router';
import { isInWebview } from './device';

export { useRoute, useRouter };

export function useRouterBack() {
    const router = useRouter();
    return function back() {
        if (isInWebview()) {
            // 新开webview的state不为空，所以通过改写router的方式注入useRouterPush标记
            if (window.location.href.includes('useRouterPush')) {
                router.back();
            } else {
                
            }
        } else {
            router.back();
        }
    };
}
