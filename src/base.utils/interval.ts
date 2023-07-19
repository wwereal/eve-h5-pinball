import { type Ref, onBeforeUnmount, ref, watch } from 'vue';

export interface DynamicIntervalOptions {
    /**
     * 如果 interval 为 0，会默认暂停
     */
    interval: Ref<number>;
    /**
     * 设置 CD 之后，在连续的手动调用之间会有 CD
     */
    coolingDown?: number;
}

export function useDynamicInterval(cb: () => void | Promise<void>, options: DynamicIntervalOptions) {
    const { interval, coolingDown } = options;

    const timer = ref<number | undefined>();
    const polling = ref(true);
    let lastPollingTime = 0;


    function clearTimerIfNecessary() {
        if (timer.value) {
            window.clearTimeout(timer.value);
            timer.value = undefined;
        }
    }

    function pause() {
        polling.value = false;
        clearTimerIfNecessary();
    }

    async function pollNow() {
        if (coolingDown && Date.now() - lastPollingTime < coolingDown) {
            return;
        }

        lastPollingTime = Date.now();
        clearTimerIfNecessary();

        if (polling.value) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            startScheduler();
        }
    }

    function startScheduler() {
        clearTimerIfNecessary();

        timer.value = window.setTimeout(pollNow, interval.value);
    }

    function resume() {
        if (!timer.value) {
            polling.value = true;
            startScheduler();
        }
    }

    function trigger() {
        return pollNow();
    }

    onBeforeUnmount(() => {
        clearTimerIfNecessary();
    });

    // 当 interval 改变的时候，重新开始计时
    // 如果 internal 为 0，那么停止轮询
    watch(
        interval,
        (value) => {
            if (value) {
                if (polling.value) {
                    startScheduler();
                }
            } else {
                clearTimerIfNecessary();
            }
        },
        {
            immediate: true,
        },
    );

    return {
        pause,
        resume,
        restart: startScheduler,
        trigger,
        polling,
    };
}
