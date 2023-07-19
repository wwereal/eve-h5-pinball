export function isNotNil<T>(x: T): x is NonNullable<T> {
    return x != null;
}

export function assertNotNil<T>(v: T, message?: string): asserts v is NonNullable<T> {
    if (!isNotNil(v)) {
        throw new Error(message ?? 'Must not be null or undefined');
    }
}

export function isNotNull<T>(x: T): x is Exclude<T, null> {
    return x !== null;
}

export function assertNotNull<T>(v: T, message?: string): asserts v is Exclude<T, null> {
    if (!isNotNil(v)) {
        throw new Error(message ?? 'Must not be null');
    }
}

export function isNotUndefined<T>(x: T): x is Exclude<T, undefined> {
    return x !== undefined;
}

export function assertNotUndefined<T>(v: T, message?: string): asserts v is Exclude<T, null> {
    if (!isNotUndefined(v)) {
        throw new Error(message ?? 'Must not be undefined');
    }
}

export function assert(v: unknown, message?: string): asserts v {
    if (!v) {
        throw new Error(message ?? 'Assertion failed');
    }
}

export function assertNever(_v: never, message?: string): never {
    throw new Error(message ?? 'Should not be reach');
}

export function assertFailed(message?: string): never {
    throw new Error(message ?? 'Should not be reach');
}
