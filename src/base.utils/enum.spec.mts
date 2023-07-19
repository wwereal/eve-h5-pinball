import { it, expect } from 'vitest';
import { enumEntries, enumKeys, enumValues, parseEnum, tryParseEnum } from './enum.js';

enum StringEnum {
    k_a = 'v_a',
    k_b = 'v_b',
}

it('test string enum', () => {
    const keys: Array<'k_a' | 'k_b'> = enumKeys(StringEnum);
    expect(keys).toEqual(['k_a', 'k_b']);
    const values: StringEnum[] = enumValues(StringEnum);
    expect(values).toEqual([StringEnum.k_a, StringEnum.k_b]);
    const entries: Array<[key: 'k_a', value: StringEnum.k_a] | [key: 'k_b', value: StringEnum.k_b]> =
        enumEntries(StringEnum);
    expect(entries).toEqual([
        ['k_a', StringEnum.k_a],
        ['k_b', StringEnum.k_b],
    ]);

    expect(parseEnum(StringEnum, 'v_a')).toBe(StringEnum.k_a);
    expect(() => parseEnum(StringEnum, 'v_c')).throws();
    expect(tryParseEnum(StringEnum, 'v_a')).toBe(StringEnum.k_a);
    expect(tryParseEnum(StringEnum, 'v_c')).toBe(undefined);
});

enum NumericEnum {
    k_a = 2,
    k_b = 4,
}

it('test numeric enum', () => {
    const keys: Array<'k_a' | 'k_b'> = enumKeys(NumericEnum);
    expect(keys).toEqual(['k_a', 'k_b']);
    const values: NumericEnum[] = enumValues(NumericEnum);
    expect(values).toEqual([NumericEnum.k_a, NumericEnum.k_b]);
    const entries: Array<[key: 'k_a', value: NumericEnum.k_a] | [key: 'k_b', value: NumericEnum.k_b]> =
        enumEntries(NumericEnum);
    expect(entries).toEqual([
        ['k_a', NumericEnum.k_a],
        ['k_b', NumericEnum.k_b],
    ]);
    expect(parseEnum(NumericEnum, 2)).toBe(NumericEnum.k_a);
    expect(() => parseEnum(NumericEnum, 333)).throws();
    expect(() => parseEnum(NumericEnum, '2')).throws();
    expect(tryParseEnum(NumericEnum, 2)).toBe(NumericEnum.k_a);
    expect(tryParseEnum(NumericEnum, '2')).toBe(undefined);
    expect(tryParseEnum(NumericEnum, 333)).toBe(undefined);
});
