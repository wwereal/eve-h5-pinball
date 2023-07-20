import { createApp, defineAsyncComponent } from 'vue';
import { prefersReducedMotion } from '@/common';
import { ballType } from './ball';
import { CollisionType, type Collision, type Player } from './ball-engine';
import { offset, trans414PxToCurrentPx } from './utils';

const flyACoin = (props: any) => {
    if (props) {
        const mountNode = document.createElement('div')
        const flyCoinCom = defineAsyncComponent(() => import('@/components/FlyCoin.vue'))
        const app = createApp(flyCoinCom, {
            ...props,
            onClose: () => {
                app.unmount()
            }
        });
        app.mount(mountNode);
        document.body.appendChild(mountNode)
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

export const usePillarEffect = (player: Player, currentBallType: number) => {
    const collisionEffectHandler = (collisions: Collision[]) => {
        collisions.forEach((collision) => {
            if (collision.type === CollisionType.pillar) {
                const pos = getPillarPosition(collision.pillarId);
                console.log('getPillarPosition', pos);
                pos &&
                    !prefersReducedMotion &&
                    flyACoin({
                        position: {
                            top: pos.top,
                            left: pos.left,
                        },
                        useRem: false,
                        count: currentBallType === ballType.double ? 2 : 1,
                        flyToTarget: 'pinball-game-withdraw',
                    });
            }
        });
    };

    player.on('collision', collisionEffectHandler);
};


