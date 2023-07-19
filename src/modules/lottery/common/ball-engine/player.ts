import { type ShallowRef, shallowRef, computed } from 'vue';
import EventBus from '@/utils/event-bus';
import { isNotUndefined } from '@/base.utils';
import { Engine } from './engine';
import type {
    Collision,
    Frame,
    Position,
    Velocity,
    BallRenderConfig,
    RenderConfig,
    TableConfig,
    BallConfig,
    LaunchConfig,
    Output,
    PlayerState,
    Range,
    BallMotionConfig,
} from './model';
import { CollisionType } from './model';
import { runner } from './runner';
import { createPreComputeTask } from './pre-compute';
import { findVelocity, genDestination } from './tool';
import { exhaustive } from './data';

const resetCanvasContextSetting = (ctx: CanvasRenderingContext2D) => {
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
};

const drawImage = (
    ctx: CanvasRenderingContext2D,
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
) => {
    ctx.drawImage(image, Math.floor(dx * 2), Math.floor(dy * 2), Math.floor(dw * 2), Math.floor(dh * 2));
};

const drawCircle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    fillStyle: string,
    strokeStyle: string,
) => {
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.beginPath();
    ctx.arc(Math.floor(x * 2), Math.floor(y * 2), Math.floor(radius * 2), 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
};

interface Events {
    start: (launchType: 'success' | 'fail') => void;
    finish: (launchType: 'success' | 'fail') => void;
    collision: (collisions: Collision[]) => void;
    error: () => void;
    find: (output: Output) => void;
    reward: (rewardIndex: number) => void;
    ready: () => void;
    compress: (radio: number) => void;
}

class BallEventBus {
    private events = new EventBus();
    on<T extends keyof Events>(event: T, listener: Events[T]) {
        this.events.$on(event, listener);
    }

    once<T extends keyof Events>(event: T, listener: Events[T]) {
        this.events.$once(event, listener);
    }

    off<T extends keyof Events>(event: T, listener: Events[T]) {
        this.events.$off(event, listener);
    }

    emit<T extends keyof Events>(event: T, ...args: Parameters<Events[T]>) {
        this.events.$emit(event, args);
    }
}

type Launch = {
    ball: BallConfig & BallRenderConfig;
    destination: number;
    fallbackSpeed: number | undefined;
    strikeCountRange: Range;
    initSpeedScope: Range | undefined;
    ballEvents: BallEventBus;
};

export class Player {
    public state = shallowRef('static') as ShallowRef<PlayerState>;
    public currentLaunch: Launch | null = null;
    private tableConfig: TableConfig;
    /**
     * 下一次发射的数据
     */
    private nextLaunch: Launch | null = null;
    private renderState: {
        balls: ({
            position: Position;
            id?: number;
            velocity?: Velocity;
            opacity?: number;
            scale?: number;
            motions?: { position: Position; velocity?: Velocity }[];
        } & BallRenderConfig)[];
        springCompressLength: number;
    } = {
        balls: [],
        springCompressLength: 0,
    };
    // TODO 临时加的，防止弹簧和球不同步
    private lastSpringCompressLength = 0;
    private isDestroyed = false;
    private events = new EventBus();
    public lastFrames = shallowRef(null) as ShallowRef<null | Frame[]>;
    private runner = runner;
    private minCompressLength = 0;
    private maxCompressLength: number;
    private computePathTask = createPreComputeTask(
        async (
            isCanceled,
            destinationIndex: number,
            radius: number,
            collisionDecay: number,
            gravityScale: number,
            minStrikeCount: number,
            maxStrikeCount: number,
            fallbackSpeed: number | undefined,
            initSpeedScope?: Range,
        ) => {
            const destinations = genDestination(
                destinationIndex,
                this.launchConfig.sectionCount,
                this.tableConfig.collisionZoneWidth,
                radius,
            );
            this.debug &&
                console.log(
                    exhaustive(
                        this.simulator.config,
                        {
                            radius,
                            collisionDecay,
                            gravityScale,
                        },
                        {
                            speedStep: 0.001,
                            sectionCount: this.launchConfig.sectionCount,
                            initSpeedScope: initSpeedScope ?? this.launchConfig.initSpeedScope,
                            strikeCountRange: [minStrikeCount, maxStrikeCount],
                        },
                    ),
                );
            const result = await findVelocity(
                isCanceled,
                destinations,
                this.simulator,
                initSpeedScope ?? this.launchConfig.initSpeedScope,
                {
                    radius,
                    collisionDecay,
                    gravityScale,
                },
                0.001,
                [minStrikeCount, maxStrikeCount],
                3000,
                fallbackSpeed,
                this.debug,
            );
            if (!result) {
                throw new Error('find velocity error');
            }
            return result;
        },
    );

    private ballsRenderConfig: Record<number, BallRenderConfig> = {};
    public frameLength = computed(() => this.lastFrames.value?.length ?? 0);
    constructor(
        private simulator: Engine,
        private launchConfig: LaunchConfig,
        public renderConfig: RenderConfig,
        public ctx?: CanvasRenderingContext2D | null,
        public debug = false,
    ) {
        this.tableConfig = this.simulator.config.tableConfig;
        this.maxCompressLength = this.simulator.config.tableConfig.springHeight * 0.515;
        this.runner.run(this.loop.bind(this));
    }

    private loop() {
        if (this.state.value === 'static' || (this.state.value === 'reward' && this.nextLaunch)) {
            this.loadNextBall();
        }
        this.beforeRender?.();
        this.render();
        return !this.isDestroyed;
    }

    destroy() {
        this.isDestroyed = true;
    }

    private beforeRender?: () => void;

    on<T extends keyof Events>(event: T, listener: Events[T]) {
        this.events.$on(event, listener);
    }

    once<T extends keyof Events>(event: T, listener: Events[T]) {
        this.events.$once(event, listener);
    }

    off<T extends keyof Events>(event: T, listener: Events[T]) {
        this.events.$off(event, listener);
    }

    private emit<T extends keyof Events>(event: T, ...args: Parameters<Events[T]>) {
        this.events.$emit(event, ...args);
    }

    /**
     * 渲染 canvas， canvas 的尺寸为二倍图
     */
    // eslint-disable-next-line sonarjs/cognitive-complexity
    private render() {
        if (this.lastSpringCompressLength !== this.renderState.springCompressLength) {
            this.lastSpringCompressLength = this.renderState.springCompressLength;
            this.emit('compress', this.renderState.springCompressLength);
        }
        const { ctx, renderState } = this;
        if (!ctx) {
            return;
        }
        ctx.clearRect(
            0,
            0,
            (this.tableConfig.collisionZoneWidth + this.tableConfig.baffleWidth + this.tableConfig.trackZoneWidth) * 2,
            this.tableConfig.viewHeight * 2,
        );
        resetCanvasContextSetting(ctx);

        renderState.balls.forEach((ball) => {
            if (ball.motions && this.state.value === 'playing-launch') {
                this.drawMirage(ball.motions ?? [], ctx, ball);
                this.drawTail(ball.motions ?? [], ctx, ball.motionConfig);
            }

            ctx.globalAlpha = ball.opacity ?? 1;
            const radius = ball.radius * (ball.scale ?? 1);
            if (ball.img) {
                drawImage(ctx, ball.img, ball.position[0] - radius, ball.position[1] - radius, 2 * radius, 2 * radius);
            } else {
                drawCircle(ctx, ball.position[0], ball.position[1], radius, ball.color ?? 'white', 'black');
            }

            if (ball.velocity) {
                ctx.strokeStyle = 'blue';
                ctx.beginPath(); //开始绘制线条，若不使用beginPath，则不能绘制多条线条
                ctx.moveTo(ball.position[0] * 2, ball.position[1] * 2); //线条开始位置
                ctx.lineTo((ball.position[0] + ball.velocity[0]) * 2, (ball.position[1] + ball.velocity[1]) * 2); //线条经过点
                ctx.closePath();
                ctx.stroke();
            }

            resetCanvasContextSetting(ctx);
        });

        resetCanvasContextSetting(ctx);
    }

    private drawMirage(motions: { position: Position }[], ctx: CanvasRenderingContext2D, ball: BallRenderConfig) {
        const { motionConfig } = ball;
        if (motionConfig.type !== 'mirage') {
            return;
        }
        const motionOpacity = motionConfig.opacity;
        motions.forEach((motion, idx) => {
            ctx.globalAlpha = motionOpacity * motionConfig.decay ** idx;
            if (ball.img) {
                drawImage(
                    ctx,
                    ball.img,
                    motion.position[0] - ball.radius,
                    motion.position[1] - ball.radius,
                    2 * ball.radius,
                    2 * ball.radius,
                );
            } else {
                drawCircle(ctx, motion.position[0], motion.position[1], ball.radius, ball.color ?? 'white', 'black');
            }
        });
    }

    private drawTail(motions: { position: Position }[], ctx: CanvasRenderingContext2D, motionConfig: BallMotionConfig) {
        if (motionConfig.type !== 'tail') {
            return;
        }

        const positions = motions.map((i) => i.position);
        const pieceNum = 1;
        const points = positions
            .map((item, idx) => {
                if (idx === 0) {
                    return [[item[0], item[1]] as Position];
                }
                const pre = positions[idx - 1]!;
                return new Array(pieceNum)
                    .fill(0)
                    .map(
                        (_, i) =>
                            [
                                ((pieceNum - i - 1) / pieceNum) * pre[0] + ((i + 1) / pieceNum) * item[0],
                                ((pieceNum - i - 1) / pieceNum) * pre[1] + ((i + 1) / pieceNum) * item[1],
                            ] as Position,
                    );
            })
            .flat();

        if (!points.length) {
            return;
        }

        const offsetX = -(this.tableConfig.viewHeight * 3);
        ctx.shadowOffsetX = offsetX;

        motionConfig.shadow.forEach((shadow) => {
            for (let i = 1; i < points.length; ++i) {
                const start = points[i - 1]!;
                const end = points[i]!;
                const lineWidth = (2 * motionConfig.width * (points.length - i)) / points.length;

                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.lineWidth = lineWidth + 2 * (shadow.spread / motionConfig.width) * lineWidth;
                ctx.shadowColor = shadow.color;
                ctx.strokeStyle = 'black';
                ctx.shadowBlur = (shadow.blur / motionConfig.width) * lineWidth;
                ctx.moveTo(start[0] * 2 - offsetX, start[1] * 2);
                ctx.lineTo(end[0] * 2 - offsetX, end[1] * 2);
                ctx.stroke();
            }
        });

        for (let i = 1; i < points.length; ++i) {
            const start = points[i - 1]!;
            const end = points[i]!;
            const lineWidth = (2 * motionConfig.width * (points.length - i)) / points.length;

            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = motionConfig.color;
            ctx.moveTo(start[0] * 2, start[1] * 2);
            ctx.lineTo(end[0] * 2, end[1] * 2);
            ctx.stroke();
        }

        ctx.shadowOffsetX = 0;
        resetCanvasContextSetting(ctx);
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    private playLoading(ballConfig: BallRenderConfig, launch?: Launch) {
        if (this.state.value.startsWith('playing')) {
            return Promise.reject('playLoading-playing');
        }
        this.state.value = 'playing-loading';
        const endPos = this.simulator.getLaunchStartPosition(0, ballConfig.radius);
        const genKey = 12;
        const eKey = 51;
        const keyFrame = [0, 18, 27, 33, 39, 45, 51];
        const deltaList = [0, 21, -6, 6, -3, 3, -1].map((delta, idx) => {
            return delta / ((keyFrame[idx + 1] ?? 100) - keyFrame[idx]!);
        });
        let y = endPos[1] - 21;
        let delta = 0;
        const jumpFrame = this.runner.expectFPS === 30 ? 2 : 1;
        return new Promise<void>((res) => {
            let frameCount = 0;
            const updateBall = () => {
                if (frameCount > eKey) {
                    this.state.value = 'static';
                    res();
                    this.beforeRender = undefined;
                    return;
                }
                if (frameCount >= (keyFrame[0] ?? Infinity)) {
                    keyFrame.shift();
                    delta = deltaList.shift() ?? 0;
                    if (delta < 0) {
                        const collisions: Collision[] = [{ type: CollisionType.wall, ballId: 0 }];
                        this.emit('collision', collisions);
                        launch?.ballEvents.emit('collision', collisions);
                    }
                }
                y = frameCount === eKey ? endPos[1] : y + delta;
                this.renderState.balls = [
                    {
                        ...ballConfig,
                        id: 0,
                        opacity: frameCount > genKey ? 1 : frameCount / genKey,
                        scale: frameCount > genKey ? 1 : frameCount / genKey,
                        position: [endPos[0], y],
                    },
                ];
                frameCount++;
            };
            this.beforeRender = () => {
                updateBall();
                if (jumpFrame === 2) {
                    updateBall();
                }
            };
        });
    }

    private setRenderStateByFrame(frame?: Frame | undefined) {
        if (!frame) {
            this.renderState.balls.forEach((ball) => {
                ball.motions?.pop();
            });
            return;
        }

        const oldBalls = this.renderState.balls;

        this.renderState.balls =
            frame.balls.map(({ position, velocity, id }, idx) => {
                const oldBall = oldBalls.find((oldBall) => typeof id === 'number' && oldBall.id === id);
                const ballConfig = this.ballsRenderConfig?.[id] ?? this.renderConfig.defaultBallConfig;
                const motionFrameCount =
                    this.runner.expectFPS === 30 ? ballConfig.motionFrameCount / 2 : ballConfig.motionFrameCount;
                if (oldBall?.motions && motionFrameCount <= oldBall.motions.length) {
                    oldBall?.motions?.pop();
                }
                const motions = [{ position, velocity }, ...(oldBall?.motions ?? [])];

                return {
                    ...ballConfig,
                    position,
                    velocity,
                    id,
                    motions,
                };
            }) ?? [];

        this.setSpringCompressLength(0);
        if (frame?.balls.length === 1) {
            const ball = frame.balls[0]!;
            const ballConfig = this.ballsRenderConfig?.[ball.id] ?? this.renderConfig.defaultBallConfig;
            const ballStartPosition = this.simulator.getLaunchStartPosition(0, ballConfig.radius);
            if (ball.position[0] === ballStartPosition[0] && ball.position[1] > ballStartPosition[1]) {
                this.setSpringCompressLength(
                    this.tableConfig.springHeight -
                        (this.tableConfig.viewHeight - ball.position[1] - ballConfig.radius),
                );
            }
        }
    }

    public getSpringInfo() {
        return {
            springHeight: this.tableConfig.springHeight,
            maxCompressLength: this.maxCompressLength,
        };
    }

    private setSpringCompressLength(compressLength: number) {
        this.renderState.springCompressLength = Math.max(
            this.minCompressLength,
            Math.min(this.maxCompressLength, compressLength),
        );
    }

    private setRenderStateByCompressSpring(springCompressLength: number) {
        this.setSpringCompressLength(springCompressLength);
        if (this.currentLaunch) {
            const ballConfig = this.ballsRenderConfig?.[0] ?? this.renderConfig.defaultBallConfig;
            const launchStartPosition = this.simulator.getLaunchStartPosition(
                this.renderState.springCompressLength,
                ballConfig.radius,
            );
            this.renderState.balls = [
                {
                    ...ballConfig,
                    position: launchStartPosition,
                },
            ];
        } else {
            this.renderState.balls = [];
        }
    }

    private resetSpring() {
        if (this.state.value.startsWith('playing')) {
            return;
        }
        this.setRenderStateByCompressSpring(0);
    }

    private playLaunch(frames: Frame[], launch?: Launch) {
        this.lastFrames.value = frames;
        const jumpFrame = this.runner.expectFPS === 30 ? 2 : 1;
        return new Promise<void>((res) => {
            let frameCount = 0;
            this.beforeRender = () => {
                const playFrames = frames.slice(frameCount, frameCount + jumpFrame);
                const keyFrame = playFrames[1] ?? playFrames[0];
                if (!keyFrame && this.renderState.balls.every((ball) => (ball.motions?.length ?? 0) <= 0)) {
                    res();
                    this.beforeRender = undefined;
                    return;
                }
                const collisions = playFrames.flatMap((frame) => frame.collisions).filter(isNotUndefined);

                if (collisions.length) {
                    this.emit('collision', collisions);
                    launch?.ballEvents.emit('collision', collisions);
                }
                frameCount += jumpFrame;

                this.setRenderStateByFrame(keyFrame);
            };
        });
    }

    isInGame = false;

    private async startGame() {
        if (this.state.value !== 'compressing') {
            return;
        }
        const launch = this.currentLaunch;
        if (!launch) {
            // 弹簧回正
            this.resetSpring();
            this.state.value = 'static';
            return;
        }
        this.state.value = `playing-launch`;
        if (
            this.renderState.springCompressLength >=
            this.launchConfig.minDistanceRatio * this.tableConfig.springHeight
        ) {
            // 找到能落到指定落点的速度
            let result;
            try {
                result = await this.computePathTask.getResult(
                    launch.destination,
                    launch.ball.radius,
                    launch.ball.collisionDecay,
                    launch.ball.gravityScale,
                    launch.strikeCountRange[0],
                    launch.strikeCountRange[1],
                    launch.fallbackSpeed,
                    launch.initSpeedScope,
                );
            } catch (e) {}
            // 成功找到
            if (result) {
                const findLog = {
                    tryCount: result.tryCount,
                    startTime: result.startTime,
                    endTime: result.endTime,
                    velocity: result.velocity,
                };
                this.emit('find', findLog);
                launch.ballEvents.emit('find', findLog);
                // 反推发射速度
                const simulateBallLaunch = this.simulator.simulateBallLaunch(
                    launch.ball,
                    result?.velocity[0],
                    20,
                    this.debug,
                );
                // 最后一帧空帧
                // TODO 放到 engine 里
                const emptyFrame: Frame = {
                    balls: [],
                };
                const frames = [...simulateBallLaunch.frames, ...result.result.frames, emptyFrame];
                this.emit('start', 'success');
                launch.ballEvents.emit('start', 'success');
                await this.playLaunch(frames, launch);
                this.state.value = 'reward';
                this.emit('reward', launch.destination);
                launch.ballEvents.emit('reward', launch.destination);
                this.emit('finish', 'success');
                launch.ballEvents.emit('finish', 'success');
            } else {
                // TODO 没有找到速度的兜底
                this.emit('error');
                launch.ballEvents.emit('error');
                this.state.value = 'static';
                this.currentLaunch = null;
                this.resetSpring();
            }
            this.currentLaunch = null;
        } else {
            const failFrames = this.simulator.simulateBallLaunchFail(
                launch.ball,
                this.renderState.springCompressLength /
                    (this.launchConfig.minDistanceRatio * this.tableConfig.springHeight),
                this.renderState.springCompressLength,
                this.debug,
            );
            this.emit('start', 'fail');
            launch.ballEvents.emit('start', 'fail');
            await this.playLaunch(failFrames, launch);
            this.emit('finish', 'fail');
            launch.ballEvents.emit('finish', 'fail');
            if (this.nextLaunch !== null) {
                this.currentLaunch = null;
            }
            this.state.value = 'static';
        }
    }

    public getPlayerState() {
        return this.state.value;
    }

    public reset() {
        if (this.state.value.startsWith('playing')) {
            return;
        }
        this.currentLaunch = null;
        this.nextLaunch = null;
        this.resetSpring();
        this.state.value = 'static';
    }

    public loadBall(
        newBallConfig: {
            radius: number;
            collisionDecay: number;
            gravityScale: number;
            color?: string;
            img?: HTMLImageElement | null;
            motionFrameCount?: number;
            motionConfig?: BallMotionConfig;
        },
        newDestinationIndex: number,
        strikeCountRange: Range,
        initSpeedScope?: Range,
        fallbackSpeed?: number,
    ) {
        const ballEvents = new BallEventBus();
        this.nextLaunch = {
            ball: { ...Engine.defaultBallConfig, ...this.renderConfig.defaultBallConfig, ...newBallConfig },
            destination: newDestinationIndex,
            fallbackSpeed,
            strikeCountRange,
            initSpeedScope,
            ballEvents,
        };
        return ballEvents;
    }

    private loadNextBall() {
        if (this.nextLaunch === null || this.currentLaunch === this.nextLaunch) {
            return;
        }
        // 产品要求砍掉 loading
        const shouldPlayLoading = false;
        this.currentLaunch = this.nextLaunch;
        this.computePathTask.preCompute(
            this.currentLaunch.destination,
            this.currentLaunch.ball.radius,
            this.currentLaunch.ball.collisionDecay,
            this.currentLaunch.ball.gravityScale,
            this.currentLaunch.strikeCountRange[0],
            this.currentLaunch.strikeCountRange[1],
            this.currentLaunch.fallbackSpeed,
            this.currentLaunch.initSpeedScope,
        );
        this.nextLaunch = null;
        const currentLaunch = this.currentLaunch;
        // TODO: 0 换成 ball.id
        this.ballsRenderConfig[0] = currentLaunch.ball;
        this.renderConfig.defaultBallConfig = currentLaunch.ball;
        if (shouldPlayLoading) {
            this.playLoading(currentLaunch.ball, currentLaunch).then(() => {
                currentLaunch.ballEvents.emit('ready');
            });
        } else {
            this.resetSpring();
            this.state.value = 'static';
            Promise.resolve().then(() => {
                currentLaunch.ballEvents.emit('ready');
            });
        }
    }

    public compressSpring(delta: number) {
        if (this.state.value.startsWith('playing')) {
            return;
        }
        this.state.value = 'compressing';
        this.setRenderStateByCompressSpring(this.renderState.springCompressLength + delta);
    }

    public compressSpringTo(compressLength: number) {
        if (this.state.value.startsWith('playing')) {
            return;
        }
        this.state.value = 'compressing';
        this.setRenderStateByCompressSpring(compressLength);
    }

    public releaseSpring() {
        if (this.state.value !== 'compressing') {
            return;
        }
        this.startGame();
    }
    public debugFrame(frameIndex: number) {
        if (this.state.value !== 'static') {
            return;
        }
        this.setRenderStateByFrame(this.lastFrames.value?.[frameIndex]);
        return this.lastFrames.value?.[frameIndex];
    }
    public debugReplay() {
        if (!this.lastFrames.value) {
            return;
        }
        if (this.state.value.startsWith('playing')) {
            return Promise.reject('playLaunch-playing');
        }
        this.state.value = `playing-launch`;
        this.playLaunch(this.lastFrames.value).then(() => {
            this.state.value = 'static';
        });
    }

    public updateRenderConfig(config: Partial<RenderConfig>) {
        this.renderConfig = {
            ...this.renderConfig,
            ...config,
        };
    }
}
