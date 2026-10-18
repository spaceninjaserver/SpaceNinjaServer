import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addString, catBreadHash, getSubstringFromKeyword, regexEscape } from "../src/helpers/stringHelpers.ts";

describe("catBreadHash", () => {
    it("is deterministic and never negative", () => {
        for (const s of ["a", "/Lotus/Weapons/Tenno/Rifle/Braton", "ünïcode"]) {
            assert.equal(catBreadHash(s), catBreadHash(s));
            assert.ok(catBreadHash(s) >= 0);
        }
    });
    it("returns the FNV offset basis for an empty string", () => {
        assert.equal(catBreadHash(""), 2166136261);
    });
});

describe("regexEscape", () => {
    it("produces a pattern that matches the input literally", () => {
        for (const s of ["a.b", "a\\b", "[x]", "1+1", "a*b", "$^", "what?", "a|b", "(a)", "{1}"]) {
            assert.ok(new RegExp(`^${regexEscape(s)}$`).test(s), `should match ${s}`);
        }
    });
    it("does not let '.' match arbitrary characters", () => {
        assert.ok(!new RegExp(`^${regexEscape("a.b")}$`).test("axb"));
    });
});

describe("getSubstringFromKeyword", () => {
    it("returns the string from the keyword onwards", () => {
        assert.equal(getSubstringFromKeyword("foo=bar&baz", "bar"), "bar&baz");
    });
    it("throws when the keyword is missing", () => {
        assert.throws(() => getSubstringFromKeyword("foo", "bar"));
    });
});

describe("addString", () => {
    it("only adds unseen strings", () => {
        const arr = ["a"];
        addString(arr, "a");
        addString(arr, "b");
        assert.deepEqual(arr, ["a", "b"]);
    });
});
