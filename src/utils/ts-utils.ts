type Entries<T, K extends keyof T = keyof T> = (K extends unknown ? [K, T[K]] : never)[];

export function getEntriesUnsafe<T extends object>(object: T): Entries<T> {
    return Object.entries(object) as Entries<T>;
}
