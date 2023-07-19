export type Position = [number, number];
export type Velocity = [number, number];
export type Acceleration = [number, number];
export type Vector = [number, number];
export type Range = [number, number];

export interface Pillar {
    radius: number;
    position: Position;
    id: number;
}

export interface PillarRender extends Pillar {
    group?: number;
}

export interface SimulateRecord {
    frames: Frame[];
    ballsLifeTime: { id: number; start: number; end: number }[];
    isEnd: boolean;
}

export interface RoofConfig {
    roofShape: RoofShape;
    // 梯形时传入
    leftLinePosition?: [Position, Position];
    // 圆角时候传入
    cornerRadius?: number;
    // 椭圆时传入, 椭圆圆心的坐标，同时也对应长半径和短半径
    ellipseCenter?: Position;
}

/**
 * 弹球台配置
 */
export interface TableConfig {
    /**
     * 弹球台高度
     */
    viewHeight: number;
    /**
     * 奖励区高度，小球进入奖励区就会消失
     */
    rewardHeight: number;
    /**
     * 碰撞区宽度
     */
    collisionZoneWidth: number;
    /**
     * 挡板宽度
     */
    baffleWidth: number;
    /**
     * 发射区宽度
     */
    trackZoneWidth: number;
    /**
     * 发射区高度
     */
    trackZoneHeight: number;
    /**
     * 弹簧未压缩高度
     */
    springHeight: number;
    /**
     * 碰撞区柱子
     */
    pillars: Pillar[];
    /**
     * 场景左上角的碰撞相关配置
     */
    roofConfig: RoofConfig;
}

export interface EngineConfig {
    tableConfig: TableConfig;
    /**
     * 默认的碰撞衰竭系数
     */
    defaultCollisionDecay: number;
    /**
     * 默认的重力系数
     */
    defaultGravityScale: number;
    /**
     * 是否允许球和障碍物重叠
     */
    allowOverlap: boolean;
    /**
     * 每两帧之间的时间差
     */
    timeScale: number;
}

export interface BallConfig {
    // TODO id在这里控制，不放在 engine 里了
    initPosition: Position;
    initVelocity: Velocity;
    radius: number;
    collisionDecay: number;
    gravityScale: number;
    mass: number;
}

export enum CollisionType {
    'pillar' = 0,
    'wall' = 1,
    'ball' = 2,
    'ellipseRoof' = 3,
    'baffle' = 4,
}

export enum RoofShape {
    'rectangle' = 0,
    'trapezoid' = 1,
    'circle' = 2,
    'ellipse',
}

export type HitElement =
    | { type: CollisionType.pillar; pillar: Pillar }
    | { type: CollisionType.wall; radius: number }
    | { type: CollisionType.ellipseRoof; radius: number; positions: [Position, Position] };

export type Collision =
    | { type: CollisionType.pillar; ballId: number; pillarId: number }
    | { type: CollisionType.ball; ballIds: number[] }
    | { type: CollisionType.wall; ballId: number }
    | { type: CollisionType.baffle; ballId: number };

export interface BallState {
    mass: number;
    position: Position;
    velocity: Velocity;
    isCollideOrOverlap: boolean;
    radius: number;
    collisionDecay: number;
    gravityScale: number;
}

export interface Frame {
    balls: { id: number; position: Position; velocity?: Velocity }[];
    collisions?: Collision[];
}

export interface RenderConfig {
    defaultBallConfig: BallRenderConfig;
}

export type BallMotionConfig =
    | {
          type: 'mirage';
          opacity: number;
          decay: number;
      }
    | {
          type: 'tail';
          color: string;
          width: number;
          shadow: {
              spread: number;
              blur: number;
              color: string;
          }[];
      }
    | {
          type: 'none';
      };

export interface BallRenderConfig {
    radius: number;
    color?: string;
    img?: HTMLImageElement | null;
    motionFrameCount: number;
    motionConfig: BallMotionConfig;
}

export interface LaunchConfig {
    // TODO 增加速度 step
    sectionCount: number;
    initSpeedScope: Range;
    destinationIndex: number;
    // 小球能发射出去的弹簧最小形变量百分比
    minDistanceRatio: number;
    sectionCollideColor: string;
}

const PlayerStates = ['playing-launch', 'playing-loading', 'static', 'compressing', 'reward'] as const;
export type PlayerState = typeof PlayerStates[number];
export interface PillarRenderConfig {
    pillarColor?: string;
    pillarCollisionColor?: string;
    pillarHitImageSrc?: string;
    pillarImageSrc?: string;
    pillars: PillarRender[];
}

export enum PillarsEffectState {
    playing,
    idle,
    reward,
}

// 奖品渲染相关
export interface SectionRenderConfig {
    sectionImgs: string[];
}

export interface Output {
    velocity: Velocity;
    startTime: number;
    endTime: number;
    tryCount: number;
}
