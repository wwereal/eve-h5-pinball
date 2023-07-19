import type { Engine } from './engine';
import type { Position, Range, SimulateRecord, Velocity } from './model';
import { CollisionType } from './model';

export function isEndToDestination(
    destination: Range,
    ballsLastTwoFrameEndPos: readonly [Position | undefined, Position],
) {
    const [beforeEndX] = ballsLastTwoFrameEndPos[1];
    const [endX] = ballsLastTwoFrameEndPos[1];
    const [xMin, xMax] = destination;
    return endX >= xMin && endX <= xMax && (!beforeEndX || (beforeEndX >= xMin && beforeEndX <= xMax));
}

const findVelocityOnce = (
    destinations: Array<[number, number]>,
    ballsLastTwoFrameEndPos: (readonly [Position | undefined, Position])[],
) => {
    const findSectionIndexList: number[] = [];
    ballsLastTwoFrameEndPos.forEach((pos) => {
        for (let i = 0; i < destinations.length; i++) {
            if (isEndToDestination(destinations[i]!, pos)) {
                if (!findSectionIndexList.includes(i)) {
                    findSectionIndexList.push(i);
                    break;
                }
            }
        }
    });
    return findSectionIndexList;
};

export const genDestination = (
    sectionIndex: number,
    sectionCount: number,
    viewWidth: number,
    ballRadius: number,
): Range[] => {
    const sectionWidth = viewWidth / sectionCount;

    return [
        [(sectionIndex - 1) * sectionWidth + (1 / 3) * ballRadius, sectionWidth * sectionIndex - (1 / 3) * ballRadius],
    ];
};

/**
 * 根据小球速度范围和指定落点暴力查找发射速度，找一个球
 * @param destinations 落点二维数组，每个元素也是数组，表示落点的x轴范围
 * @param engine 小球引擎，需要调用engine.simulate()
 * @param initSpeedScope 小球的初速度范围
 * @param speedStep 每次尝试的速度步长，默认为0.001
 * @param collisionPillarRange 碰撞柱子的次数
 * @param maxTryCount 每次查找最大次数， 默认为800
 */

export const findVelocity = async (
    isCanceled: () => boolean,
    destinations: Array<Range>,
    engine: Engine,
    initSpeedScope: Range,
    ballConfig: { radius: number; collisionDecay: number; gravityScale: number },
    speedStep = 0.001,
    collisionPillarRange: Range = [0, Infinity],
    maxTryCount = 800,
    fallbackSpeed: number | undefined,
    debug = false,
): Promise<
    | {
          result: SimulateRecord;
          tryCount: number;
          startTime: number;
          endTime: number;
          velocity: Velocity;
          fallback: boolean;
      }
    | undefined
    // eslint-disable-next-line sonarjs/cognitive-complexity
> => {
    const [min, max] = initSpeedScope;
    const init = Math.floor((Math.random() * (max - min)) / speedStep);
    const startTime = Date.now();

    const isGoodResult = (result: SimulateRecord) => {
        if (!result.isEnd) {
            return false;
        }
        const ballsEndPos = result.ballsLifeTime.map(
            (i) =>
                [
                    result.frames[i.end - 1]?.balls.find((b) => b.id === i.id)?.position,
                    result.frames[i.end]?.balls.find((b) => b.id === i.id)!.position!,
                ] as const,
        );
        const findSectionIndexList = findVelocityOnce(destinations, ballsEndPos);
        if (findSectionIndexList.length !== destinations!.length) {
            return;
        }
        const collisionPillarNumber = result.frames.flatMap(
            (frame) => frame.collisions?.filter((col) => col.type === CollisionType.pillar) ?? [],
        ).length;
        return collisionPillarRange[0] <= collisionPillarNumber && collisionPillarRange[1] >= collisionPillarNumber;
    };

    let pieceTaskStartTime = Date.now();
    await new Promise<void>((res) => {
        setTimeout(res, 1000 / 60);
    });
    for (let i = 0; i < maxTryCount; i++) {
        const now = Date.now();
        if (now - startTime > 2000) {
            break;
        }
        if (now - pieceTaskStartTime > 1000 / 15) {
            await new Promise((res) => {
                window.requestAnimationFrame(res);
            });
            if (isCanceled()) {
                return;
            }
            pieceTaskStartTime = Date.now();
        }
        const x = min + speedStep * (i + init);
        const position = engine.getLaunchEndPosition(ballConfig.radius);
        const velocity: Velocity = [-x, 0];
        const result = engine.simulate(
            [{ ...ballConfig, initPosition: position, initVelocity: velocity }],
            debug,
            5000,
        );

        if (isGoodResult(result)) {
            return { tryCount: i + 1, startTime, result, endTime: Date.now(), velocity, fallback: false };
        } else {
            continue;
        }
    }
    if (typeof fallbackSpeed === 'number') {
        const position = engine.getLaunchEndPosition(ballConfig.radius);
        const velocity: Velocity = [-Math.abs(fallbackSpeed), 0];
        const result = engine.simulate(
            [{ ...ballConfig, initPosition: position, initVelocity: velocity }],
            debug,
            5000,
        );
        if (isGoodResult(result)) {
            return { tryCount: maxTryCount + 1, startTime, result, endTime: Date.now(), velocity, fallback: true };
        }
    }
};
