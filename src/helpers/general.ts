export const isEmptyObject = (obj: unknown): boolean => {
    return Boolean(obj && Object.keys(obj).length === 0 && obj.constructor === Object);
};

/*
alternative to isEmptyObject
export const isEmptyObject = (obj: object): boolean => {
    return Object.keys(obj).length === 0;
};
*/

export const isString = (text: unknown): text is string => {
    return typeof text === "string" || text instanceof String;
};

export const parseString = (data: unknown): string => {
    if (!isString(data)) {
        throw new Error("data is not a string");
    }

    return data;
};

export const isNumber = (number: unknown): number is number => {
    return typeof number === "number" && !isNaN(number);
};

export const parseNumber = (data: unknown): number => {
    if (!isNumber(data)) {
        throw new Error("data is not a number");
    }

    return Number(data);
};

export const isDate = (date: string): boolean => {
    return Date.parse(date) != 0;
};

export const parseDateNumber = (date: unknown): string => {
    if (!isString(date) || !isDate(date)) {
        throw new Error("date could not be parsed");
    }

    return date;
};

export const parseEmail = (email: unknown): string => {
    if (!isString(email)) {
        throw new Error("incorrect email");
    }
    return email;
};

export const isBoolean = (booleanCandidate: unknown): booleanCandidate is boolean => {
    return typeof booleanCandidate === "boolean";
};

export const parseBoolean = (booleanCandidate: unknown): boolean => {
    if (!isBoolean(booleanCandidate)) {
        throw new Error("argument was not a boolean");
    }
    return booleanCandidate;
};

export const isObject = (objectCandidate: unknown): objectCandidate is Record<string, unknown> => {
    return (
        (typeof objectCandidate === "object" || objectCandidate instanceof Object) &&
        objectCandidate !== null &&
        !Array.isArray(objectCandidate)
    );
};

export const lerp = (v0: number, v1: number, t: number): number => {
    return v0 + t * (v1 - v0);
};
