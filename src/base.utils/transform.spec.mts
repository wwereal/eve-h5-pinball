import { it, expect } from 'vitest';
import { transformMsToString } from './transform.js';

it('transformMsToString', () => {
    expect(transformMsToString(1620000000000)).toBe('2021-05-03 08:00:00');
});
