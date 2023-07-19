<script lang="ts" setup>
import { loadImage } from '@/base.utils';
import { px2rem } from '@/core.mobile';
import { computed, onMounted, onUnmounted, ref, shallowRef, type Ref, type ShallowRef } from 'vue';
import ballImgSrc from '@/assets/icons/ball1.png';
import { globalConfig } from '@/lottery/ball-engine/config';
import { Engine } from '@/lottery/ball-engine/engine';
import type {
    BallConfig,
    BallRenderConfig,
    Collision,
    Frame,
    LaunchConfig,
    Output,
    PillarRenderConfig,
    TableConfig,
} from '@/lottery/ball-engine/model';
import { CollisionType, RoofShape } from '@/lottery/ball-engine/model';
import { Player } from '@/lottery/ball-engine/player';
import { runner } from '@/lottery/ball-engine/runner';
import Pillars from './PinballPillars.vue';
import Reward from './PinballReward.vue';
import Spring from './PinballSpring.vue';
interface PacketConfig {
    packetType: number; // 1 红色 2 金色
    text: string; // 红包上文案
    textType: number; // 1 金额 2 文案
}
interface Props {
    ballRenderConfig?: BallRenderConfig;
    ballConfig?: Partial<BallConfig>;
    tableConfig?: TableConfig;
    launchConfig?: LaunchConfig;
    pillarRenderConfig?: PillarRenderConfig;
    perspective?: number;
    rotateX?: number;
    fps?: number;
    isDebug?: boolean;
    playAnimation?: boolean;
    sectionInfo?: PacketConfig[];
}

const props = withDefaults(defineProps<Props>(), {
    fps: 60,
    isDebug: true,
    ballConfig: () => ({
        gravityScale: 0.3,
        collisionDecay: 0.6,
        radius: 12,
    }),
    ballRenderConfig: () => ({
        radius: 12,
        motionFrameCount: 8,
        motionOpacity: 0.2,
        motionConfig: {
            type: 'mirage',
            opacity: 0.7,
            decay: 0.7,
        },
    }),
    tableConfig: () => ({
        collisionZoneWidth: 360,
        viewHeight: 580,
        rewardHeight: 0,
        trackZoneWidth: 40,
        baffleWidth: 0,
        trackZoneHeight: 580,
        springHeight: 81,
        pillars: globalConfig.pillarsPosition.map((pos, idx) => ({ id: idx, position: pos, radius: 10 })),
        roofConfig: {
            roofShape: RoofShape.rectangle,
        },
    }),
    launchConfig: () => ({
        initSpeedScope: [13, 15],
        minDistanceRatio: 0.5,
        destinationIndex: 1,
        sectionCount: 5,
        sectionCollideColor: 'red',
    }),
    pillarRenderConfig: () => ({
        pillarColor: 'black',
        pillarCollisionColor: 'blue',
        pillars: [],
    }),
    perspective: 0,
    rotateX: 0,
    playAnimation: false,
});

const emit = defineEmits<{
    (e: 'start', launchType: 'success' | 'fail'): void;
    (e: 'finish', launchType: 'success' | 'fail'): void;
    (e: 'collision', collisions: Collision[]): void;
    (e: 'ready'): void;
    (e: 'error'): void;
    (e: 'find', output: Output): void;
}>();

const canvasRef = ref(null) as Ref<HTMLCanvasElement | null>;
const engine = new Engine({
    tableConfig: {
        collisionZoneWidth: props.tableConfig.collisionZoneWidth,
        viewHeight: props.tableConfig.viewHeight,
        rewardHeight: props.tableConfig?.rewardHeight,
        trackZoneWidth: props.tableConfig.trackZoneWidth,
        trackZoneHeight: props.tableConfig.trackZoneHeight,
        roofConfig: props.tableConfig.roofConfig,
        baffleWidth: props.tableConfig.baffleWidth,
        springHeight: props.tableConfig.springHeight,
        pillars: props.tableConfig.pillars,
    },

    defaultGravityScale: props.ballConfig.gravityScale,
    defaultCollisionDecay: props.ballConfig.collisionDecay,
    allowOverlap: false,
});

runner.setFPS(props.fps === 60 ? 60 : 30);
const player = new Player(
    engine,
    props.launchConfig,
    {
        defaultBallConfig: props.ballRenderConfig,
    },
    null,
    props.isDebug,
);
// TODO 这1个应该移动到对应的组件里去
const collideSectionIds = ref<number[]>([]);
const pillarsRef = ref<{
    onPillarHit: (id: number) => void;
    reset: () => void;
}>();
const sectionsWidth = computed(() => px2rem(props.tableConfig.collisionZoneWidth));
const containerStyle = computed(() => ({
    width: px2rem(
        props.tableConfig.collisionZoneWidth + props.tableConfig.baffleWidth + props.tableConfig.trackZoneWidth,
    ),
    'background-color': props.isDebug ? 'red' : 'transparent ',
//    'background-color': 'red'
}));
const separatorStyle = computed(() => ({
    bottom: '0',
    left: sectionsWidth.value,
    width: px2rem(props.tableConfig.baffleWidth || 1),
    height: px2rem(props.tableConfig.trackZoneHeight),
    background: 'rgba(0, 0, 0, 0.5)',
}));

