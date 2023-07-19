export interface IEasing {
    /**
     * no easing, no acceleration
     */
    linear: (t: number) => number;
    /**
     * ease?
     */
    ease: (t: number) => number;
    /**
     * accelerating from zero velocity
     */
    easeInQuad: (t: number) => number;
    /**
     * decelerating to zero velocity
     */
    easeOutQuad: (t: number) => number;
    /**
     * acceleration until halfway, then deceleration
     */
    easeInOutQuad: (t: number) => number;
    /**
     * accelerating from zero velocity
     */
    easeInCubic: (t: number) => number;
    /**
     * decelerating to zero velocity
     */
    easeOutCubic: (t: number) => number;
    /**
     * acceleration until halfway, then deceleration
     */
    easeInOutCubic: (t: number) => number;
    /**
     * accelerating from zero velocity
     */
    easeInQuart: (t: number) => number;
    /**
     * decelerating to zero velocity
     */
    easeOutQuart: (t: number) => number;
    /**
     * acceleration until halfway, then deceleration
     */
    easeInOutQuart: (t: number) => number;
    /**
     * accelerating from zero velocity
     */
    easeInQuint: (t: number) => number;
    /**
     * decelerating to zero velocity
     */
    easeOutQuint: (t: number) => number;
    /**
     * acceleration until halfway, then deceleration
     */
    easeInOutQuint: (t: number) => number;
}

export const easing: IEasing = {
    linear(t: number) {
        return t;
    },
    ease(t: number) {
        return 0.5 * (1 - Math.cos(Math.PI * t));
    },
    easeInQuad(t: number) {
        return t * t;
    },
    easeOutQuad(t: number) {
        return t * (2 - t);
    },
    easeInOutQuad(t: number) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    easeInCubic(t: number) {
        return t * t * t;
    },
    easeOutCubic(t: number) {
        // eslint-disable-next-line no-param-reassign
        return --t * t * t + 1;
    },
    easeInOutCubic(t: number) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    easeInQuart(t: number) {
        return t * t * t * t;
    },
    easeOutQuart(t: number) {
        // eslint-disable-next-line no-param-reassign
        return 1 - --t * t * t * t;
    },
    easeInOutQuart(t: number) {
        // eslint-disable-next-line no-param-reassign
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
    },
    easeInQuint(t: number) {
        return t * t * t * t * t;
    },
    easeOutQuint(t: number) {
        // eslint-disable-next-line no-param-reassign
        return 1 + --t * t * t * t * t;
    },
    easeInOutQuint(t: number) {
        // eslint-disable-next-line no-param-reassign
        return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
    },
};
