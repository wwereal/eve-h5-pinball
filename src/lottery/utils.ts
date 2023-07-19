export const trans414PxToCurrentPx = (val: number, baseWidth = 414, maxWidth = 500) => {
    const docEl = document.documentElement;
    const width = Math.min(docEl.clientWidth, maxWidth);
    const ratio = width / baseWidth;
    return val * ratio;
};

export const offset =
    document.documentElement.clientWidth - 500 > 0 ? (document.documentElement.clientWidth - 500) / 2 : 0;

export const isSmallScreen = () => {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;

    return (width <= 500 && width / height >= 375 / 667) || (width >= 500 && height <= 889);
};
