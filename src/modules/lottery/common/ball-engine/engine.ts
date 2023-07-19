import {
    computeAngle,
    computeCollisionVelocity,
    computeDistance,
    computedTwoBallHitVelocity,
    computeHit,
    computeIsLegalCollision,
    computePosition,
    computeVelocity,
    isTwoCircleHit,
} from './compute';
import type {
    Acceleration,
    BallConfig,
    BallState,
    Collision,
    EngineConfig,
    Frame,
    HitElement,
    Position,
    SimulateRecord,
    Velocity,
} from './model';
import { CollisionType, RoofShape } from './model';

class Ball implements BallState {
    readonly id: number;
    readonly radius: number;
    readonly collisionDecay: number;
    readonly gravityScale: number;

    isCollideOrOverlap = false;

    position: Position;
    velocity: Velocity;
    mass = 1;
    private time = 0;
    private positionZero: Position;
    private velocityZero: Velocity;
    private acceleration: Acceleration;
    constructor(private engine: Engine, id: number, config: BallConfig) {
        this.id = id;
        this.radius = config.radius;
        this.gravityScale = config.gravityScale;
        this.collisionDecay = config.collisionDecay;
        this.velocity = [...config.initVelocity];
        this.position = [...config.initPosition];
        this.velocityZero = [...config.initVelocity];
        this.positionZero = [...config.initPosition];
        this.acceleration = [0, this.gravityScale];
    }

    /**
     * @reference https://zhuanlan.zhihu.com/p/64278344
     */
    resetVerlet(options: { acceleration?: Acceleration; position?: Position; velocity?: Velocity }) {
        this.time = 0;
        this.position = options.position ?? [...this.position];
        this.velocity = options.velocity ?? [...this.velocity];
        this.positionZero = options.position ?? [...this.position];
        this.velocityZero = options.velocity ?? [...this.velocity];
        this.acceleration = options.acceleration ?? [0, this.gravityScale];
    }

    updateCollisionState(isHit: boolean) {
        this.isCollideOrOverlap = isHit;
    }

    nextFrame(timeScale: number) {
        this.time++;
        this.position = computePosition(this.positionZero, this.velocityZero, this.acceleration, this.time * timeScale);
        this.velocity = computeVelocity(this.velocityZero, this.acceleration, this.time * timeScale);
        return this;
    }
}

export class Engine {
    readonly config: EngineConfig;
    private ballId = 0;
    private frameCount = 0;
    private frames: Frame[] = [];
    private isTwoBallCollisionPreFrame = false;
    private ballsLifeTime: Map<number, [number, number]> = new Map();
    private endBalls: Set<number> = new Set();

    static defaultEngineConfig: EngineConfig = {
        tableConfig: {
            viewHeight: 580,
            rewardHeight: 0,
            collisionZoneWidth: 360,
            trackZoneWidth: 40,
            baffleWidth: 0,
            trackZoneHeight: 580,
            springHeight: 80,
            roofConfig: {
                roofShape: RoofShape.ellipse,
                ellipseCenter: [155, 52],
            },
            pillars: [],
        },
        defaultCollisionDecay: 0.6,
        defaultGravityScale: 0.3,
        allowOverlap: false,
        timeScale: 1,
    };
    static defaultBallConfig: BallConfig = {
        initPosition: [0, 0],
        initVelocity: [0, 0],
        radius: 10,
        collisionDecay: Engine.defaultEngineConfig.defaultCollisionDecay,
        gravityScale: Engine.defaultEngineConfig.defaultGravityScale,
        mass: 1,
    };
    constructor(config?: Partial<EngineConfig>) {
        this.config = {
            ...Engine.defaultEngineConfig,
            ...(config ?? {}),
        };
    }

    private createBall(config?: Partial<BallConfig>) {
        return new Ball(this, this.ballId++, {
            ...Engine.defaultBallConfig,
            gravityScale: this.config.defaultGravityScale,
            collisionDecay: this.config.defaultCollisionDecay,
            ...(config ?? {}),
        });
    }

