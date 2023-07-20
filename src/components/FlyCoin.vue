<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { px2rem } from '@/core.mobile';
import Pilot from './PilotContainer.vue';
import { trans414PxToCurrentPx } from '@/common/utils';

type Position = {
    left?: number;
    right?: number;
    top?: number;
    bottom: number;
};

type RemPosition = {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
};

type PilotType = {
    boot: () => void;
};

interface FlyCoinProps {
    count?: 1 | 2;
    flyToTarget: string;
    position?: Position;
    duration?: number;
    useRem?: boolean;
}

const emits = defineEmits<{
    (e: 'close'): void;
}>();

const props = withDefaults(defineProps<FlyCoinProps>(), {
    count: 1,
    position: () => ({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    }),
    useRem: true,
});

const getPosition = (position: Position) => {
    const transPosition: RemPosition = {};
    Object.keys(position).forEach((p) => {
        const key = p as keyof Position;
        const value = position[key];
        if (value != null && !Number.isNaN(value)) {
            transPosition[key] = props.useRem ? px2rem(value) : `${value}px`;
        }
    });
    return transPosition;
};

const pilot1Ref = ref<PilotType | null>(null);
const pilot2Ref = ref<PilotType | null>(null);
const coin1ImgRef = ref<HTMLImageElement | null>(null);
const coin2ImgRef = ref<HTMLImageElement | null>(null);

const coin1Style = computed(() => {
    const position = props.position;
    // 2个金币是金币1（左边金币）左移7dp
    if (props.count === 2) {
        const newPosition = {
            ...props.position,
            left: (props.position.left ?? 0) - trans414PxToCurrentPx(7),
        };
        return getPosition(newPosition);
    }
    return getPosition(position);
});

const coin2Style = computed(() => {
    // 2个金币是金币2（左边金币）右移7dp
    if (props.count === 2) {
        const newPosition = {
            ...props.position,
            left: (props.position.left ?? 0) + trans414PxToCurrentPx(7),
        };
        return getPosition(newPosition);
    }
    return {};
});

const opacityStyle = ref({ opacity: 0 });

let endCount = 0;
const onEnd = () => {
    if (++endCount === props.count) {
        emits('close');
    }
};

let timer: number | null = null;

onMounted(() => {
    if (coin1ImgRef.value) {
        coin1ImgRef.value.onload = () => {
            window.setTimeout(() => {
                pilot1Ref.value?.boot();

                if (props.count === 2) {
                    window.setTimeout(() => {
                        opacityStyle.value = {
                            opacity: 1,
                        };
                        pilot2Ref.value?.boot();
                    }, 200);
                }
                // 以防有些硬币动画结束后 没有抛出close导致没有销毁实例
                timer = window.setTimeout(() => {
                    emits('close');
                }, 5000);
            }, 10);
        };
    }
});

onBeforeUnmount(() => {
    if (timer) {
        clearTimeout(timer);
    }
});
</script>
<template>
    <div class="fly-coin-container">
        <Pilot
            ref="pilot1Ref"
            class="fly-coin"
            :fly-to-target="flyToTarget"
            :duration="duration"
            :style="coin1Style"
            @end="onEnd"
        >
            <img ref="coin1ImgRef" class="fly-coin-entity" src="../assets/icons/coin.png" />
        </Pilot>
        <Pilot
            v-if="count === 2"
            ref="pilot2Ref"
            :fly-to-target="flyToTarget"
            class="fly-coin fly-coin-2"
            :duration="duration"
            :style="coin2Style"
            @end="onEnd"
        >
            <img
                ref="coin2ImgRef"
                :style="opacityStyle"
                class="fly-coin-entity"
                src="../assets/icons/coin.png"
            />
        </Pilot>
    </div>
</template>
<style lang="scss" scoped>
.fly-coin {
    position: absolute;
    z-index: 10;
    top: 0;
    left: 0;
    width: 17px;
    height: 17px;
}
.fly-coin-entity {
    width: 17px;
    height: 17px;
}
</style>
