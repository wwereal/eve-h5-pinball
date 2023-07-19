export const rootValue = 100;
export const targetViewWidth = 414;
export const maxViewWidth = 500;

export function px2rem(px: number) {
    if (typeof px !== 'number') {
        // TODO: runtime error?
        throw new Error('px2rem: px must be a number');
    }

    // return `${px / rootValue}rem`;
    return `${px}px`
}

export function getViewRatio(targetWidth: number, screenMax = maxViewWidth): () => number {
    if (typeof targetWidth !== 'number' && typeof screenMax !== 'number') {
        return () => 1;
    }
    const value = Math.min(document.documentElement.clientWidth, screenMax) / targetWidth;
    return () => {
        return value;
    };
}

export function transViewValue(value: number, screenMax = maxViewWidth): number {
    if (typeof value !== 'number') {
        return 0;
    }
    const viewRatio = getViewRatio(targetViewWidth, screenMax);
    return value * viewRatio();
}
