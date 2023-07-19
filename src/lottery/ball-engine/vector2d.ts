/**
 * 平面向量工具类
 * <p>
 * 参考链接: https://www.cnblogs.com/vokie/p/3602063.html
 */
import type { Position } from './model';

export default class Vector2d {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    //获取弧度
    public getRadian() {
        return Math.atan2(this.y, this.x);
    }

    //获取角度
    public getAngle() {
        return (this.getRadian() / Math.PI) * 180;
    }

    /**
     * 获取长度
     */
    public getLength() {
        return Math.sqrt(this.getLengthSQ());
    }

    public getLengthSQ() {
        return this.x * this.x + this.y * this.y;
    }

    //向量置零
    public zero() {
        this.x = 0;
        this.y = 0;
        return this;
    }

    public isZero() {
        return this.x === 0 && this.y === 0;
    }

    //向量的长度设置为我们期待的value
    public setLength(value: number) {
        const angle = this.getAngle();
        this.x = Math.cos(angle) * value;
        this.y = Math.sin(angle) * value;
    }

    //向量的标准化（方向不变，长度为1）
    public normalize() {
        const length = this.getLength();
        this.x /= length;
        this.y /= length;
        return this;
    }

    public clone() {
        return new Vector2d(this.y, this.y);
    }

    //是否已经标准化
    public isNormalized() {
        return this.getLength() === 1.0;
    }

    //向量的方向翻转
    public reverse() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    //2个向量的数量积(点积)
    public dotProduct(v: Vector2d) {
        return this.x * v.x + this.y * v.y;
    }

    //2个向量的向量积(叉积)
    public crossProduct(v: Vector2d) {
        return this.x * v.y - this.y * v.x;
    }

    //计算2个向量的夹角弧度
    //参考点积公式:v1 * v2 = cos<v1,v2> * |v1| *|v2|
    public static radianBetween(v1: Vector2d, v2: Vector2d) {
        let [newV1, newV2] = [v1, v2];
        if (!v1.isNormalized()) newV1 = v1.clone().normalize(); // |v1| = 1
        if (!v2.isNormalized()) newV2 = v2.clone().normalize(); // |v2| = 1
        return Math.acos(newV1.dotProduct(newV2));
    }

    /**
     * 根据两个点, 计算弧度(以 position1 为基点)
     */
    public static computeRadian(position1: Position, position2: Position) {
        const y1 = position1[1];
        const y2 = position2[1];
        const x1 = position1[0];
        const x2 = position2[0];

        const radian = Math.atan((y2 - y1) / (x2 - x1));
        if (Number.isNaN(radian)) {
            return 0;
        }
        if (x1 < x2) {
            return radian;
        } else {
            return radian + Math.PI;
        }
    }

    /**
     * 获取平面向量类
     *
     * @param radian 弧度
     * @param length 长度
     */
    public static getVector(radian: number, length: number) {
        return new Vector2d(Math.cos(radian) * length, Math.sin(radian) * length);
    }

    //弧度 = 角度乘以PI后再除以180、 推理可得弧度换算角度的公式
    //弧度转角度
    public static radian2Angle(radian: number) {
        return (radian / Math.PI) * 180;
    }

    //向量加
    public add(v: Vector2d) {
        return new Vector2d(this.x + v.x, this.y + v.y);
    }

    //向量减
    public subtract(v: Vector2d) {
        return new Vector2d(this.x - v.x, this.y - v.y);
    }

    public multiply(value: number) {
        return new Vector2d(this.x * value, this.y * value);
    }

    public divide(value: number) {
        return new Vector2d(this.x / value, this.y / value);
    }
}
