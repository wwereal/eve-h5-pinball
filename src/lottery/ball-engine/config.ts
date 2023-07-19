import type { Position } from './model';
import { RoofShape } from './model';
const pillarsPosition = [
    [45, 78],
    [135, 78],
    [225, 78],
    [315, 78],
    [90, 156],
    [180, 156],
    [270, 156],
    [45, 234],
    [135, 234],
    [225, 234],
    [315, 234],
    [90, 312],
    [180, 312],
    [270, 312],
    [45, 390],
    [135, 390],
    [225, 390],
    [315, 390],
    [90, 468],
    [180, 468],
    [270, 468],
] as Position[];

const roofShape = RoofShape.trapezoid;

const leftLinePosition = [
    [30, 0],
    [0, 200],
] as [Position, Position];

export const globalConfig = {
    /**
     * 画布宽度
     */
    viewWidth: 400 - 40, // 40是弹道宽度
    /**
     * 画布高度
     */
    viewHeight: 580,

    ballRadius: 10,
    pillarRadius: 10,

    pillarsPosition,

    gravityScale: 0.3,
    collisionDecay: 0.6,

    initSpeedScope: [8, 10],

    /**
     * 是否允许球和障碍物重叠
     */
    allowOverlap: false,
    speedStep: 0.001,

    finalSectionCount: 5,

    ballCount: 1,

    destinations: [[1, 1]],

    useRender: true,

    sectionIndex: 1,

    isRandom: false,

    roofConfig: {
        cornerRadius: 100,
        leftLinePosition,
        roofShape,
    },
};
