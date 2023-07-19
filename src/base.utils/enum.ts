import { assertNotNil } from './asserts';

type EnumEntryOf<E, key extends keyof E> = key extends any ? [key: key, value: E[key]] : never;

export function enumEntries<E extends object>(e: E): Array<EnumEntryOf<E, keyof E>> {
    const entries = Object.entries(e);
    const numericEnum = entries.some(([key, value]) => Number.isInteger(Number(key)));
    return (numericEnum ? entries.filter(([key, v]) => !Number.isInteger(Number(key))) : entries) as any;
}

export function enumKeys<E extends object>(e: E): Array<keyof E> {
    return enumEntries(e).map(([key]) => key as any);
}

export function enumValues<E extends object>(e: E): Array<E[keyof E]> {
    return enumEntries(e).map(([key, value]) => value as any);
}

export function tryParseEnum<E extends object>(e: E, value: number | string): E[keyof E] | undefined {
    const values = enumValues(e);
    if (values.includes(value as any)) {
        return value as any;
    } else {
        return undefined;
    }
}

export function parseEnum<E extends object>(e: E, value: number | string): E[keyof E] {
    const result = tryParseEnum(e, value);
    assertNotNil(result, `Unknown enum type ${value}`);
    return result;
}
