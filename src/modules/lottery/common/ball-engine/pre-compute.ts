type PreComputeCache<P extends any[], R> = {
    cancel(): void;
    result: R extends Promise<infer U> ? Promise<U> : Promise<R>;
    used: boolean;
    args: P;
};

type PreComputeTask<P extends any[], R> = {
    getResult: (...args: P) => PreComputeCache<P, R>['result'];
    preCompute: (...args: P) => PreComputeCache<P, R>;
};

export const createPreComputeTask = <P extends any[], R>(
    func: (isCanceled: () => boolean, ...args: P) => R,
    timeout?: number,
): PreComputeTask<P, R> => {
    let cache: PreComputeCache<P, R> | undefined;
    const task: PreComputeTask<P, R> = {
        preCompute(...args) {
            const nowCache = cache;
            if (nowCache && !nowCache.used && args.every((arg, idx) => arg === nowCache.args[idx])) {
                return nowCache;
            }
            nowCache?.cancel();
            let cancel: () => void = () => {};
            let isCanceled = false;
            const newCache = {
                cancel,
                used: false,
                result: new Promise((res, rej) => {
                    cancel = () => {
                        if (!newCache.used) {
                            isCanceled = true;
                            rej('newCache.cancel');
                        }
                    };
                    Promise.resolve(func(() => isCanceled, ...args))
                        .then((result) => {
                            res(result);
                        })
                        .catch(rej);
                }) as PreComputeCache<P, R>['result'],
                args,
            };
            newCache.cancel = cancel;
            cache = newCache;
            return newCache;
        },
        getResult(...args) {
            const nowCache = cache;
            if (nowCache && !nowCache.used && args.every((arg, idx) => arg === nowCache.args[idx])) {
                nowCache.used = true;
                return nowCache.result;
            }
            const newCache = this.preCompute(...args);
            typeof timeout === 'number' &&
                setTimeout(() => {
                    newCache.cancel();
                }, timeout);
            return task.getResult(...args);
        },
    };
    return task;
};
