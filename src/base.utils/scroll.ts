import { easing, type IEasing } from './easing';

const SCROLL_TIME = 250;

type Direction = 'x' | 'y';

interface ScrollContext {
    el: HTMLElement;
    direction: Direction;
    startTime: number;
    start: number;
    offset: number;
    duration: number;
    timingFunction: keyof IEasing;
    onEnd?: () => void;
}

interface ScrollToOption {
    start?: number;
    direction?: Direction;
    offset: number;
    timingFunction?: keyof IEasing;
    duration?: number;
    onEnd?: () => void;
}

function step(context: ScrollContext) {
    const t = Date.now();
    let elapsed = (t - context.startTime) / context.duration;
    elapsed = elapsed > 1 ? 1 : elapsed;
    const value = easing[context.timingFunction](elapsed);

    if (context.direction === 'y') {
        const current = context.start + context.offset * value;
        context.el.scrollTop = current;
    } else {
        const current = context.start + (context.offset - context.start) * value;
        context.el.scrollLeft = current;
    }

    if (elapsed < 1) {
        window.requestAnimationFrame(step.bind(window, context));
    } else {
        if (context.onEnd) {
            context.onEnd();
        }
    }
}

export function scrollTo(el: HTMLElement, opt: ScrollToOption) {
    const startTime = Date.now();
    const option = {
        direction: 'x' as Direction,
        timingFunction: 'ease' as keyof IEasing,
        duration: SCROLL_TIME,
        ...opt,
    };
    const start = option.direction === 'y' ? el.scrollTop : el.scrollLeft;

    const { direction, offset, timingFunction, duration, onEnd } = option;

    step({
        el,
        startTime,
        start,
        direction,
        offset,
        timingFunction,
        duration,
        onEnd,
    });
}