    /**
     * 模拟两个小球可能发生的碰撞
     * @param ball1
     * @param ball2
     * @param isTwoBallCollisionPreFrame
     */
    private simulateTwoBallCollision(
        ball1: Ball,
        ball2: Ball,
        isTwoBallCollisionPreFrame: boolean,
    ): Collision | undefined {
        const pos1 = ball1.position;
        const pos2 = ball2.position;
        if (isTwoCircleHit(pos1, pos2, ball1.radius, ball2.radius)) {
            if (!isTwoBallCollisionPreFrame) {
                const [v1, v2] = computedTwoBallHitVelocity(ball1, ball2);
                ball1.resetVerlet({ position: ball1.position, velocity: [v1!.x, v1!.y] });
                ball2.resetVerlet({ position: ball2.position, velocity: [v2!.x, v2!.y] });
            }
            return {
                type: CollisionType.ball,
                ballIds: [ball1.id, ball2.id],
            };
        }
    }

    private reset() {
        this.ballId = 0;
        this.frameCount = 0;
        this.frames = [];
        this.ballsLifeTime = new Map();
        this.endBalls = new Set();
    }

    private ValidateBallConfig(ballsConfig: (Partial<BallConfig> | (() => Partial<BallConfig>))[]) {
        if (typeof ballsConfig[0] !== 'object') {
            throw Error('at least have a init ball');
        }
        if (ballsConfig.length > 2) {
            throw Error('support ball number <= 2');
        }
    }

    /**
     * 模拟一帧
     * @param balls
     */
    private simulateOneFrame(balls: Ball[], debug: boolean): Frame {
        const collisions: Collision[] = [];
        balls
            .filter((ball) => !this.endBalls.has(ball.id))
            .forEach((ball) => {
                if (!this.ballsLifeTime.get(ball.id)) {
                    this.ballsLifeTime.set(ball.id, [this.frameCount - 1, -1]);
                }
                const collision = this.simulateOneBallFrame(ball);
                collision && collisions.push(collision);
                const { position } = ball;

                if (position[1] > this.config.tableConfig.viewHeight - this.config.tableConfig.rewardHeight) {
                    this.ballsLifeTime.get(ball.id)![1] = this.frameCount - 1;
                    this.endBalls.add(ball.id);
                }
            });

        if (balls.length === 2) {
            const collision = this.simulateTwoBallCollision(balls[0]!, balls[1]!, this.isTwoBallCollisionPreFrame);
            this.isTwoBallCollisionPreFrame = !!collision;
            collision && collisions.push(collision);
        }

        return {
            balls: balls.map((ball) => {
                if (debug) {
                    return {
                        id: ball.id,
                        position: ball.position,
                        velocity: ball.velocity,
                    };
                }
                return {
                    id: ball.id,
                    position: ball.position,
                };
            }),
            collisions: collisions.length ? collisions : undefined,
        };
    }

    /**
     * 模拟小球碰撞，返回模拟的每一帧数据
     * @param ballsConfig
     * @param maxFrame
     */
    simulate(
        ballsConfig: (Partial<BallConfig> | (() => Partial<BallConfig>))[],
        debug = false,
        maxFrame = 5000,
    ): SimulateRecord {
        this.reset();
        this.ValidateBallConfig(ballsConfig);

        const balls = ballsConfig
            .filter((config) => typeof config !== 'function')
            .map((config) => this.createBall(config as BallConfig));
        while (this.frameCount++ < maxFrame && this.endBalls.size < balls.length) {
            this.frames.push(this.simulateOneFrame(balls, debug));
        }
        return {
            frames: this.frames,
            ballsLifeTime: [...this.ballsLifeTime.entries()].map(([id, life]) => ({
                id,
                start: life[0],
                end: life[1] === -1 ? this.frameCount - 1 : life[1],
            })),
            isEnd: this.endBalls.size >= balls.length,
        };
    }

