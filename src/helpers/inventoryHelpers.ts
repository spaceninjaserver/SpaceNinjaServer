import type { IMongoDateWithLegacySupport, IMongoDate, IOid, IOidWithLegacySupport } from "../types/commonTypes.ts";
import { Types } from "mongoose";
import type { TRarity } from "warframe-public-export-plus";
import type { IFusionTreasure } from "../types/inventoryTypes/inventoryTypes.ts";
import type { IColor } from "../types/inventoryTypes/commonInventoryTypes.ts";
import gameToBuildVersion from "../constants/gameToBuildVersion.ts";

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
        const b_digit = b_digits[i] ?? 0;
        if (a_digits[i] != b_digit) {
            return a_digits[i] > b_digit ? 1 : -1;
        }
    }
    return 0;
};

export const toObjectId = (s: string): Types.ObjectId => {
    return new Types.ObjectId(s);
};

export const toOid = (objectId: Types.ObjectId): IOid => {
    return { $oid: objectId.toString() };
};

export function toOid2(objectId: Types.ObjectId | string, buildLabel: undefined): IOid;
export function toOid2(objectId: Types.ObjectId | string, buildLabel: string | undefined): IOidWithLegacySupport;
export function toOid2(objectId: Types.ObjectId | string, buildLabel: string | undefined): IOidWithLegacySupport {
    const oid = typeof objectId == "string" ? objectId : objectId.toString();
    if (buildLabel && version_compare(buildLabel, gameToBuildVersion["19.5.3"]) <= 0) {
        return { $id: oid };
    }
    return { $oid: oid };
}

export function toMongoDate2(value: Date | number, buildLabel: undefined): IMongoDate;
export function toMongoDate2(value: Date | number, buildLabel: string | undefined): IMongoDateWithLegacySupport;
export function toMongoDate2(value: Date | number, buildLabel: string | undefined): IMongoDateWithLegacySupport {
    const ms = value instanceof Date ? value.getTime() : value;
    if (buildLabel && version_compare(buildLabel, gameToBuildVersion["19.5.3"]) <= 0) {
        return { sec: Math.floor(ms / 1000), usec: (ms % 1000) * 1000 };
    }

    return { $date: { $numberLong: ms.toString() } };
}

export const toLegacyOid = (oid: IOidWithLegacySupport): void => {
    if ("$oid" in oid) {
        oid.$id = oid.$oid;
        delete oid.$oid;
    }
};

export const toLegacyDate = (date: IMongoDateWithLegacySupport): void => {
    if ("$date" in date) {
        const ms = parseInt(date.$date.$numberLong);
        delete (date as unknown as { $date?: never }).$date;
        (date as { sec?: number }).sec = Math.floor(ms / 1000);
        (date as { usec?: number }).usec = (ms % 1000) * 1000;
    }
};

export const fromOid = (oid: IOidWithLegacySupport): string => {
    return (oid.$oid ?? oid.$id)!;
};

export const toMongoDate = (date: Date): IMongoDate => {
    return { $date: { $numberLong: date.getTime().toString() } };
};

export const fromMongoDate = (date: IMongoDateWithLegacySupport): Date => {
    if ("$date" in date) return new Date(parseInt(date.$date.$numberLong));
    return new Date(date.sec * 1000 + Math.floor(date.usec / 1000));
};

export const parseFusionTreasure = (name: string, count: number): IFusionTreasure => {
    const arr = name.split("_");
    return {
        ItemType: arr[0],
        Sockets: parseInt(arr[1], 16),
        ItemCount: count
    };
};

export const convertIColorToLegacyColors = (colors: IColor | undefined): number[] => {
    const convertedColors = [colors?.t0 ?? -1, colors?.t1 ?? -1, colors?.t2 ?? -1, colors?.t3 ?? -1, colors?.en ?? -1];
    return convertedColors;
};

export const convertIColorToLegacyColorsWithAtt = (
    pricol: IColor | undefined,
    attcol: IColor | undefined
): number[] => {
    const convertedColors = [
        pricol?.t0 ?? -1,
        pricol?.t1 ?? -1,
        pricol?.t2 ?? -1,
        pricol?.t3 ?? -1,
        pricol?.en ?? -1,
        attcol?.t0 ?? -1,
        attcol?.t1 ?? -1,
        attcol?.t2 ?? -1,
        attcol?.t3 ?? -1,
        attcol?.en ?? -1
    ];
    return convertedColors;
};

