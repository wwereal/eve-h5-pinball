

export const prefersReducedMotion = ((): boolean => {
    const indicators = ['islp', 'icfo', 'islb', 'islm'] as const;
    window.ENV_INFO = {
        /**
         * 是否高崩溃机型
         */
        islp: true,
        islb: true,
        islm: true,
        icfo: true,
        azprefix: '',
    };
    const prefersReducedMotion = indicators.reduce(
        (prefersReducedMotion, indicator) => prefersReducedMotion || window.ENV_INFO[indicator],
        false,
    );


    return prefersReducedMotion;
})();