    /**
     *  根据 碰撞元素 生成 碰撞 item
     * @param hitElement
     * @param ball
     */
    private createCollision(hitElement: HitElement | undefined, ball: Ball): Collision | undefined {
        return hitElement?.type === CollisionType.wall || hitElement?.type === CollisionType.ellipseRoof
            ? { type: CollisionType.wall, ballId: ball.id }
            : hitElement?.type === CollisionType.pillar
            ? { type: CollisionType.pillar, ballId: ball.id, pillarId: hitElement.pillar.id }
            : undefined;
    }

    /**
     * 模拟一个小球在下一帧的运动
     * @param ball
     */
    // eslint-disable-next-line sonarjs/cognitive-complexity
    private simulateOneBallFrame(ball: Ball): Collision | undefined {
        let { position: nowPosition, velocity } = ball.nextFrame(this.config.timeScale);
        const { position: collisionPosition, el: hitElement } =
            computeHit(
                ball.radius,
                nowPosition,
                this.config.tableConfig.pillars,
                this.config.tableConfig.collisionZoneWidth,
                this.config.tableConfig.roofConfig,
            ) ?? {};
        const isHit = !!collisionPosition && !!hitElement;
        const collision = this.createCollision(hitElement, ball);
        if (isHit) {
            const isCollision = computeIsLegalCollision(nowPosition, collisionPosition, velocity);
            if ((!this.config.allowOverlap || !ball.isCollideOrOverlap) && isCollision) {
                velocity = computeCollisionVelocity(
                    hitElement.type === CollisionType.ellipseRoof ? hitElement.positions[0] : nowPosition,
                    collisionPosition,
                    velocity,
                    ball.collisionDecay,
                );
            }
            if (!this.config.allowOverlap) {
                // hitElement.position[1]是椭圆顶小球与椭圆相撞时，球心的与此时交点切线垂线推出的中心（用来算overlapDistance）
                const position =
                    hitElement.type === CollisionType.ellipseRoof ? hitElement.positions[1] : collisionPosition;

                const nowAngle = computeAngle(position, nowPosition);

                const overlapDistance =
                    ball.radius +
                    (hitElement.type === CollisionType.pillar ? hitElement.pillar.radius : hitElement.radius) -
                    computeDistance(position, nowPosition);

                nowPosition = [
                    nowPosition[0] + overlapDistance * Math.cos(nowAngle),
                    nowPosition[1] + overlapDistance * Math.sin(nowAngle),
                ];
            }
            if (velocity !== ball.velocity || nowPosition !== ball.position) {
                ball.resetVerlet({ velocity, position: nowPosition });
            }
        }

        const preIsCollideOrOverlap = ball.isCollideOrOverlap;
        ball.updateCollisionState(isHit);
        return !preIsCollideOrOverlap ? collision : undefined;
    }

    private computePreLaunchFrame(
        ball: Ball,
        finalPosition: Position,
        reflectionPosition: Position,
        startPosition: Position,
        debug: boolean,
    ): Frame | undefined {
        const { position, velocity } = ball.nextFrame(this.config.timeScale);
        const isReflected = position[0] > reflectionPosition[0];
        const realPosition: Position = isReflected
            ? [reflectionPosition[0], finalPosition[1] + position[0] - finalPosition[0]]
            : [position[0], finalPosition[1]];

        if (realPosition[1] > startPosition[1]) {
            return;
        }

        let collision: Collision | undefined = undefined;

        if (isReflected && !ball.isCollideOrOverlap) {
            const collisionDecay = ball.collisionDecay ?? 1;
            ball.resetVerlet({
                position,
                velocity: [velocity[0] / collisionDecay, velocity[1] / collisionDecay],
                acceleration: [ball.gravityScale, 0],
            });
            ball.updateCollisionState(true);
            collision = { type: CollisionType.baffle, ballId: ball.id };
        }

        return {
            balls: [
                {
                    id: ball.id,
                    position: realPosition,
                    velocity: debug ? (isReflected ? [0, -velocity[0]] : [-velocity[0], 0]) : undefined,
                },
            ],
            collisions: collision ? [collision] : undefined,
        };
    }

