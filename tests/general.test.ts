import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterInplace, isEmptyObject, isObjectEmpty, lerp } from "../src/helpers/general.ts";

describe("isEmptyObject", () => {
    it("is true only for plain empty objects", () => {
        assert.equal(isEmptyObject({}), true);
        assert.equal(isEmptyObject({ a: 1 }), false);
        assert.equal(isEmptyObject(null), false);
        assert.equal(isEmptyObject(undefined), false);
        assert.equal(isEmptyObject([]), false);
    });
});

describe("isObjectEmpty", () => {
    it("checks for own enumerable keys", () => {
        assert.equal(isObjectEmpty({}), true);
        assert.equal(isObjectEmpty({ a: undefined }), false);
    });
});

describe("lerp", () => {
    it("interpolates linearly", () => {
        assert.equal(lerp(10, 20, 0), 10);
        assert.equal(lerp(10, 20, 1), 20);
        assert.equal(lerp(10, 20, 0.5), 15);
    });
});

describe("filterInplace", () => {
    it("keeps matching elements and mutates the original array", () => {
        const arr = [1, 2, 3, 4, 5, 6];
        const same = arr;
        filterInplace(arr, x => x % 2 == 0);
        assert.deepEqual(arr, [2, 4, 6]);
        assert.equal(arr, same);
    });
    it("handles removing everything and removing nothing", () => {
        const none = [1, 2, 3];
        filterInplace(none, () => false);
        assert.deepEqual(none, []);
        const all = [1, 2, 3];
        filterInplace(all, () => true);
        assert.deepEqual(all, [1, 2, 3]);
    });
});
