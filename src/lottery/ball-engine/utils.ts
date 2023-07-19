import { globalConfig } from './config';
import { Engine } from './engine';
import { CollisionType, RoofShape, type Frame, type Position } from './model';
import { runner } from './runner';

const output = {
    tryCount: 0,
    totalTestCount: 0,
    time: 0,
    avgTime: 0,
    totalTime: 0,
    avtTryCount: 0,
    totalTryCount: 0,
    collideCount: 0,
    totalCollideCount: 0,
    randomResult: 0,
};

const drawFinalSection = (ctx: CanvasRenderingContext2D) => {
    const { finalSectionCount: count, viewWidth, viewHeight } = globalConfig;

    const sectionWidth = viewWidth / count;
    // 现在落点区域的隔板没有碰撞，所以宽度和高度不太重要
    const lineWidth = 4;
    const lineHeight = 5;
    for (let i = 1; i < count; i++) {
        const [x, y] = [sectionWidth * i - lineWidth / 2, viewHeight - lineHeight];
        ctx.beginPath();
        ctx.moveTo(x, viewHeight); //线条开始位置
        ctx.lineTo(x, y); //线条经过点
        ctx.closePath();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = '#333';
        ctx.stroke();
    }
};

const render = (frames: Frame[]) => {
    const canvas = document.getElementById('my-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    let frameCount = 0;
    runner.setFPS(10);

    const draw = () => {
        const frame = frames[frameCount++];
        ctx.clearRect(0, 0, globalConfig.viewWidth, globalConfig.viewHeight);

        globalConfig.pillarsPosition.forEach((i) => {
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(i[0], i[1], globalConfig.pillarRadius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
        });

        drawFinalSection(ctx);

        frame?.balls.forEach(({ position }) => {
            ctx.beginPath();
            ctx.arc(position[0], position[1], 10, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
        });

        return !!frame;
    };
    runner.run(draw);
};

const computeOutputData = (params: { startTime: number; tryCount: number; collideCount: number }) => {
    output.collideCount = params.collideCount;
    output.totalCollideCount += params.collideCount;
    output.time = Date.now() - params.startTime;
    output.totalTestCount += 1;
    output.totalTime += output.time;
    output.tryCount = params.tryCount;
    output.totalTryCount += params.tryCount;
    output.avgTime = output.totalTime / output.totalTestCount;
    output.avtTryCount = output.totalTryCount / output.totalTestCount;
};

const find = (destinations: Array<[number, number]>, ballsEndPos: Position[]) => {
    const findSectionIndexList: number[] = [];
    ballsEndPos.forEach((pos) => {
        for (let i = 0; i < destinations.length; i++) {
            const [xMin, xMax] = destinations[i]!;
            const [endX] = pos;
            if (endX >= xMin && endX <= xMax) {
                if (!findSectionIndexList.includes(i)) {
                    findSectionIndexList.push(i);
                    break;
                }
            }
        }
    });
    return findSectionIndexList;
};

export const genDestination = (sectionIndex: number) => {
    const sectionWidth = globalConfig.viewWidth / globalConfig.finalSectionCount;

    return [[(sectionIndex - 1) * sectionWidth, sectionWidth * sectionIndex]];
};

// destinations 长度先跟小球个数对应
// destinations[i][0] 第i区间起始X坐标
// destinations[i][1] 第i区间结束X坐标

const findPosition = (destinations?: Array<[number, number]>) => {
    const [min, max] = globalConfig.initSpeedScope;
    const init = min! + (max! - min!) * Math.random();
    console.warn('findPosition start');
    const startTime = Date.now();
    const engine = new Engine({
        tableConfig: {
            rewardHeight: 0,
            collisionZoneWidth: globalConfig.viewWidth,
            viewHeight: globalConfig.viewHeight,
            trackZoneWidth: 40,
            trackZoneHeight: 580,
            springHeight: 80,
            baffleWidth: 0,
            roofConfig: {
                roofShape: RoofShape.rectangle,
            },
            pillars: globalConfig.pillarsPosition.map((pos, idx) => ({ id: idx, position: pos, radius: 10 })),
        },
        defaultGravityScale: globalConfig.gravityScale,
        defaultCollisionDecay: globalConfig.collisionDecay,
        allowOverlap: false,
    });
    let i = 0;
    for (; i < 800; i++) {
        const x = init + globalConfig.speedStep * i;

        const result = engine.simulate([{ initVelocity: [-x, 0], initPosition: [350, 20] }]);

        if (!result.isEnd) {
            continue;
        }

        const ballsEndPos = result.ballsLifeTime.map(
            (i) => result.frames[i.end]?.balls.find((b) => b.id === i.id)!.position!,
        );

        // destinations存在的话就是一个落点可能是不能小球落入，概率更高
        // destinations不存在的话是每个小球只能落到一个点 TODO
        if (destinations) {
            const findSectionIndexList = find(destinations, ballsEndPos);
            if (findSectionIndexList.length === destinations!.length) {
                // console.timeEnd('perf');
                console.warn('findPosition end');
                const tryCount = i + 1;
                const collideCount = result.frames
                    .map((frame) => frame.collisions ?? [])
                    .flat()
                    .filter((collision) => collision.type !== CollisionType.wall).length;
                computeOutputData({ tryCount, startTime, collideCount });
                // console.warn(`查找了${i}次, 找到了${destinations!.length}落点`);
                globalConfig.useRender && render(result.frames);
                return true;
            }
        }
    }
    console.warn('findPosition fail');
};

export const updateConfig = (config: {
    // 最好就是1个球
    ballCount?: number;
    // 奖品分区index 从1开始
    // 假设现在都只有一个奖品 TODO
    sectionIndex: number;
    // 有几个分区
    sectionCount?: number;
    decay?: number;
    gravityScale?: number;
    ballRadius?: number;
    pillarRadius?: number;

    // 显示canvas画图
    useRender?: boolean;

    // 是否随机落点
    isRandom?: boolean;

    initSpeedScope?: [number, number];
    pillarsPosition?: Position[];
}) => {
    // 小球生成，先写简单点的
    globalConfig.finalSectionCount = config.sectionCount ?? globalConfig.finalSectionCount;
    // destination表示奖品区域的x坐标范围

    globalConfig.collisionDecay = config.decay ?? globalConfig.collisionDecay;
    globalConfig.gravityScale = config.gravityScale ?? globalConfig.gravityScale;
    globalConfig.ballRadius = config.ballRadius ?? globalConfig.ballRadius;
    globalConfig.pillarRadius = config.pillarRadius ?? globalConfig.pillarRadius;
    globalConfig.useRender = config.useRender ?? globalConfig.useRender;
    globalConfig.isRandom = config.isRandom ?? globalConfig.isRandom;
    globalConfig.initSpeedScope = config.initSpeedScope ?? globalConfig.initSpeedScope;
    globalConfig.sectionIndex = config.sectionIndex ?? globalConfig.sectionIndex;
    globalConfig.pillarsPosition = config.pillarsPosition ?? globalConfig.pillarsPosition;
};

export const playGame = () => {
    if (globalConfig.isRandom) {
        globalConfig.destinations = [[0, globalConfig.viewWidth]];
    } else {
        globalConfig.destinations = genDestination(globalConfig.sectionIndex);
        output.randomResult = -1;
    }
    findPosition(globalConfig.destinations as [number, number][]);
    return output;
};
