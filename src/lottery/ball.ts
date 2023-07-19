const NORMAL_BALL = 1; // 发财弹珠
const ELASTIC_BALL = 2; // 强力弹珠 碰撞次数更多
const DOUBLE_BALL = 3; // 加倍弹珠 碰撞效果和红包效果 加倍

export type BallType = typeof NORMAL_BALL | typeof ELASTIC_BALL | typeof DOUBLE_BALL;

export const ballType = {
    common: NORMAL_BALL,
    collide: ELASTIC_BALL,
    double: DOUBLE_BALL,
} as const;

export const mapBallText = (type: BallType) => {
    const textMap = ['', '发财弹珠', '撞撞弹珠', '加倍弹珠'];
    return textMap[type] ?? '发财弹珠';
};
