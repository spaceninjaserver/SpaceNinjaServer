import { IMongoDate, IOid, IOidWithLegacySupport } from "@/src/types/commonTypes";
import { Types } from "mongoose";
import { TRarity } from "warframe-public-export-plus";

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

export const toMongoDate = (date: Date): IMongoDate => {
    return { $date: { $numberLong: date.getTime().toString() } };
};

export const fromMongoDate = (date: IMongoDate): Date => {
    return new Date(parseInt(date.$date.$numberLong));
};

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

export const catbrowDetails = {
    Colors: [
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorBaseA", rarity: "COMMON" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorBaseB", rarity: "COMMON" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorBaseC", rarity: "COMMON" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorBaseD", rarity: "COMMON" as TRarity },

        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorSecondaryA", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorSecondaryB", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorSecondaryC", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorSecondaryD", rarity: "UNCOMMON" as TRarity },

        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorTertiaryA", rarity: "RARE" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorTertiaryB", rarity: "RARE" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorTertiaryC", rarity: "RARE" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorTertiaryD", rarity: "RARE" as TRarity },

        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorAccentsA", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorAccentsB", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorAccentsC", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorAccentsD", rarity: "LEGENDARY" as TRarity }
    ],

    EyeColors: [
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesA", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesB", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesC", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesD", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesE", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesF", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesG", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesH", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesI", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesJ", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesK", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesL", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesM", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorEyesN", rarity: "LEGENDARY" as TRarity }
    ],

    FurPatterns: [{ type: "/Lotus/Types/Game/CatbrowPet/Patterns/CatbrowPetPatternA", rarity: "COMMON" as TRarity }],

    BodyTypes: [
        { type: "/Lotus/Types/Game/CatbrowPet/BodyTypes/CatbrowPetRegularBodyType", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/BodyTypes/CatbrowPetRegularBodyType", rarity: "LEGENDARY" as TRarity }
    ],

    Heads: [
        { type: "/Lotus/Types/Game/CatbrowPet/Heads/CatbrowHeadA", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Heads/CatbrowHeadB", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Heads/CatbrowHeadC", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Heads/CatbrowHeadD", rarity: "LEGENDARY" as TRarity }
    ],

    Tails: [
        { type: "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailA", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailB", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailC", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailD", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailE", rarity: "LEGENDARY" as TRarity }
    ]
};

export const kubrowDetails = {
    Colors: [
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneA", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneB", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneC", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneD", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneE", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneF", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneG", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMundaneH", rarity: "UNCOMMON" as TRarity },

        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidA", rarity: "RARE" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidB", rarity: "RARE" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidC", rarity: "RARE" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidD", rarity: "RARE" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidE", rarity: "RARE" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidF", rarity: "RARE" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidG", rarity: "RARE" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorMidH", rarity: "RARE" as TRarity },

        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantA", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantB", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantC", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantD", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantE", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantF", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantG", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorVibrantH", rarity: "LEGENDARY" as TRarity }
    ],

    EyeColors: [
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesA", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesB", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesC", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesD", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesE", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesF", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesG", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesH", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Colors/KubrowPetColorEyesI", rarity: "LEGENDARY" as TRarity }
    ],

    FurPatterns: [
        { type: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternB", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternA", rarity: "UNCOMMON" as TRarity },

        { type: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternC", rarity: "RARE" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternD", rarity: "RARE" as TRarity },

        { type: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternE", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternF", rarity: "LEGENDARY" as TRarity }
    ],

    BodyTypes: [
        { type: "/Lotus/Types/Game/KubrowPet/BodyTypes/KubrowPetRegularBodyType", rarity: "UNCOMMON" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/BodyTypes/KubrowPetHeavyBodyType", rarity: "LEGENDARY" as TRarity },
        { type: "/Lotus/Types/Game/KubrowPet/BodyTypes/KubrowPetThinBodyType", rarity: "LEGENDARY" as TRarity }
    ],

    Heads: [],

    Tails: []
};
