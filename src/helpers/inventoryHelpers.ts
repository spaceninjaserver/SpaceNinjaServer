import type { IMongoDate, IOid, IOidWithLegacySupport } from "@/src/types/commonTypes";
import { Types } from "mongoose";
import type { TRarity } from "warframe-public-export-plus";
import type { IFusionTreasure } from "@/src/types/inventoryTypes/inventoryTypes";

export const version_compare = (a: string, b: string): number => {
    const a_digits = a
        .split("/")[0]
        .split(".")
        .map(x => parseInt(x));
    const b_digits = b
        .split("/")[0]
        .split(".")
        .map(x => parseInt(x));
    for (let i = 0; i != a_digits.length; ++i) {
        if (a_digits[i] != b_digits[i]) {
            return a_digits[i] > b_digits[i] ? 1 : -1;
        }
    }
    return 0;
};

export const toOid = (objectId: Types.ObjectId): IOid => {
    return { $oid: objectId.toString() };
};

export function toOid2(objectId: Types.ObjectId, buildLabel: undefined): IOid;
export function toOid2(objectId: Types.ObjectId, buildLabel: string | undefined): IOidWithLegacySupport;
export function toOid2(objectId: Types.ObjectId, buildLabel: string | undefined): IOidWithLegacySupport {
    if (buildLabel && version_compare(buildLabel, "2016.12.21.19.13") <= 0) {
        return { $id: objectId.toString() };
    }
    return { $oid: objectId.toString() };
}

export const toLegacyOid = (oid: IOidWithLegacySupport): void => {
    if (!("$id" in oid)) {
        oid.$id = oid.$oid;
        delete oid.$oid;
    }
};

export const fromOid = (oid: IOidWithLegacySupport): string => {
    return (oid.$oid ?? oid.$id)!;
};

// For oids that may have been stored incorrectly
export const fromDbOid = (x: Types.ObjectId | IOid): Types.ObjectId => {
    return "$oid" in x ? new Types.ObjectId(x.$oid) : x;
};

export const toMongoDate = (date: Date): IMongoDate => {
    return { $date: { $numberLong: date.getTime().toString() } };
};

export const fromMongoDate = (date: IMongoDate): Date => {
    return new Date(parseInt(date.$date.$numberLong));
};

export const parseFusionTreasure = (name: string, count: number): IFusionTreasure => {
    const arr = name.split("_");
    return {
        ItemType: arr[0],
        Sockets: parseInt(arr[1], 16),
        ItemCount: count
    };
};

export type TTraitsPool = Record<
    "Colors" | "EyeColors" | "FurPatterns" | "BodyTypes" | "Heads" | "Tails",
    { type: string; rarity: TRarity }[]
>;

export const kubrowWeights: Record<TRarity, number> = {
    COMMON: 6,
    UNCOMMON: 4,
    RARE: 2,
    LEGENDARY: 1
};

export const kubrowFurPatternsWeights: Record<TRarity, number> = {
    COMMON: 6,
    UNCOMMON: 5,
    RARE: 2,
    LEGENDARY: 1
};

export const catbrowDetails: TTraitsPool = {
    Colors: [
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorBaseA", rarity: "COMMON" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorBaseB", rarity: "COMMON" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorBaseC", rarity: "COMMON" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorBaseD", rarity: "COMMON" },

        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorSecondaryA", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorSecondaryB", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorSecondaryC", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorSecondaryD", rarity: "UNCOMMON" },

        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorTertiaryA", rarity: "RARE" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorTertiaryB", rarity: "RARE" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorTertiaryC", rarity: "RARE" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorTertiaryD", rarity: "RARE" },

        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorAccentsA", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorAccentsB", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorAccentsC", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorAccentsD", rarity: "LEGENDARY" }
    ],

    EyeColors: [
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesA", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesB", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesC", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesD", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesE", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesF", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesG", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesH", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesI", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesJ", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesK", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesL", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesM", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesN", rarity: "LEGENDARY" }
    ],

    FurPatterns: [{ type: "/Lotus/Types/Game/CatbrowPet/Patterns/CatbrowPetPatternA", rarity: "COMMON" }],

    BodyTypes: [
        { type: "/Lotus/Types/Game/CatbrowPet/BodyTypes/CatbrowPetRegularBodyType", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/CatbrowPet/BodyTypes/CatbrowPetRegularBodyType", rarity: "LEGENDARY" }
    ],

    Heads: [
        { type: "/Lotus/Types/Game/CatbrowPet/Heads/CatbrowHeadA", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Heads/CatbrowHeadB", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Heads/CatbrowHeadC", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Heads/CatbrowHeadD", rarity: "LEGENDARY" }
    ],

    Tails: [
        { type: "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailA", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailB", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailC", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailD", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailE", rarity: "LEGENDARY" }
    ]
};

export const kubrowDetails: TTraitsPool = {
    Colors: [
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneA", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneB", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneC", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneD", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneE", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneF", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneG", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneH", rarity: "UNCOMMON" },

        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidA", rarity: "RARE" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidB", rarity: "RARE" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidC", rarity: "RARE" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidD", rarity: "RARE" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidE", rarity: "RARE" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidF", rarity: "RARE" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidG", rarity: "RARE" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidH", rarity: "RARE" },

        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantA", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantB", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantC", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantD", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantE", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantF", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantG", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantH", rarity: "LEGENDARY" }
    ],

    EyeColors: [
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesA", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesB", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesC", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesD", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesE", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesF", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesG", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesH", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesI", rarity: "LEGENDARY" }
    ],

    FurPatterns: [
        { type: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternB", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternA", rarity: "UNCOMMON" },

        { type: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternC", rarity: "RARE" },
        { type: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternD", rarity: "RARE" },

        { type: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternE", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternF", rarity: "LEGENDARY" }
    ],

    BodyTypes: [
        { type: "/Lotus/Types/Game/KubrowPet/BodyTypes/KubrowPetRegularBodyType", rarity: "UNCOMMON" },
        { type: "/Lotus/Types/Game/KubrowPet/BodyTypes/KubrowPetHeavyBodyType", rarity: "LEGENDARY" },
        { type: "/Lotus/Types/Game/KubrowPet/BodyTypes/KubrowPetThinBodyType", rarity: "LEGENDARY" }
    ],

    Heads: [],

    Tails: []
};
