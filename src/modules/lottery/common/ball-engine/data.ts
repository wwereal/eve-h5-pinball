import { groupBy, maxBy } from '@/base.utils';
import { Engine } from './engine';
import type { BallConfig, EngineConfig, Range, Velocity } from './model';
import { CollisionType } from './model';
import { genDestination, isEndToDestination } from './tool';
interface ExhaustiveParams {
    sectionCount: number;
    initSpeedScope: Range;
    speedStep: number;
    strikeCountRange: Range;
}

function calcHitDistribution(hits: number[]) {
    return hits.reduce((acc, hit) => {
        const preHit = acc.get(hit);
        if (!preHit) {
            acc.set(hit, 1);
        } else {
            acc.set(hit, preHit + 1);
        }
        return acc;
    }, new Map<number, number>());
}

function speedIter([min, max]: Range, step: number) {
    const iterNum = (max - min) / step;

    const res = [] as number[];
    for (let i = 0; i <= iterNum; i++) {
        res.push(min + i * step);
    }

    return res;
}

function genPrizeRange(sectionCount: number, collisionZoneWidth: number, ballRadius: number) {
    const range = [] as [number, number][];
    for (let i = 1; i <= sectionCount; i++) {
        range.push(...genDestination(i, sectionCount, collisionZoneWidth, ballRadius));
    }
    return range;
}

function genPrizeWorstTryCount(prizeList: number[], sectionCount: number) {
    const preIndex = new Array(sectionCount).fill(-1);
    const countRes = new Array(sectionCount).fill(false).map(() => [] as number[]);
    prizeList.forEach((prize, idx) => {
        if (prize === -1) {
            return;
        }
        countRes[prize]!.push(idx - preIndex[prize]);
        preIndex[prize] = idx;
    });

    const max = countRes.map((countList) => maxBy(countList, (x) => x));
    const average = countRes.map((countList) => countList.reduce((sum, b) => sum + b, 0) / countList.length);

    return {
        max,
        average,
        lastIndex: preIndex,
    };
}

/**
 * 穷举所有速度
 */
