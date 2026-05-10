export const isEmptyObject = (obj: unknown): boolean => {
    return Boolean(obj && Object.keys(obj).length === 0 && obj.constructor === Object);
};

export const isObjectEmpty = (obj: object): boolean => {
    return Object.keys(obj).length === 0;
};

export const lerp = (v0: number, v1: number, t: number): number => {
    return v0 + t * (v1 - v0);
};

export const filterInplace = <T>(arr: T[], cond: (elm: T) => boolean): void => {
    for (let i = 0; i != arr.length; ) {
        if (cond(arr[i])) {
            ++i;
        } else {
            arr.splice(i, 1);
        }
    }
};
