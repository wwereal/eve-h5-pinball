import { prefersReducedMotion } from '@/common';
import type { BallMotionConfig, BallRenderConfig, LaunchConfig, PillarRender, Range, TableConfig } from './ball-engine';

export const pillars: PillarRender[] = [
    { id: 0, position: [61.5, 81], radius: 9, group: 1 },
    { id: 1, position: [108.5, 81], radius: 9, group: 2 },
    { id: 2, position: [155.5, 81], radius: 9, group: 3 },
    { id: 3, position: [202.5, 81], radius: 9, group: 4 },
    { id: 4, position: [38, 128], radius: 9, group: 1 },
    { id: 5, position: [85, 128], radius: 9, group: 2 },
    { id: 6, position: [132, 128], radius: 9, group: 3 },
    { id: 7, position: [179, 128], radius: 9, group: 4 },
    { id: 8, position: [226, 128], radius: 9, group: 5 },
    { id: 9, position: [61.5, 175], radius: 9, group: 2 },
    { id: 10, position: [108.5, 175], radius: 9, group: 3 },
    { id: 11, position: [155.5, 175], radius: 9, group: 4 },
    { id: 12, position: [202.5, 175], radius: 9, group: 5 },
    { id: 13, position: [38, 221], radius: 9, group: 2 },
    { id: 14, position: [85, 221], radius: 9, group: 3 },
    { id: 15, position: [132, 221], radius: 9, group: 4 },
    { id: 16, position: [179, 221], radius: 9, group: 5 },
    { id: 17, position: [226, 221], radius: 9, group: 6 },
];

export const tableConfig: TableConfig = {
    rewardHeight: 44,
    viewHeight: 305,
    collisionZoneWidth: 264,
    pillars: pillars.map((pillar) => ({
        id: pillar.id,
        position: pillar.position,
        radius: pillar.radius,
    })),
    springHeight: 96,
    roofConfig: { roofShape: 3, ellipseCenter: [155, 52] },
    trackZoneWidth: 40,
    baffleWidth: 6,
    trackZoneHeight: 287,
};

export const tail = {
    type: 'tail',
    color: 'white',
    width: 3,
    shadow: [
        {
            blur: 4,
            spread: 5,
            color: 'rgba(168, 171, 254, 0.9)',
        },
        {
            blur: 2,
            spread: 2,
            color: 'rgba(149, 251, 255, 1)',
        },
    ],
}

export const mirage = {
    type: 'mirage',
    opacity: 0.7,
    decay: 0.7,
};

export const ballRenderConfig: BallRenderConfig = {
    motionFrameCount: 14,
    radius: 9,
    //@ts-ignore
    motionConfig: prefersReducedMotion
        ? { type: 'none' }
        : tail,
};

export const pillarRenderConfig = {
    pillars,
    pillarCollisionColor: '#70C6EB',
    pillarColor: '#000000',
};

export const launchConfig: LaunchConfig = {
    minDistanceRatio: 0.3,
    initSpeedScope: [10, 17],
    sectionCount: 6,
    destinationIndex: 1,
    sectionCollideColor: '#ccff14',
};

export interface GameBall {
    radius: number;
    gravityScale: number;
    collisionDecay: number;
    img: HTMLImageElement | null;
    fallbackSpeed: number[];
    maxStrikeCount: number | null;
    minStrikeCount: number;
    initSpeedScope: Range;
    motionFrameCount: number;
    motionConfig: BallMotionConfig;
}

export const ballParamConfig: Record<
    'common' | 'collision' | 'double',
    Omit<GameBall, 'img' | 'fallbackSpeed' | 'maxStrikeCount' | 'minStrikeCount'>
> = {
    common: {
        radius: 9,
        gravityScale: 0.25,
        collisionDecay: 0.6,
        initSpeedScope: [10, 14],
        motionFrameCount: 12,
        motionConfig: prefersReducedMotion
            ? { type: 'none' }
            : {
                type: 'mirage',
                opacity: 0.9,
                decay: 0.7,
            },
    },
    collision: {
        radius: 9,
        gravityScale: 0.1,
        collisionDecay: 0.9,
        initSpeedScope: [15, 18],
        motionFrameCount: 14,
        motionConfig: prefersReducedMotion
            ? { type: 'none' }
            : {
                type: 'tail',
                color: 'white',
                width: 3,
                shadow: [
                    {
                        blur: 4,
                        spread: 5,
                        color: 'rgba(255, 189, 134, 0.5)',
                    },
                    {
                        blur: 2,
                        spread: 2,
                        color: 'rgba(255, 245, 158, 1)',
                    },
                ],
            },
    },
    double: {
        radius: 9,
        gravityScale: 0.25,
        collisionDecay: 0.6,
        initSpeedScope: [10, 14],
        motionFrameCount: 18,
        motionConfig: prefersReducedMotion
            ? { type: 'none' }
            : {
                type: 'tail',
                color: 'white',
                width: 3,
                shadow: [
                    {
                        blur: 4,
                        spread: 5,
                        color: 'rgba(168, 171, 254, 0.9)',
                    },
                    {
                        blur: 2,
                        spread: 2,
                        color: 'rgba(149, 251, 255, 1)',
                    },
                ],
            },
    },
};
