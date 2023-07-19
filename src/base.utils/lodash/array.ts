import { assertNotNil } from '../asserts';

/**
 * Creates a duplicate-free version of an array, using
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons, in which only the first occurrence of each element
 * is kept. The order of result values is determined by the order they occur
 * in the array.
 *
 * @param array The array to inspect.
 * @returns Returns the new duplicate free array.
 * @example
 *
 * uniq([2, 1, 2])
 * // => [2, 1]
 */
export function uniq<T>(array: ReadonlyArray<T>): Array<T> {
    return [...new Set(array)];
}

export function uniqBy<T>(array: ReadonlyArray<T>, mapper: (x: T) => unknown): Array<T> {
    const retArray: T[] = [];
    const keySet = new Set<unknown>();
    for (const x of array) {
        const k = mapper(x);
        if (!keySet.has(k)) {
            retArray.push(x);
            keySet.add(k);
        }
    }
    return retArray;
}

/**
 * Creates an object composed of keys generated from the results of running
 * each element of `collection` thru `iteratee`. The order of grouped values
 * is determined by the order they occur in `collection`. The corresponding
 * value of each key is an array of elements responsible for generating the
 * key. The iteratee is invoked with one argument: (value).
 *
 *
 * groupBy([6.1, 4.2, 6.3], Math.floor)
 * // => { '4': [4.2], '6': [6.1, 6.3] }
 */
export function groupBy<T>(xs: Array<T>, group: (x: T) => string | number): Record<string, T[]> {
    return xs.reduce<Record<string, T[]>>((prev, curr) => {
        const key = group(curr);
        {
            const p = prev[key] ?? [];
            // eslint-disable-next-line
            prev[key] = p;
        }
        prev[key]!.push(curr);
        return prev;
    }, {});
}

export function maxBy<T>(array: Array<T>, func: (x: T) => number): T | undefined {
    if (array.length === 0) {
        return undefined;
    }
    let maxElement: T = array[0]!;
    let maxValue = func(maxElement);

    for (let index = 1; index < array.length; index++) {
        const element: T = array[index]!;
        const elementValue = func(element);
        if (elementValue > maxValue) {
            maxElement = element;
            maxValue = elementValue;
        }
    }
    return maxElement;
}

export function lastOrUndefined<T>(items: T[] | undefined): T | undefined {
    if (!items?.length) {
        return undefined;
    }

    return items[items.length - 1];
}

export function last<T>(items: T[] | undefined): T {
    const value = lastOrUndefined(items);
    assertNotNil(value, 'Index out of range');
    return value;
}

export function firstOrUndefined<T>(items: T[] | undefined): T | undefined {
    if (!items?.length) {
        return undefined;
    }
    return items[0];
}

export function first<T>(items: T[] | undefined): T {
    const value = firstOrUndefined(items);
    assertNotNil(value, 'Index out of range');
    return value;
}
