import type { Acceleration, BallState, HitElement, Pillar, Position, RoofConfig, Velocity } from './model';
import { CollisionType, RoofShape } from './model';
import Vector2d from './vector2d';

// 计算没有碰撞时候的速度变化
export const computeVelocity = (velocity: Velocity, acceleration: Acceleration, deltaTime: number): Velocity => {
    return [velocity[0] + acceleration[0] * deltaTime, velocity[1] + acceleration[1] * deltaTime];
};

export const computePosition = (
    startPosition: Position,
    startVelocity: Velocity,
    acceleration: Acceleration,
    deltaTime: number,
): Position => {
    return [
        startPosition[0] + startVelocity[0] * deltaTime + 0.5 * acceleration[0] * deltaTime * deltaTime,
        // startPosition[1] + startVelocity[1] * deltaTime * deltaTime * gravityScale,
        startPosition[1] + startVelocity[1] * deltaTime + 0.5 * acceleration[1] * deltaTime * deltaTime,
    ];
};

export const computeAngle = (p1: Position, p2: Position) => {
    const pi = Math.PI;
    if (p2[0] === p1[0]) return p2[1] > p1[1] ? 0.5 * pi : 1.5 * pi; //  x === cx ? y > cy ? 90d : 270d
    if (p2[1] === p1[1]) return p2[0] > p1[0] ? 0 : pi; //  y === cy ? x > cx ? 0d : 180d
    const i = Math.atan((p1[1] - p2[1]) / (p1[0] - p2[0]));
    return p2[0] > p1[0] && p2[1] < p1[1] ? i + 2 * pi : p2[0] > p1[0] && p2[1] > p1[1] ? i : i + pi;
};

export const computeDistance = (p1: Position, p2: Position) => {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
};

// 检测碰撞-碰撞盒均为为圆形
export const isTwoCircleHit = (ball1: Position, ball2: Position, ball1Radius: number, ball2Radius: number) => {
    const dx = ball1[0] - ball2[0];
    const dy = ball1[1] - ball2[1];
    const radiusSum = ball1Radius + ball2Radius;
    return dx * dx + dy * dy <= radiusSum * radiusSum;
};

// 球桌顶部为梯形时
export const computeTrapezoidHit = (
    ballRadius: number,
    ballPosition: Position,
    leftLinePosition: [Position, Position],
    wallRadius: number,
):
    | {
          position: Position;
          el: HitElement;
      }
    | undefined => {
    const angle = -1 * computeAngle(leftLinePosition[1], leftLinePosition[0]);

    const k =
        (-1 * (leftLinePosition[0][1] + leftLinePosition[1][1])) / (leftLinePosition[0][0] + leftLinePosition[1][0]);
    // kx + b = y
    const b = leftLinePosition[0][1] - k * leftLinePosition[0][0];
    // 小球与左腰距离
    const d = Math.abs((k * ballPosition[0] + -1 * ballPosition[1] + b) / Math.sqrt(k * k + 1));

    // // 切点坐标
    const [x, y] = [ballPosition[0] - Math.sin(angle) * d, ballPosition[1] - Math.cos(angle) * d];

    if (d <= ballRadius) {
        const totalDistance = wallRadius;
        return {
            position: [x - totalDistance * Math.sin(angle), y - totalDistance * Math.cos(angle)],
            el: { type: CollisionType.wall, radius: wallRadius },
        };
    }
    return;
};

/**
 *
 * @param position 点坐标
 * @param b y轴半径
 * @param a x轴半径
 * @param centerPosition 椭圆圆心坐标
 * @returns 返回值<1表示在椭圆内，=1在椭圆边上，>1在椭圆外
 */
const isInEllipse = (position: Position, b: number, a: number, centerPosition: Position): number =>
    ((position[0] - centerPosition[0]) * (position[0] - centerPosition[0])) / (a * a) +
    ((position[1] - centerPosition[1]) * (position[1] - centerPosition[1])) / (b * b);

