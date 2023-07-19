import { computed } from 'vue';
import type { Ref, ComputedRef } from 'vue/types';
import { useServerTimeNow } from '@pet/base.utils';

const unitSecond = 1000;
const unitMinute = 60 * unitSecond;
const unitHour = 60 * unitMinute;
const unitDay = 24 * unitHour;

export enum CountDownStatus {
    COUNTING,
    DONE,
}

export const useCountdown = (targetTime: Ref<number> | ComputedRef<number>, displayDay?: boolean) => {
    const { now } = useServerTimeNow();

    const countdownStatus = computed(() =>
        targetTime.value > now.value.valueOf() ? CountDownStatus.COUNTING : CountDownStatus.DONE,
    );

    const timeState = computed(() => {
        const restSec = Math.ceil((targetTime.value - now.value.valueOf()) / 1000) * 1000;
        if (restSec < 0) return { d: '00', h: '00', m: '00', s: '00' };

        const day = Math.floor(restSec / unitDay);
        let hour = Math.floor((restSec / unitHour) % 24);
        if (!displayDay) hour += day * 24;
        const displayHour = hour > 99 ? '99' : hour;

        return {
            d: `${day}`.padStart(2, '0'),
            h: `${displayHour}`.padStart(2, '0'),
            m: `${Math.floor((restSec / unitMinute) % 60)}`.padStart(2, '0'),
            s: `${Math.floor((restSec / 1000) % 60)}`.padStart(2, '0'),
        };
    });

    return { timeState, countdownStatus };
};
