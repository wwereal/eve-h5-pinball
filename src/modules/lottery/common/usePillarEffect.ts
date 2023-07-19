import { createVueComponent } from '@pet/23-eve.play-queue/utils';
import { getCurrentInstance } from 'vue';
import type { ComputedRef } from 'vue/types';
import { prefersReducedMotion } from '@/common';
import { ballType, type BallType } from './ball';
import { CollisionType, type Collision, type Player } from './ball-engine';
import { offset, trans414PxToCurrentPx } from './utils';

const flyACoin = (props: any) => {
    if (props) {
        const instance = createVueComponent(
            getCurrentInstance()?.proxy,
            () => import('../components/fly-coin/FlyCoin.vue'),
            props,
            {
                close: () => {
                    instance.$destroy();
                    instance.$el.remove();
                },
            },
        );
        const container = document.querySelector('.app-wrapper.pinball');
        (container ?? document.body).appendChild(instance.$el);
    }
};

const getPillarPosition = (id: number) => {
    const pillarElement = document.getElementById(`pillar-${id}`);
    const pinballElement = document.querySelector('.pinball');
    if (pillarElement && pinballElement) {
        const pos = pillarElement.getBoundingClientRect();
        // 活动页最宽为500px，要适配下宽屏
        return {
            top: pos.top - trans414PxToCurrentPx(16),
            left: pos.left - offset,
        };
    }
};

export const usePillarEffect = (player: Player, currentBallType: ComputedRef<BallType | undefined>) => {
    const collisionEffectHandler = (collisions: Collision[]) => {
        collisions.forEach((collision) => {
            if (collision.type === CollisionType.pillar) {
                const pos = getPillarPosition(collision.pillarId);
                pos &&
                    !prefersReducedMotion &&
                    flyACoin({
                        position: {
                            top: pos.top,
                            left: pos.left,
                        },
                        useRem: false,
                        count: currentBallType.value === ballType.double ? 2 : 1,
                        flyToTarget: 'pinball-game-withdraw',
                    });
            }
        });
    };

    player.on('collision', collisionEffectHandler);
};