// 计算椭圆顶的碰撞 (1/2)
export const computeEllipseHit = (
    ballRadius: number,
    ballPosition: Position,
    centerPosition: Position,
    wallRadius: number,
):
    | {
          position: Position;
          el: HitElement;
      }
    | undefined => {
    // 判断半径为r小球在长半轴a、短半轴b的椭圆相交 =>
    // 约等于（？）判断小球圆心在长半轴a-r、短半轴b-r的椭圆 与 长半轴a+r、短半轴b+r的椭圆交集中
    const isInBiggerEllipse = isInEllipse(
        ballPosition,
        centerPosition[1] + ballRadius,
        centerPosition[0] + ballRadius,
        centerPosition,
    );
    const isInSmallerEllipse = isInEllipse(
        ballPosition,
        centerPosition[1] - ballRadius,
        centerPosition[0] - ballRadius,
        centerPosition,
    );

    // 小球位置与圆心夹角
    const ballRadian = computeAngle(ballPosition, centerPosition);
    // https://blog.csdn.net/LaineGates/article/details/105745843
    // tan(t) = tan(p)* a/b

    if (
        isInSmallerEllipse >= 1 &&
        isInBiggerEllipse <= 1 &&
        // 连线夹角小于180°
        ballRadian >= 0 &&
        ballRadian < Math.PI
    ) {
        const tanP =
            ballPosition[0] - centerPosition[0] === 0
                ? NaN
                : (ballPosition[1] - centerPosition[1]) / (ballPosition[0] - centerPosition[0]);
        const tanT = (tanP * centerPosition[0]) / centerPosition[1];
        const angleT = Number.isNaN(tanT) ? (Math.PI * 1) / 2 : Math.atan(tanT);
        // 圆和椭圆圆心的连线 与 椭圆的交点为
        const x0 = centerPosition[0] - centerPosition[0] * Math.cos(angleT);
        const y0 = centerPosition[1] - centerPosition[1] * Math.sin(angleT);

        /**
         * k 是 切线斜率， angle是垂线与x轴角度
         */
        let [k, b, d, angle] = [0, 0, 0, 0];
        // 切线方程 kx + b = y
        // 垂直切线
        if (x0 === 0 || x0 === centerPosition[0] * 2) {
            angle = (1 / 2) * Math.PI;
            d = ballPosition[0] - x0;
        }
        // 水平切线
        else if (y0 === 0 || y0 === centerPosition[1] * 2) {
            angle = 0;
            d = ballPosition[1] - y0;
        } else {
            // 根据椭圆方程求切线 为 (x-a)^2 / a^2 + (y-b)^2 /b^2 = 1
            k =
                (-1 *
                    (centerPosition[1] * centerPosition[1] * x0 -
                        centerPosition[1] * centerPosition[1] * centerPosition[0])) /
                (centerPosition[0] * centerPosition[0] * y0 -
                    centerPosition[0] * centerPosition[0] * centerPosition[1]);

            angle = Math.atan(-1 / k);
            b = y0 - k * x0;
            d = (-1 * (k * ballPosition[0] - 1 * ballPosition[1] + b)) / Math.sqrt(k * k + 1);
        }

        const overlapPositionDistance = d + wallRadius;
        // position是交点推的碰撞中心
        // el.positions 第一个position是交点，第二个是根据小球球心与碰撞切面推的算overlap的中心
        return {
            position: [x0 - wallRadius * Math.cos(angle), y0 - wallRadius * Math.sin(angle)],
            el: {
                type: CollisionType.ellipseRoof,
                radius: wallRadius,
                positions: [
                    [x0, y0],
                    [
                        ballPosition[0] - overlapPositionDistance * Math.cos(angle),
                        ballPosition[1] - overlapPositionDistance * Math.sin(angle),
                    ],
                ],
            },
        };
    }
    return;
};

