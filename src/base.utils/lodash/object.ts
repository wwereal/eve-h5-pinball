export function mapValues<T = any, U = any>(obj: Record<string, T>, mapper: (x: T) => U): Record<string, U> {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, mapper(v)]));
}
