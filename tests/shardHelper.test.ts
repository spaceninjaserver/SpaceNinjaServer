import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { colorToShard, combineColors, shardToColor } from "../src/helpers/shardHelper.ts";

describe("colorToShard / shardToColor", () => {
    it("are exact inverses of each other", () => {
        for (const [color, shard] of Object.entries(colorToShard)) {
            assert.equal(shardToColor[shard], color);
        }
        assert.equal(Object.keys(colorToShard).length, Object.keys(shardToColor).length);
    });
});

describe("combineColors", () => {
    it("mixes primary colors into secondary colors, in either order", () => {
        assert.equal(combineColors("ACC_RED", "ACC_YELLOW"), "ACC_ORANGE");
        assert.equal(combineColors("ACC_YELLOW", "ACC_RED"), "ACC_ORANGE");
        assert.equal(combineColors("ACC_RED", "ACC_BLUE"), "ACC_PURPLE");
        assert.equal(combineColors("ACC_BLUE", "ACC_RED"), "ACC_PURPLE");
        assert.equal(combineColors("ACC_YELLOW", "ACC_BLUE"), "ACC_GREEN");
        assert.equal(combineColors("ACC_BLUE", "ACC_YELLOW"), "ACC_GREEN");
    });
    it("keeps the mythic suffix when the first color is mythic", () => {
        assert.equal(combineColors("ACC_RED_MYTHIC", "ACC_YELLOW_MYTHIC"), "ACC_ORANGE_MYTHIC");
    });
    it("throws for combinations that are not two different primaries", () => {
        assert.throws(() => combineColors("ACC_RED", "ACC_RED"));
        assert.throws(() => combineColors("ACC_ORANGE", "ACC_BLUE"));
    });
});