// 球桌顶部为1/4圆形 + 矩形时
export const computeCircleHit = (
    ballRadius: number,
    ballPosition: Position,
    cornerRadius: number,
    wallRadius: number,
):
    | {
          position: Position;
          el: HitElement;
      }
    | undefined => {
    const distance = Math.sqrt((ballPosition[0] - cornerRadius) ** 2 + (ballPosition[1] - cornerRadius) ** 2);
    // 小球位置与圆心夹角
    const ballRadian = computeAngle(ballPosition, [cornerRadius, cornerRadius]);
    // 判断在1/4圆内
    if (
        // 连线夹角小于90°
        ballRadian >= 0 &&
        ballRadian <= (Math.PI * 1) / 2 &&
        // 相交或者相切
        distance <= cornerRadius + ballRadius &&
        distance >= cornerRadius - ballRadius
    ) {
        const totalDistance = wallRadius + cornerRadius;
        const radian = computeAngle(ballPosition, [cornerRadius, cornerRadius]);

        return {
            position: [
                cornerRadius - totalDistance * Math.cos(radian),
                cornerRadius - totalDistance * Math.sin(radian),
            ],
            el: { type: CollisionType.wall, radius: wallRadius },
        };
    }

    return;
};

// 计算小球碰撞
export const computeHit = (
    ballRadius: number,
    ballPosition: Position,
    pillars: Pillar[],
    viewWidth: number,
    roofConfig: RoofConfig,
):
    | {
          position: Position;
          el: HitElement;
      }
    | undefined => {
    // 柱子优先级最高
    for (const pillar of pillars) {
        if (isTwoCircleHit(ballPosition, pillar.position, ballRadius, pillar.radius)) {
            return { position: pillar.position, el: { pillar, type: CollisionType.pillar } };
        }
    }

    const wallRadius = 1000;

    if (roofConfig.roofShape === RoofShape.ellipse && Array.isArray(roofConfig.ellipseCenter)) {
        const result = computeEllipseHit(ballRadius, ballPosition, roofConfig.ellipseCenter, wallRadius);
        if (result) {
            return result;
        }
    }

    if (ballPosition[0] - ballRadius <= 0) {
        return {
            position: [-wallRadius, ballPosition[1]],
            el: { type: CollisionType.wall, radius: wallRadius },
        };
    }
    if (ballPosition[0] + ballRadius >= viewWidth) {
        return {
            position: [viewWidth + wallRadius, ballPosition[1]],
            el: { type: CollisionType.wall, radius: wallRadius },
        };
    }
    if (ballPosition[1] - ballRadius <= 0) {
        return {
            position: [ballPosition[0], -wallRadius],
            el: { type: CollisionType.wall, radius: wallRadius },
        };
    }
};

/**
 * 检查碰撞是否合理（速度朝向碰撞物体中心）
 * @param nowPosition
 * @param collisionPosition
 * @param velocity
 */
export const computeIsLegalCollision = (nowPosition: Position, collisionPosition: Position, velocity: Velocity) => {
    const normalVector = new Vector2d(nowPosition[0] - collisionPosition[0], nowPosition[1] - collisionPosition[1]);
    const vectorVelocity = new Vector2d(...velocity);
    return normalVector.dotProduct(vectorVelocity) < 0;
};

export const computeCollisionVelocity = (
    nowPosition: Position,
    collisionPosition: Position,
    nowVelocity: Velocity,
    collisionDecay: number,
) => {
    // 速度向量
    const vectorVelocity = new Vector2d(...nowVelocity);
    // 碰撞法线向量
    const normalVector = new Vector2d(
        nowPosition[0] - collisionPosition[0],
        nowPosition[1] - collisionPosition[1],
    ).normalize();
    // 碰撞切线向量
    const tangentVector = new Vector2d(normalVector.y, -normalVector.x).normalize();

    const newNormalVelocityVector = normalVector.multiply(
        -1 * normalVector.dotProduct(vectorVelocity) * collisionDecay,
    );
    const newTangentVelocityVector = tangentVector.multiply(tangentVector.dotProduct(vectorVelocity));

    const newVelocityVector = newNormalVelocityVector.add(newTangentVelocityVector);

    return [newVelocityVector.x, newVelocityVector.y] as Velocity;
};