// ChatGPT wrote that and seems it looks fine
export const convertFromLegacyFingerprint = (s: string): string => {
    let index = 0;

    const parseBlock = (): Record<string, unknown> | Record<string, unknown>[] => {
        const obj: Record<string, unknown> = {};

        while (index < s.length) {
            while (s[index] === "|" || s[index] === ",") index++;
            if (index >= s.length) break;
            if (s[index] === "}") {
                index++;
                break;
            }

            const eqPos = s.indexOf("=", index);
            if (eqPos === -1) break;
            const key = s.slice(index, eqPos);
            index = eqPos + 1;

            if (s[index] === "{" && s[index + 1] === "|") {
                index += 2;
                const items: Record<string, unknown>[] = [];
                while (index < s.length && !(s[index] === "|" && s[index + 1] === "}")) {
                    if (s[index] === "{" && s[index + 1] === "|") {
                        index += 2;
                        items.push(parseBlock() as Record<string, unknown>);
                    } else {
                        index++;
                    }
                }
                index += 2;
                obj[key] = items;
                continue;
            }

            if (s[index] === "{") {
                index++;
                obj[key] = parseBlock() as Record<string, unknown>;
                continue;
            }

            const nextSep = s.indexOf("|", index);
            const value = nextSep === -1 ? s.slice(index) : s.slice(index, nextSep);
            index = nextSep === -1 ? s.length : nextSep;
            const num = Number(value);
            if (!Number.isNaN(num)) {
                obj[key] = num;
            } else {
                obj[key] = value;
            }
        }

        return obj;
    };

    const result = parseBlock() as Record<string, unknown>;
    return JSON.stringify(result);
};

export const convertToLegacyFingerprint = (s: string): string => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const obj: Record<string, unknown> = JSON.parse(s);
    const serialize = (o: unknown): string => {
        if (Array.isArray(o)) {
            return o.map(item => `{|${serialize(item)}|}`).join(",");
        } else if (typeof o === "object" && o !== null) {
            const parts: string[] = [];
            for (const k in o as Record<string, unknown>) {
                const v = (o as Record<string, unknown>)[k];
                if (Array.isArray(v)) {
                    parts.push(`${k}={|${serialize(v)}|}`);
                } else if (typeof v === "object" && v !== null) {
                    parts.push(`${k}={|${serialize(v)}|}`);
                } else {
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    parts.push(`${k}=${v}`);
                }
            }
            return parts.join("|");
        } else {
            return String(o);
        }
    };
    return serialize(obj) + "|";
};

export const convertLegacyColorsToIColor = (colors: number[] | undefined): IColor => {
    if (colors) {
        return { t0: colors[0], t1: colors[1], t2: colors[2], t3: colors[3], en: colors[4] };
    } else {
        return {};
    }
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

export const modernToU5Recipes: Record<string, string> = {
    "/Lotus/Types/Recipes/Weapons/CeramicDaggerBlueprint": "/Lotus/Types/Recipes/Weapons/CeramicDaggeBlueprint",
    "/Lotus/Types/Recipes/Weapons/DarkDaggerBlueprint": "/Lotus/Types/Recipes/Weapons/DarkDaggeBlueprint",
    "/Lotus/Types/Recipes/Weapons/HeatDaggerBlueprint": "/Lotus/Types/Recipes/Weapons/HeatDaggeBlueprint"
};

export const U5ToModernRecipes: Record<string, string> = Object.fromEntries(
    Object.entries(modernToU5Recipes).map(([modern, U5]) => [U5, modern])
);

export const U5Recipes = [
    "/Lotus/Types/Recipes/KevinTestRecipe",
    "/Lotus/Types/Recipes/CronusBlueprint",
    "/Lotus/Types/Recipes/IncendiaryRifleModBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/AshBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/AshChassisBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/AshHelmetBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/AshSystemsBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/EmberBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/EmberChassisBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/EmberHelmetBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/EmberSystemsBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/RhinoBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/RhinoChassisBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/RhinoHelmetBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/RhinoSystemsBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/TrinityBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/TrinityChassisBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/TrinityHelmetBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/TrinitySystemsBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/MagBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/MagChassisBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/MagHelmetBlueprint",
    "/Lotus/Types/Recipes/WarframeRecipes/MagSystemsBlueprint",
    "/Lotus/Types/Recipes/Weapons/CeramicDaggeBlueprint",
    "/Lotus/Types/Recipes/Weapons/DarkDaggeBlueprint",
    "/Lotus/Types/Recipes/Weapons/HeatDaggeBlueprint",
    "/Lotus/Types/Recipes/Weapons/HeatSwordBlueprint",
    "/Lotus/Types/Recipes/Weapons/JawBlueprint",
    "/Lotus/Types/Recipes/Weapons/PangolinSwordBlueprint",
    "/Lotus/Types/Recipes/Weapons/PlasmaSwordBlueprint",
    "/Lotus/Types/Recipes/DarkSwordBlueprint"
];