export const exhaustive = (
    engineConfig: Partial<EngineConfig>,
    ballConfig: Partial<BallConfig>,
    params: ExhaustiveParams,
    debug = false,
) => {
    const { initSpeedScope, speedStep } = params;
    const fullBallConfig = { ...Engine.defaultBallConfig, ...ballConfig };
    const engine = new Engine(engineConfig);
    const prizeRange = genPrizeRange(
        params.sectionCount,
        engine.config.tableConfig.collisionZoneWidth,
        fullBallConfig.radius,
    );

    const speedList = speedIter(initSpeedScope, speedStep);
    const simulateStartTime = Date.now();

    const simulateResultList = speedList.map((speed) => {
        const position = engine.getLaunchEndPosition(fullBallConfig.radius);
        const velocity: Velocity = [-speed, 0];
        const result = engine.simulate([{ ...fullBallConfig, initVelocity: velocity, initPosition: position }]);

        const path = result.frames;
        const hitPillarsIdx = result.frames
            .map((frame) => frame.collisions ?? [])
            .flat()
            .filter((collision) => collision.type === CollisionType.pillar)
            .map((c) => (c as { pillarId: number }).pillarId);
        const dedupeHitPillarsIdx = [...new Set(hitPillarsIdx)];

        const ballsEndPos = result.ballsLifeTime.map(
            (i) =>
                [
                    result.frames[i.end - 1]?.balls.find((b) => b.id === i.id)?.position,
                    result.frames[i.end]?.balls.find((b) => b.id === i.id)!.position!,
                ] as const,
        )[0]!;
        const prize = result.isEnd
            ? prizeRange.findIndex((range) => {
                  // 判定加强
                  return isEndToDestination(range, ballsEndPos);
              })
            : -1;

        return {
            hitPillarsIdx,
            dedupeHitPillarsIdx,
            prize:
                params.strikeCountRange[0] <= hitPillarsIdx.length && params.strikeCountRange[1] >= hitPillarsIdx.length
                    ? prize
                    : -1,
        };
    });
    const simulateEndTime = Date.now();
    const simulateTimeCost = simulateEndTime - simulateStartTime;

    /**
     * 每次计算的最坏迭代次数
     */
    const prizeWorstTryCount = genPrizeWorstTryCount(
        simulateResultList.map(({ prize }) => prize),
        params.sectionCount,
    );
    /**
     * 有效的计算结果，排除超时和落点模糊的情况
     */
    const legalResult = simulateResultList.filter((res) => res.prize > -1);
    const legalResultCount = legalResult.length;
    const legalPercent = legalResultCount / simulateResultList.length;
    const simulateTimeCostAvg = simulateTimeCost / simulateResultList.length;

    /**
     * 获奖分布
     */
    const prizePr = Object.fromEntries(
        Object.entries(groupBy(legalResult, ({ prize }) => prize)).map(([idx, group]) => [
            idx,
            group.length / legalResultCount,
        ]),
    );
    /**
     * 每一轮撞击障碍物的次数
     */
    const pillarsHitPerRound = legalResult.map(({ hitPillarsIdx }) => hitPillarsIdx.length);
    /**
     * 每一轮撞击障碍物的次数（同一障碍物去重）
     */
    const pillarsDedupeHitPerRound = legalResult.map(({ dedupeHitPillarsIdx }) => dedupeHitPillarsIdx.length);
    /**
     * 撞击次数的分布
     */
    const pillarsHitDistribution = calcHitDistribution(pillarsHitPerRound);
    /**
     * 撞击次数的分布（同一障碍物去重）
     */
    const pillarsDedupeHitDistribution = calcHitDistribution(pillarsDedupeHitPerRound);

    const pillarsHitCounts = new Array<number>(engine.config.tableConfig.pillars.length).fill(0); // 每个障碍物被撞击的次数
    const pillarsHitRounds = new Array<number>(engine.config.tableConfig.pillars.length).fill(0); // 每个障碍物有过撞击的轮数
    legalResult.forEach(({ hitPillarsIdx, dedupeHitPillarsIdx }) => {
        for (const n of hitPillarsIdx) {
            pillarsHitCounts[n]++;
        }
        for (const n of dedupeHitPillarsIdx) {
            pillarsHitRounds[n]++;
        }
    });
    const pillarsHitPr = pillarsHitRounds.map((round) => round / legalResultCount); // 每个障碍物有过撞击的概率（有碰撞轮数 / 总轮数）

    if (debug) {
        console.log('模拟总耗时', simulateTimeCost);
        console.log('单次模拟耗时', simulateTimeCostAvg);
        console.log('有效结果占比', legalPercent);
        console.log('有效结果个数', legalResultCount);
        console.log('最坏迭代次数', prizeWorstTryCount);
        console.log('每一轮撞击障碍物的次数', pillarsHitPerRound);
        console.log('每一轮撞击障碍物的次数（同一障碍物去重）', pillarsDedupeHitPerRound);
        console.log('撞击次数的分布', pillarsHitDistribution);
        console.log('撞击次数的分布（同一障碍物去重）', pillarsDedupeHitDistribution);
        console.log('每个障碍物有过撞击的概率（有碰撞轮数 / 总轮数）', pillarsHitPr);
        console.log('每个奖品的中奖概率（总碰撞次数 / 总轮数）', prizePr);
    }

    return {
        legalPercent,
        legalResultCount,
        simulateTimeCost,
        simulateTimeCostAvg,
        prizeWorstTryCount,
        pillarsHitPerRound,
        pillarsDedupeHitPerRound,
        pillarsHitDistribution,
        pillarsDedupeHitDistribution,
        pillarsHitPr,
        prizePr,
    };
};
