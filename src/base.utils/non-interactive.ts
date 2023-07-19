import type { Ref } from 'vue';
import { onBeforeMount, onBeforeUnmount } from 'vue';

import { useDynamicInterval } from './interval';

export function useNonInteractive(callback: () => void, options: { interval: Ref<number> }) {
    const { pause, resume, restart } = useDynamicInterval(callback, {
        interval: options.interval,
    });

    onBeforeMount(() => {
        window.addEventListener('touchstart', restart, { capture: true });
    });

    onBeforeUnmount(() => {
        pause();
        window.removeEventListener('touchstart', restart, { capture: true });
    });

    return {
        restart,
        pause,
        resume,
    };
}
