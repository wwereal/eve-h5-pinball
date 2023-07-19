<script lang="ts" setup>
import { px2rem } from '@/core.mobile';
import { computed, ref } from 'vue';
import { prefersReducedMotion } from '@/common';
import type { PillarRender, PlayerState } from '@/modules/lottery/common/ball-engine';

interface Props {
    pillarColor?: string;
    pillarCollisionColor?: string;
    pillars: PillarRender[];
    pillarImageSrc?: string;
    pillarImageHitSrc?: string;
    playerState?: PlayerState;
}

const PillarContainerWidth = 72;

const props = withDefaults(defineProps<Props>(), {
    pillarColor: 'black',
    pillarCollisionColor: 'blue',
});

const hitPillarIds = ref<number[]>([]);

const pillarsStateClass = computed(() => {
    if (props.playerState === 'static') {
        return 'pillar-idle';
    }
    if (props.playerState === 'reward') {
        return 'pillar-rewarding';
    }
    return '';
});

const pillarStyle = (pillar: PillarRender) => {
    return {
        width: px2rem(pillar.radius * 2),
        height: px2rem(pillar.radius * 2),
        top: px2rem(PillarContainerWidth / 2 - pillar.radius),
        left: px2rem(PillarContainerWidth / 2 - pillar.radius),
    };
};

const pillarContainerStyle = (pillar: PillarRender) => {
    return {
        top: px2rem(pillar.position[1] - PillarContainerWidth / 2),
        left: px2rem(pillar.position[0] - PillarContainerWidth / 2),
    };
};

const pillarHitClass = computed(() => {
    return (id: number) => (hitPillarIds.value.includes(id) ? 'highlight' : '');
});

const onPillarAnimationEnd = (event: AnimationEvent, id: number) => {
    if (event.animationName.includes('pillar-highlight')) {
        const index = hitPillarIds.value.findIndex((val) => val === id);
        hitPillarIds.value.splice(index, 1);
    }
};

const onPillarHit = (id: number) => {
    !hitPillarIds.value.includes(id) && hitPillarIds.value.push(id);
};

const reset = () => {
    hitPillarIds.value = [];
};

defineExpose({
    onPillarHit,
    reset,
});
</script>

<template>
    <div class="pillars-container">
        <div
            v-for="pillar in pillars"
            :key="pillar.id"
            :class="['pillar-container']"
            :style="pillarContainerStyle(pillar)"
        >
            <div
                :id="`pillar-${pillar.id}`"
                class="pillars-container__pillar"
                :class="[
                    pillarsStateClass,
                    `pillars-container__pillar-group${pillar.group}`,
                    pillarHitClass(pillar.id),
                ]"
                :style="pillarStyle(pillar)"
                @animationend="(e) => onPillarAnimationEnd(e, pillar.id)"
            />
            <div v-if="!prefersReducedMotion" :class="['pillar-colliding', pillarHitClass(pillar.id)]" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.pillars-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    .pillar-container {
        width: 72px;
        height: 72px;
        position: absolute;
        background-image: url('../assets/icons/pillar-shadow.png');
        background-size: 40px 40px;
        background-repeat: no-repeat;
        background-position: center;
    }

    &__pillar {
        $normal-pillar: 0 0;
        $hit-pillar: 18px 0;

        border-radius: 50%;
        position: absolute;
        background-image: url('../assets/icons/pillar.png');
        background-size: cover;
        background-position: $normal-pillar;
        &.highlight {
            animation: pillar-highlight 400ms step-start both;
            @keyframes pillar-highlight {
                0% {
                    background-position: $hit-pillar;
                }
                99.99% {
                    background-position: $hit-pillar;
                }
                100% {
                    background-position: $normal-pillar;
                }
            }
        }
        &.pillar-rewarding {
            &.pillars-container__pillar-group1,
            &.pillars-container__pillar-group3,
            &.pillars-container__pillar-group5 {
                animation: pillar-rewarding-group1 0.6s step-start;
                animation-iteration-count: 5;
                @keyframes pillar-rewarding-group1 {
                    0% {
                        background-position: $hit-pillar;
                    }
                    50% {
                        background-position: $normal-pillar;
                    }
                    100% {
                        background-position: $hit-pillar;
                    }
                }
            }
            &.pillars-container__pillar-group2,
            &.pillars-container__pillar-group4,
            &.pillars-container__pillar-group6 {
                animation: pillar-rewarding-group2 0.6s step-start;
                animation-iteration-count: 5;
                @keyframes pillar-rewarding-group2 {
                    0% {
                        background-position: $normal-pillar;
                    }
                    50% {
                        background-position: $hit-pillar;
                    }
                    100% {
                        background-position: $normal-pillar;
                    }
                }
            }
        }
        &.pillar-idle {
            &.pillars-container__pillar-group1 {
                animation: pillar-group1 3s step-start both infinite;
                @keyframes pillar-group1 {
                    0% {
                        background-position: $normal-pillar;
                    }
                    3.33% {
                        background-position: $hit-pillar;
                    }
                    100% {
                        background-position: $normal-pillar;
                    }
                }
            }
            &.pillars-container__pillar-group2 {
                animation: pillar-group2 3s step-start both infinite;
                @keyframes pillar-group2 {
                    0% {
                        background-position: $normal-pillar;
                    }
                    3.33% {
                        background-position: $normal-pillar;
                    }
                    6.67% {
                        background-position: $hit-pillar;
                    }
                    100% {
                        background-position: $normal-pillar;
                    }
                }
            }
            &.pillars-container__pillar-group3 {
                animation: pillar-group3 3s step-start both infinite;
                @keyframes pillar-group3 {
                    0% {
                        background-position: $normal-pillar;
                    }
                    6.67% {
                        background-position: $normal-pillar;
                    }
                    10% {
                        background-position: $hit-pillar;
                    }
                    100% {
                        background-position: $normal-pillar;
                    }
                }
            }
            &.pillars-container__pillar-group4 {
                animation: pillar-group4 3s step-start both infinite;
                @keyframes pillar-group4 {
                    0% {
                        background-position: $normal-pillar;
                    }
                    10% {
                        background-position: $normal-pillar;
                    }
                    13.32% {
                        background-position: $hit-pillar;
                    }
                    100% {
                        background-position: $normal-pillar;
                    }
                }
            }
            &.pillars-container__pillar-group5 {
                animation: pillar-group5 3s step-start both infinite;
                @keyframes pillar-group5 {
                    0% {
                        background-position: $normal-pillar;
                    }
                    13.32% {
                        background-position: $normal-pillar;
                    }
                    16.65% {
                        background-position: $hit-pillar;
                    }
                    100% {
                        background-position: $normal-pillar;
                    }
                }
            }
            &.pillars-container__pillar-group6 {
                animation: pillar-group6 3s step-start both infinite;
                @keyframes pillar-group6 {
                    0% {
                        background-position: $normal-pillar;
                    }
                    16.65% {
                        background-position: $normal-pillar;
                    }
                    19.98% {
                        background-position: $hit-pillar;
                    }
                    100% {
                        background-position: $normal-pillar;
                    }
                }
            }
        }
    }

    .pillar-colliding {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        background-size: contain;
        &.highlight {
            background-image: url('../assets/pillar-collide.png');
        }
    }
}
</style>
@/modules/lottery/common/ball-engine