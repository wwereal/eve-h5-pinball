<script lang="ts" setup>
import { ref } from 'vue';

interface TransStyle {
    transformOrigin?: string;
    opacity?: string;
    transform?: string;
    transition: string;
}

interface Props {
    flyToTarget?: string;
    xMoveBezier?: string;
    yMoveStage1Bezier?: string;
    yMoveStage2Bezier?: string;
    lineMoveOffset?: number;
    rotate?: number;
    rotateDuration?: number;
    duration?: number;
    lineMoveDuration?: number;
    opacityDelay?: number;
    opacityDuration?: number;
}

const xController = ref<HTMLElement | null>(null);
const yController = ref<HTMLElement | null>(null);
const selfController = ref<HTMLElement | null>(null);
let moveStage = 0;

const emits = defineEmits<{
    (e: 'end'): void;
}>();

const props = withDefaults(defineProps<Props>(), {
    flyToTarget: '',
    // eslint-disable-next-line sonarjs/no-duplicate-string
    xMoveBezier: '0.4, 0, 1, 1',
    yMoveStage1Bezier: '0.1,0.6,0,0.6',
    yMoveStage2Bezier: '0, 0, 1, 1',
    lineMoveDuration: 500,
    lineMoveOffset: 34,
    rotateDuration: 300,
    duration: 900,
    opacityDelay: 700,
    rotate: 360,
    opacityDuration: 100,
});

function getDistance(self: HTMLElement, target: HTMLElement) {
    if (!(self != null && target != null)) {
        return { x: 0, y: 0 };
    }
    const targetInfo = target.getBoundingClientRect();
    const rootInfo = self.getBoundingClientRect();
    const x = targetInfo.x - rootInfo.x + (targetInfo.width - rootInfo.width) / 2;
    const y = rootInfo.y - targetInfo.y + (rootInfo.height - targetInfo.height) / 2;
    return {
        x,
        y,
    };
}

function getDelta() {
    const self = xController.value;
    const target = document.getElementById(props.flyToTarget);
    if (!self || !target) {
        return undefined;
    }
    return () => getDistance(self, target);
}

function setStyle(el: HTMLElement, style: TransStyle) {
    if (el != null) {
        const dom = el;
        dom.style.transformOrigin = style.transformOrigin ?? 'center';
        dom.style.opacity = style.opacity ?? '1';
        dom.style.transform = style.transform ?? 'none';
        dom.style.transition = style.transition;
    }
}

function setX(moveBezier: string, delta: number | undefined, duration: number) {
    const el = xController.value;

    if (el && delta) {
        setStyle(el, {
            transform: `translate(${delta}px, 0)`,
            transition: `transform ${duration}ms cubic-bezier(${moveBezier})`,
            opacity: '1',
        });
    }
}

function setY(moveBezier: string, delta: number | undefined, duration: number) {
    const el = yController.value;
    if (el && delta) {
        setStyle(el, {
            transform: `translate(0, ${0 - delta}px)`,
            transition: `transform ${duration}ms cubic-bezier(${moveBezier})`,
        });
    }
}

function setSelf() {
    const el = selfController.value;
    if (el) {
        setStyle(el, {
            transform: `rotateY(${props.rotate}deg)`,
            transition: `transform ${props.rotateDuration}ms linear, opacity ${props.opacityDuration}ms linear ${props.opacityDelay}ms`,
            opacity: '0',
        });
    }
}

function onTransitionEnd() {
    if (moveStage === 1) {
        const delta = getDelta();
        setX(props.xMoveBezier, delta?.().x, props.duration - props.lineMoveDuration);
        setY(props.yMoveStage2Bezier, delta?.().y, props.duration - props.lineMoveDuration);
    } else {
        emits('end');
    }
    moveStage++;
}

function boot() {
    moveStage++;
    setSelf();
    setY(props.yMoveStage1Bezier, props.lineMoveOffset, props.lineMoveDuration);
}
defineExpose({
    boot,
});
</script>

<template>
    <div v-if="!flyToTarget">
        <slot />
    </div>
    <div v-else ref="xController">
        <div ref="yController" @transitionend="onTransitionEnd">
            <div ref="selfController">
                <slot />
            </div>
        </div>
    </div>
</template>
