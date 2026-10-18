import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ISyndicate } from "warframe-public-export-plus";
import { getMaxStanding, getMinStanding } from "../src/helpers/syndicateStandingHelper.ts";

const syndicate = {
    titles: [
        { level: -1, minStanding: -22000, maxStanding: -1 },
        { level: 1, minStanding: 0, maxStanding: 5000 },
        { level: 2, minStanding: 5000, maxStanding: 22000 }
    ]
} as unknown as ISyndicate;

const librarySyndicate = {} as unknown as ISyndicate;

describe("getMaxStanding", () => {
    it("returns the maxStanding of the given title", () => {
        assert.equal(getMaxStanding(syndicate, 2), 22000);
    });
    it("treats title 0 as the point where level 1 begins", () => {
        assert.equal(getMaxStanding(syndicate, 0), 0);
    });
    it("uses a fixed cap for syndicates without titles", () => {
        assert.equal(getMaxStanding(librarySyndicate, 3), 125000);
    });
});

describe("getMinStanding", () => {
    it("returns the minStanding of the given title", () => {
        assert.equal(getMinStanding(syndicate, 2), 5000);
    });
    it("treats title 0 as the top of the negative levels", () => {
        assert.equal(getMinStanding(syndicate, 0), -1);
    });
    it("uses zero for syndicates without titles", () => {
        assert.equal(getMinStanding(librarySyndicate, 3), 0);
    });
});
