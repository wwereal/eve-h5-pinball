import { it, expect } from 'vitest';
import { uniq, uniqBy, groupBy, maxBy } from './array.js';

it('test uniq', () => {
    expect(uniq([2, 1, 2])).toEqual([2, 1]);
});

it('test uniqBy', () => {
    expect(
        uniqBy(
            [
                { id: 2, name: 'Alice' },
                { id: 1, name: 'Bob' },
                { id: 2, name: 'Carol' },
            ],
            (x) => x.id,
        ),
    ).toEqual([
        { id: 2, name: 'Alice' },
        { id: 1, name: 'Bob' },
    ]);
});

it('test groupBy', () => {
    expect(groupBy([6.1, 4.2, 6.3], Math.floor)).toEqual({ '4': [4.2], '6': [6.1, 6.3] });
});

it('test maxBy', () => {
    expect(
        maxBy(
            [
                { id: 2, name: 'Alice' },
                { id: 1, name: 'Bob' },
                { id: 2, name: 'Carol' },
            ],
            (x) => x.id,
        ),
    ).toEqual({ id: 2, name: 'Alice' });
});
