export class FrameRunner {
    private rafId = 0;
    private fps = 60;
    private lastRunTime = 0;
    private startTime = 0;
    private realFPS = 0;
    private frameCount = 0;
    private endFlag = false;
    private currentFPS = 0;
    /**
     * @returns boolean, false就终止runner
     */
    private userCallback?: (params: any) => boolean = () => true;

    constructor(fps?: number) {
        this.fps = fps ?? this.fps;
    }

    get expectFPS() {
        return this.fps;
    }

    get fpsInterval() {
        return 1000 / this.fps;
    }

    // 返回根据运行时间和frameCount计算的平均FPS
    get getFPS() {
        return this.realFPS;
    }

    setFPS(fps: number) {
        if (fps === 0) {
            console.error('FPS不能设为0！');
            return;
        }
        this.fps = fps;
    }

    internalCallback(timestamp?: number) {
        if (this.endFlag || !this.userCallback) {
            !this.userCallback && console.warn('请传入回调函数');
            return;
        }
        const now = Date.now();

        if (now - this.lastRunTime < this.fpsInterval) {
            this.rafId = window.requestAnimationFrame(this.internalCallback.bind(this));
            return;
        }

        if (this.rafId && now - this.lastRunTime >= this.fpsInterval) {
            this.currentFPS = 1000 / (now - this.lastRunTime);
            this.realFPS = (1000 * this.frameCount) / (now - this.startTime);
            // console.log(`整体FPS： ${this.realFPS}`);
            // console.log(`第${this.rafId}渲染帧，当前FPS为：${this.currentFPS}，时间间隔为${now - this.lastRunTime}`);
            try {
                this.endFlag = !Boolean(this.userCallback?.(timestamp!));
            } catch (e) {}
            const elapsed = now - this.lastRunTime;
            // console.log(`误差校准${elapsed % this.fpsInterval}ms`);
            this.lastRunTime = now - (elapsed % this.fpsInterval);
        }
        this.frameCount++;
        this.rafId = window.requestAnimationFrame(this.internalCallback.bind(this));
    }

    setAnimationCallBack(fn?: (params: any) => boolean) {
        this.userCallback = fn;
    }

    run(fn?: (params: any) => boolean) {
        this.frameCount = 0;
        this.reset();
        this.setAnimationCallBack(fn);
        this.startTime = Date.now();
        this.internalCallback();
    }

    reset() {
        this.endFlag = false;
    }

    stop() {
        this.endFlag = true;
    }
}

export const runner = new FrameRunner();
