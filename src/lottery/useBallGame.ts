import { loadImage } from '@/base.utils';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, type Ref, type ShallowRef } from 'vue';

import collideBallImageSrc from '@/assets/icons/ball1.png';
import commonBallImageSrc from '@/assets/icons/ball2.png';
import doubleBallImageSrc from '@/assets/icons/ball3.png';


import { CollisionType, Player, type Collision } from './ball-engine';

export enum BallType {
    common = 1,
    collision,
    double,
}

export const ballTypeToLoggerBallType = (ballType: BallType) => {
    switch (ballType) {
        case BallType.common:
            return 'NORMAL';
        case BallType.collision:
            return 'HIT';
        case BallType.double:
            return 'DOUBLE';
        default:
            return 'NORMAL';
    }
};


const ballGameRef = shallowRef(null) as ShallowRef<Player | null>;
const commonImageRef = ref<HTMLImageElement | null>(null);
const collideImageRef = ref<HTMLImageElement | null>(null);
const doubleImageRef = ref<HTMLImageElement | null>(null);
const resetGameStatus = shallowRef(() => {});
const lightBoardClass = ref('');

const startLoadImage = () => {
    loadImage(new Image(), commonBallImageSrc).then((img) => {
        commonImageRef.value = img;
    });
    loadImage(new Image(), collideBallImageSrc).then((img) => {
        collideImageRef.value = img;
    });
    loadImage(new Image(), doubleBallImageSrc).then((img) => {
        doubleImageRef.value = img;
    });
};

startLoadImage();

let touchY = 0;
let isTouching = false;

// eslint-disable-next-line sonarjs/cognitive-complexity
export const useBallGame = (playerRef?: Ref<{ player: Player; resetAll: () => void } | null>) => {
    const gameTouchStart = (e: TouchEvent) => {
        if (ballGameRef.value?.getPlayerState().startsWith('playing')) {
            return;
        }
        touchY = e.touches[0]?.pageY ?? 0;
        isTouching = true;
    };

    const gameTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (ballGameRef.value?.getPlayerState().startsWith('playing') || !isTouching) {
            return;
        }
        const newTouchY = e.touches[0]?.pageY ?? 0;
        const dy = newTouchY - touchY;
        touchY = newTouchY;
        ballGameRef.value?.compressSpring(dy);
    };

    const gameTouchEnd = () => {
        // 避免外部的touch事件触发touchend，加个isTouching判断，如果是由canvas触发的touch才进行release
        if (isTouching) {
            touchY = 0;
            isTouching = false;
            ballGameRef.value?.releaseSpring();
        }
    };

    const handleLightRewarding = () => {
        lightBoardClass.value = 'rewarding';
    };

    const onLightingEnd = () => {
        lightBoardClass.value = '';
    };

    const onPillarCollide = (collisions: Collision[]) => {
        if (collisions.find((collision) => collision.type === CollisionType.pillar)) {
            if (!lightBoardClass.value) {
                lightBoardClass.value = 'colliding';
            }
        }
    };

    if (playerRef) {
        const gameStatus = computed(() => playerRef.value?.player.state.value ?? 'static');
        let compressBeepSource: AudioBufferSourceNode | undefined;

        watch(playerRef, (val) => {
            if (val) {
                ballGameRef.value = val.player;
                resetGameStatus.value = val.resetAll;
                val.player.on('collision', (collisions) => {
                    // 音效
                    onPillarCollide(collisions);
                });
                val.player.on('start', (launchType) => {
                    if (launchType === 'success') {
                        // beep(launchMusic);
                    }
                });
            }
        });

        watch(gameStatus, (val, oldVal) => {
            if (val === 'compressing') {
                // beep(compressMusic)?.then((source) => {
                //     if (compressBeepSource) {
                //         try {
                //             compressBeepSource?.stop();
                //         } catch (e) {}
                //     }
                //     compressBeepSource = source;
                // });
            } else if (oldVal === 'compressing') {
                try {
                    compressBeepSource?.stop();
                } catch (e) {}
            } else if (val === 'playing-loading' && oldVal === 'reward') {
                handleLightRewarding();
            }
        });

        onMounted(() => {
            window.addEventListener('touchend', gameTouchEnd);
        });

        onBeforeUnmount(() => {
            window.removeEventListener('touchend', gameTouchEnd);
        });
    }

    return {
        ballGameRef,
        lightBoardClass,
        gameTouchStart,
        gameTouchMove,
        gameTouchEnd,
        onLightingEnd,
    };
};
