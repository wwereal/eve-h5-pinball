/**
 * Creates a debounced function that delays invoking `func` until after `wait` milliseconds have elapsed since the last time the debounced function was invoked.
 * @param func The function to debounce.
 * @param wait The number of milliseconds to delay. default is 200ms
 * @param immediate
 * @returns The new debounced function.
 */
export function debounce<Args extends any[]>(
    func: (...args: Args) => void,
    wait = 200,
    immediate = true,
): (...args: Args) => void {
    let timer: ReturnType<typeof setTimeout> | null;
    return function debounced(this: any, ...args: Args) {
        if (timer == null && immediate) {
            func.apply(this, args);
        }
        if (timer != null) {
            clearTimeout(timer);
        }
        const later = () => {
            timer = null;
            if (!immediate) {
                func.apply(this, args);
            }
        };
        timer = setTimeout(later, wait);
    };
}

/**
 * Creates a throttled function that only invokes `func` at most once per every `wait` milliseconds.
 *
 * @param func The function to throttle.
 * @param wait The number of milliseconds to throttle invocations to.
 * @param immediate
 * @returns The new throttled function.
 */
export function throttle<Args extends any[]>(
    func: (...args: Args) => void,
    wait = 0,
    immediate = false,
): (...args: Args) => void {
    let timer: ReturnType<typeof setTimeout> | null;
    return function throttled(this: any, ...args: Args) {
        if (timer != null) {
            return;
        }
        if (immediate) {
            func.apply(this, args);
        }
        // eslint-disable-next-line func-names
        const later = function (this: any) {
            timer = null;
            if (!immediate) {
                func.apply(this, args);
            }
        };
        timer = setTimeout(later, wait);
    };
}
