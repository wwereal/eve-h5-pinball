export function debounce<F extends (...args: any[]) => any>(fn: F, delay = 200, immediate = true) {
    let timer: ReturnType<typeof setTimeout> | null;
    // eslint-disable-next-line func-names
    return function (this: any, ...args: Parameters<F>) {
        if (timer == null && immediate) {
            fn.apply(this, args);
        }
        if (timer != null) {
            clearTimeout(timer);
        }
        const later = () => {
            timer = null;
            if (!immediate) {
                fn.apply(this, args);
            }
        };
        timer = setTimeout(later, delay);
    };
}

/**
 * Throttle函数
 *
 * @param fn function
 * @param wait time
 * @param immediate execute run
 */
export type TAnyFunction = (...args: any[]) => void;

export function throttle(fn: TAnyFunction, wait = 0, immediate = false) {
    let timer: number | null = null;
    // eslint-disable-next-line func-names
    return function (this: any, ...args: []) {
        if (timer != null) {
            return;
        }
        if (immediate) {
            fn.apply(this, args);
        }
        // eslint-disable-next-line func-names
        const later = function (this: any) {
            timer = null;
            if (!immediate) {
                fn.apply(this, args);
            }
        };
        timer = window.setTimeout(later, wait);
    };
}