export const computedTwoBallHitVelocity = (ball1: BallState, ball2: BallState): [Vector2d, Vector2d] => {
    const ball1VelocityInitial = new Vector2d(ball1.velocity[0]!, ball1.velocity[1]!);
    const ball2VelocityInitial = new Vector2d(ball2.velocity[0]!, ball2.velocity[1]!);

    // 球心方向单位向量
    const radian = Vector2d.computeRadian(ball1.position, ball2.position);
    const horizontalVector = Vector2d.getVector(radian, 1);

    // 垂直球心方向单位向量
    const perpendicularVector = Vector2d.getVector(radian + (Math.PI * 1) / 2, 1);

    // 速度在球心向量上的分速度投影长度
    const ball1VelocityHorizontalProjectionLength = ball1VelocityInitial.dotProduct(horizontalVector);
    const ball2VelocityHorizontalProjectionLength = ball2VelocityInitial.dotProduct(horizontalVector);

    // 速度在垂直球心向量上的分速度投影长度
    const ball1VelocityPerpendicularProjectionLength = ball1VelocityInitial.dotProduct(perpendicularVector);
    const ball2VelocityPerpendicularProjectionLength = ball2VelocityInitial.dotProduct(perpendicularVector);

    // 碰撞后球心方向上的分速度投影长度
    let ball1VelocityHorizontalProjectionFinalLength;
    let ball2VelocityHorizontalProjectionFinalLength;
    if (ball1.mass === ball2.mass) {
        // 质量相等
        ball1VelocityHorizontalProjectionFinalLength = ball2VelocityHorizontalProjectionLength;
        ball2VelocityHorizontalProjectionFinalLength = ball1VelocityHorizontalProjectionLength;
    } else {
        // 质量不相等
        ball1VelocityHorizontalProjectionFinalLength =
            (ball1VelocityHorizontalProjectionLength * (ball1.mass - ball2.mass) +
                2 * ball2.mass! * ball2VelocityHorizontalProjectionLength) /
            (ball1.mass + ball2.mass);
        ball2VelocityHorizontalProjectionFinalLength =
            (ball2VelocityHorizontalProjectionLength * (ball2.mass - ball1.mass) +
                2 * ball1.mass! * ball1VelocityHorizontalProjectionLength) /
            (ball1.mass + ball2.mass);
    }

    // 碰撞后球心方向上的分速度向量
    const ball1VelocityHorizontalProjectionFinalVector = horizontalVector.multiply(
        ball1VelocityHorizontalProjectionFinalLength,
    );
    const ball2VelocityHorizontalProjectionFinalVector = horizontalVector.multiply(
        ball2VelocityHorizontalProjectionFinalLength,
    );

    // 碰撞后垂直球心方向上的分速度向量
    const ball1VelocityPerpendicularProjectionVector = perpendicularVector.multiply(
        ball1VelocityPerpendicularProjectionLength,
    );
    const ball2VelocityPerpendicularProjectionVector = perpendicularVector.multiply(
        ball2VelocityPerpendicularProjectionLength,
    );

    // 两个球最终的速度向量
    const ball1VelocityFinalVector = ball1VelocityHorizontalProjectionFinalVector.add(
        ball1VelocityPerpendicularProjectionVector,
    );
    const ball2VelocityFinalVector = ball2VelocityHorizontalProjectionFinalVector.add(
        ball2VelocityPerpendicularProjectionVector,
    );
    return [ball1VelocityFinalVector, ball2VelocityFinalVector];
};
