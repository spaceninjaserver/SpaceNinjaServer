import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLabelToVersionInt, buildVersionToInt, intToBuildVersion } from "../src/helpers/versionHelper.ts";

describe("buildVersionToInt", () => {
    it("packs each component into two digits", () => {
        assert.equal(buildVersionToInt("2013.01.04.10.41"), 2013_01_04_10_41);
    });
    it("orders later builds higher", () => {
        assert.ok(buildVersionToInt("2013.01.04.10.41") < buildVersionToInt("2013.01.04.10.42"));
        assert.ok(buildVersionToInt("2013.12.31.23.59") < buildVersionToInt("2014.01.01.00.00"));
    });
});

describe("buildLabelToVersionInt", () => {
    it("ignores everything after the first slash", () => {
        assert.equal(buildLabelToVersionInt("2013.01.04.10.41/"), buildVersionToInt("2013.01.04.10.41"));
        assert.equal(buildLabelToVersionInt("2013.01.04.10.41/extra"), buildVersionToInt("2013.01.04.10.41"));
    });
});

describe("intToBuildVersion", () => {
    it("round-trips with buildVersionToInt", () => {
        for (const v of ["2013.01.04.10.41", "2020.12.31.23.59", "2025.07.09.00.05"]) {
            assert.equal(intToBuildVersion(buildVersionToInt(v)), v);
        }
    });
});
