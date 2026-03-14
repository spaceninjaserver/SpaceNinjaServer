type Entries<T, K extends keyof T = keyof T> = (K extends unknown ? [K, T[K]] : never)[];

export function getEntriesUnsafe<T extends object>(object: T): Entries<T> {
    return Object.entries(object) as Entries<T>;
}

type Values<T> = T[keyof T];

export const getObjectValues = <T extends object>(obj: T): Values<T>[] => {
    return Object.values(obj) as Values<T>[];
};

export const exhaustive = (_: never): void => {};