    getLaunchStartPosition(springCompressDistance: number, ballRadius: number): Position {
        return [
            this.config.tableConfig.collisionZoneWidth +
                this.config.tableConfig.baffleWidth +
                this.config.tableConfig.trackZoneWidth / 2,
            this.config.tableConfig.viewHeight -
                this.config.tableConfig.springHeight +
                springCompressDistance -
                ballRadius,
        ];
    }

    getLaunchEndPosition(ballRadius: number): Position {
        return [
            this.config.tableConfig.collisionZoneWidth - ballRadius,
            this.config.tableConfig.viewHeight -
                this.config.tableConfig.trackZoneHeight +
                this.config.tableConfig.trackZoneWidth / 2,
        ];
    }

    simulateBallLaunch(
        ballConfig: Partial<BallConfig>,
        finalXVelocity = -13,
        springCompressDistance = 20,
        debug = false,
        maxFrame = 1000,
    ): SimulateRecord {
        this.reset();
        const ball = this.createBall(ballConfig);
        const launchEndPosition = this.getLaunchEndPosition(ball.radius);
        const startPosition: Position = this.getLaunchStartPosition(springCompressDistance, ball.radius);
        const reflectionPosition: Position = [startPosition[0], launchEndPosition[1]];
        ball.resetVerlet({
            position: launchEndPosition,
            velocity: [-finalXVelocity, 0],
            acceleration: [ball.gravityScale, 0],
        });
        while (this.frameCount++ < maxFrame) {
            const frame = this.computePreLaunchFrame(ball, launchEndPosition, reflectionPosition, startPosition, debug);
            if (!frame) {
                break;
            }
            this.frames.unshift(frame);
        }
        return {
            frames: this.frames,
            isEnd: this.frameCount > maxFrame,
            ballsLifeTime: [{ id: ball.id, start: 0, end: this.frameCount - 1 }],
        };
    }

    simulateBallLaunchFail(
        ballConfig: Partial<BallConfig>,
        startYVelocityRatio = 0.8,
        springCompressDistance = 20,
        debug = false,
        maxCollisionTime = 5,
        maxFrame = 500,
    ) {
        this.reset();
        const ball = this.createBall({
            ...ballConfig,
        });

        const maxSpeed =
            0.9 *
            Math.sqrt(
                2 *
                    (this.config.tableConfig.trackZoneHeight - this.config.tableConfig.springHeight - 2 * ball.radius) *
                    ball.gravityScale,
            );
        const minSpeed = 1.2 * Math.sqrt(2 * springCompressDistance * ball.gravityScale);
        const maxY = this.config.tableConfig.viewHeight - this.config.tableConfig.springHeight - ball.radius;

        const startPosition = this.getLaunchStartPosition(springCompressDistance, ball.radius);

        const velocity: Velocity = [0, -(minSpeed + startYVelocityRatio * (maxSpeed - minSpeed))];

        ball.resetVerlet({ position: startPosition, velocity });

        let collisionTime = 0;
        while (this.frameCount++ < maxFrame && collisionTime < maxCollisionTime) {
            let { position, velocity } = ball.nextFrame(this.config.timeScale);
            let collision: Collision | undefined = undefined;

            if (position[1] >= maxY && velocity[1] > 0) {
                collisionTime++;
                position = [startPosition[0], maxY];
                velocity = [0, -velocity[1] * ball.collisionDecay];
                collision = { type: CollisionType.wall, ballId: ball.id };

                if (Math.abs(velocity[1]) < 0.1 || ball.velocity[1] * velocity[1] >= 0) {
                    this.frames.push({
                        balls: [
                            {
                                id: ball.id,
                                position,
                                velocity,
                            },
                        ],
                    });
                    break;
                }
            }

            ball.updateCollisionState(!!collision);
            if (collision) {
                ball.resetVerlet({ position, velocity });
            }

            this.frames.push({
                balls: [
                    {
                        id: ball.id,
                        position,
                        velocity: debug ? velocity : undefined,
                    },
                ],
                collisions: collision && [collision],
            });
        }
        return this.frames;
    }
}