// 重置每一次发射
const resetOneLaunchEffect = () => {
    pillarsRef.value?.reset();
    collideSectionIds.value = [];
};
const freePlay = () => loadBall({
    gravityScale: 0.1,
    collisionDecay: 0.6,
    radius: 12,
}, 2)
Promise.all([
    loadImage(new Image(), ballImgSrc).then((img) => {
        player.updateRenderConfig({
            defaultBallConfig: {
                ...player.renderConfig.defaultBallConfig,
                img,
            },
        });
    }),
]).then(() => {
    emit('ready');
    freePlay();
});

const rewardIndexRes = ref<number>();
const hitBaffle = ref(false);
player.on('collision', (collisions) => {
    emit('collision', collisions);
    collisions.forEach((collision) => {
        // 撞到柱子
        if (collision.type === CollisionType.pillar) {
            pillarsRef.value?.onPillarHit(collision.pillarId);
        }
        // 撞到三角挡板
        if (collision.type === CollisionType.baffle) {
            hitBaffle.value = true;
        }
    });
});
player.on('error', () => {
    emit('error');
});
player.on('find', (output) => {
    emit('find', output);
});
player.on('finish', (launchType) => {
    emit('finish', launchType);
    freePlay()
});
player.on('start', (launchType) => {
    rewardIndexRes.value = undefined;
    hitBaffle.value = false;
    emit('start', launchType);
});
player.on('reward', (rewardIndex) => {
    rewardIndexRes.value = rewardIndex;
    collideSectionIds.value.push(rewardIndex);
});

onMounted(() => {
    player.ctx = canvasRef.value?.getContext('2d');
});

onUnmounted(() => {
    player.destroy();
});

const debugFrame = shallowRef(undefined) as ShallowRef<undefined | Frame>;
const frameLength = computed(() => player.lastFrames.value?.length ?? 0);
const debug = (frameIndex = 0) => {
    debugFrame.value = player.debugFrame(frameIndex);
};
const resetAll = () => {
    resetOneLaunchEffect();
};
const loadBall = (
    newBallConfig: {
        radius: number;
        collisionDecay: number;
        gravityScale: number;
    },
    newDestinationIndex: number,
) => {
    player.loadBall(newBallConfig, newDestinationIndex, [0, 100]);
};

const startGame = () => {
    player.compressSpringTo(props.tableConfig.springHeight * props.launchConfig.minDistanceRatio);
    setTimeout(() => {
        player.releaseSpring();
    }, 200);
};

const canvasStyle = computed(() => ({
    height: px2rem(engine.config.tableConfig.viewHeight),
    width: px2rem(
        engine.config.tableConfig.collisionZoneWidth +
            engine.config.tableConfig.baffleWidth +
            engine.config.tableConfig.trackZoneWidth,
    ),
}));

const baffleStyle = computed(() => ({
    right: 0,
    bottom: px2rem(props.tableConfig.trackZoneHeight - 23),
}));

const playerState = computed(() => player.state.value);

const compressLength = ref(0);
player.on('compress', (length) => {
    compressLength.value = length;
});

defineExpose({
    // TODO 应该只暴露 player 就好了
    startGame,
    resetAll,
    loadBall,
    debug,
    debugFrame,
    frameLength,
    player,
});
</script>

<template>
    <div class="pinball-render-container" :style="containerStyle">
        <canvas
            ref="canvasRef"
            class="pinball-container__canvas"
            :width="
                (engine.config.tableConfig.collisionZoneWidth +
                    engine.config.tableConfig.baffleWidth +
                    engine.config.tableConfig.trackZoneWidth) *
                2
            "
            :height="engine.config.tableConfig.viewHeight * 2"
            :style="canvasStyle"
        ></canvas>
        <Pillars
            ref="pillarsRef"
            :pillars="props.pillarRenderConfig.pillars"
            :player-state="playerState"
            :pillar-collision-color="props.pillarRenderConfig.pillarCollisionColor"
            :pillar-color="props.pillarRenderConfig.pillarColor"
            :pillar-image-hit-src="props.pillarRenderConfig.pillarHitImageSrc"
            :pillar-image-src="props.pillarRenderConfig.pillarImageSrc"
        />
        <div v-if="isDebug" class="pinball-render-container__separator" :style="separatorStyle"></div>
        <Reward
            :section-count="props.launchConfig.sectionCount"
            :reward-index="rewardIndexRes"
            :width="sectionsWidth"
            :player-state="playerState"
            :play-animation="playAnimation"
            :section-info="sectionInfo"
        ></Reward>
        <div class="pinball-render-container__baffle" :class="{ animation: hitBaffle }" :style="baffleStyle" />
        <Spring
            :player-state="playerState"
            :play-animation="playAnimation"
            :compress-length="compressLength"
            :spring-info="player.getSpringInfo()"
        ></Spring>
    </div>
</template>

<style lang="scss" scoped>
.pinball-render-container {
    background-size: cover;
    padding: 0;
    margin: 0;
    position: absolute;
    bottom: 74px;
    right: 51px;

    &__separator {
        position: absolute;
    }
    &__baffle {
        position: absolute;
        width: 28px;
        height: 23px;
        background-image: url('../assets/baffle.png');
        background-size: cover;
        background-position: 0 0;
        &.animation {
            animation: 100ms hit steps(2, jump-none);
        }

        @keyframes hit {
            from {
                background-position: 28px 0;
            }
            to {
                background-position: 0 0;
            }
        }
    }
}

.pinball-container__canvas {
    display: block;
}
</style>