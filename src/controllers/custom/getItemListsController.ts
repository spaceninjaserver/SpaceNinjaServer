import type { RequestHandler } from "express";
import {
    getDict,
    getItemName,
    getNormalizedString,
    getString,
    supplementalItemNames,
    supplementalKeys,
    supplementalRecipes,
    supplementalSuits,
    supplementalUpgrades,
    U5Modules
} from "../../services/itemDataService.ts";
import type { IU5FingerprintUpgrade } from "../../services/itemDataService.ts";
import type { TRarity, TRelicQuality } from "warframe-public-export-plus";
import {
    ExportAbilities,
    ExportArcanes,
    ExportAvionics,
    ExportBoosters,
    ExportBundles,
    ExportCustoms,
    ExportDojoRecipes,
    ExportDrones,
    ExportFactions,
    ExportFlavour,
    ExportGear,
    ExportKeys,
    ExportMissionTypes,
    ExportRailjackWeapons,
    ExportRecipes,
    ExportRegions,
    ExportRelics,
    ExportResources,
    ExportSentinels,
    ExportSyndicates,
    ExportUpgrades,
    ExportWarframes,
    ExportWeapons
} from "warframe-public-export-plus";
import { evolutionWeapons, permanentEvolutionWeapons } from "../../constants/evolutionWeapons.ts";
import supplementalDict from "../../../static/fixed_responses/supplementalDict/index.json" with { type: "json" };
import varzia from "../../constants/varzia.ts";
import suitDefaultUpgrades from "../../constants/suitDefaultUpgrades.ts";
import { pseudoRecipeToOwnedRecipeMap } from "../../services/foundryService.ts";
import { nightwaveTagToSeasonName } from "../../services/worldStateService.ts";
import {
    dogDaysFlashSales,
    lunarNewYearAllFlashSales,
    naberusNightsFlashSales,
    prideMonthFlashSales,
    saintPatrickDayFlashSales,
    tennobaumFlashSales
} from "../../constants/flashSales.ts";

export interface ListedItem {
    uniqueName: string;
    name: string;
    subtype?: string;
    fusionLimit?: number;
    exalted?: readonly string[];
    badReason?: "starter" | "frivolous" | "notraw" | "metadataPatch" | "u5mod";
    partType?: string;
    chainLength?: number;
    parazon?: boolean;
    alwaysAvailable?: boolean;
    maxLevelCap?: number;
    eligibleForVault?: boolean;
    parentName?: string;
    fits?: { type: string; rarity: TRarity; statAtten?: number }[];
    upgrades?: IU5FingerprintUpgrade[];
    evolutionWeapon?: true;
    baseEvolutionWeapon?: true;
    permanentEvolutionWeapon?: true;
    marketCreditsPrice?: number | null;
    marketPlatinumPrice?: number | null;
}

export interface ItemLists {
    Suits: ListedItem[];
    LongGuns: ListedItem[];
    Melee: ListedItem[];
    ModularParts: ListedItem[];
    Pistols: ListedItem[];
    Sentinels: ListedItem[];
    SentinelWeapons: ListedItem[];
    SpaceGuns: ListedItem[];
    SpaceMelee: ListedItem[];
    SpaceSuits: ListedItem[];
    MechSuits: ListedItem[];
    miscitems: ListedItem[];
    Syndicates: ListedItem[];
    OperatorAmps: ListedItem[];
    QuestKeys: ListedItem[];
    KubrowPets: ListedItem[];
    mods: ListedItem[];
    Boosters: ListedItem[];
    VarziaOffers: ListedItem[];
    Abilities: ListedItem[];
    TechProjects: ListedItem[];
    VaultDecoRecipes: ListedItem[];
    FlavourItems: ListedItem[];
    ShipDecorations: ListedItem[];
    WeaponSkins: ListedItem[];
    ColorPalettes: ListedItem[];
    Seasonal: ListedItem[];
    Tennogen: ListedItem[];
    BundleGlyphs: ListedItem[];
    BundleGenes: ListedItem[];
    BundleBoosters: ListedItem[];
    BundleMods: ListedItem[];
    BundleIncarnons: ListedItem[];
    BundleHeirlooms: ListedItem[];
    BundleNoggles: ListedItem[];
    Bundles: ListedItem[];
    MissionTypes: ListedItem[];
    Nodes: ListedItem[];
    NightwaveTags: ListedItem[];
    AdditionalDict: ListedItem[];
    //circuitGameModes: ListedItem[];
    blueprintAndItem: string;
}

const isGlyphItem = (uniqueName: string, nameKey?: string): boolean =>
    uniqueName.includes("/AvatarImages/") ||
    /Glyph/i.test(uniqueName) ||
    /\/Glyphs\//i.test(nameKey ?? "") ||
    uniqueName.includes("/ShipDecos/Operator/SchoolDecal") ||
    uniqueName.endsWith("/TennoGenSigil");

const relicQualitySuffixes: Record<TRelicQuality, string> = {
    VPQ_BRONZE: "",
    VPQ_SILVER: "/Lotus/Language/Relics/VoidProjectionQuality_Silver",
    VPQ_GOLD: "/Lotus/Language/Relics/VoidProjectionQuality_Gold",
    VPQ_PLATINUM: "/Lotus/Language/Relics/VoidProjectionQuality_Platinum"
};

const toTitleCase = (str: string): string => {
    return str.replace(/[^\s-]+/g, word => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase());
};

const supplementalModBundleTypes = new Set([
    "/Lotus/Types/StoreItems/Packages/EssentialColdModPack",
    "/Lotus/Types/StoreItems/Packages/EssentialCritModPack",
    "/Lotus/Types/StoreItems/Packages/EssentialDamageModPack",
    "/Lotus/Types/StoreItems/Packages/EssentialElectricityModPack",
    "/Lotus/Types/StoreItems/Packages/EssentialGrimoireModPack",
    "/Lotus/Types/StoreItems/Packages/EssentialHeatModPack",
    "/Lotus/Types/StoreItems/Packages/EssentialTennokaiModPack",
    "/Lotus/Types/StoreItems/Packages/EssentialToxinModPack",
    "/Lotus/Types/StoreItems/Packages/EvergreenTripleMeleeRiven",
    "/Lotus/Types/StoreItems/Packages/EvergreenTripleRifleRiven",
    "/Lotus/Types/StoreItems/Packages/EvergreenTripleSecondaryRiven",
    "/Lotus/Types/StoreItems/Packages/Login850Pack",
    "/Lotus/Types/StoreItems/Packages/TheTeacherRewardModPack"
]);

const nonPlayerWeaponTypes = new Set([
    "/Lotus/Weapons/Tenno/Grimoire/TnDoppelgangerGrimoire",
    "/Lotus/Types/JadeShadowsPart2Mission/Enemies/Ground/Elites/JS2MCorruptedBossMinigun"
]);

export const getItemLists = (language: string = "en"): ItemLists => {
    const lang = getDict(language);
    const res: ItemLists = {
        Suits: [],
        LongGuns: [],
        Melee: [],
        ModularParts: [],
        Pistols: [],
        Sentinels: [],
        SentinelWeapons: [],
        SpaceGuns: [],
        SpaceMelee: [],
        SpaceSuits: [],
        MechSuits: [],
        miscitems: [],
        Syndicates: [],
        OperatorAmps: [],
        QuestKeys: [],
        KubrowPets: [],
        mods: [],
        Boosters: [],
        VarziaOffers: [],
        Abilities: [],
        TechProjects: [],
        VaultDecoRecipes: [],
        FlavourItems: [],
        ShipDecorations: [],
        WeaponSkins: [],
        ColorPalettes: [],
        Seasonal: [],
        Tennogen: [],
        BundleGlyphs: [],
        BundleGenes: [],
        BundleBoosters: [],
        BundleMods: [],
        BundleIncarnons: [],
        BundleHeirlooms: [],
        BundleNoggles: [],
        Bundles: [],
        MissionTypes: [],
        Nodes: [],
        NightwaveTags: [],
        AdditionalDict: [],
        /*circuitGameModes: [
            {
                uniqueName: "Survival",
                name: toTitleCase(getString("/Lotus/Language/Missions/MissionName_Survival", lang))
            },
            {
                uniqueName: "VoidFlood",
                name: toTitleCase(getString("/Lotus/Language/Missions/MissionName_Corruption", lang))
            },
            {
                uniqueName: "Excavation",
                name: toTitleCase(getString("/Lotus/Language/Missions/MissionName_Excavation", lang))
            },
            {
                uniqueName: "Defense",
                name: toTitleCase(getString("/Lotus/Language/Missions/MissionName_Defense", lang))
            },
            {
                uniqueName: "Exterminate",
                name: toTitleCase(getString("/Lotus/Language/Missions/MissionName_Exterminate", lang))
            },
            {
                uniqueName: "Assassination",
                name: toTitleCase(getString("/Lotus/Language/Missions/MissionName_Assassination", lang))
            },
            {
                uniqueName: "Alchemy",
                name: toTitleCase(getString("/Lotus/Language/Missions/MissionName_Alchemy", lang))
            }
        ]*/
        blueprintAndItem: getString("/Lotus/Language/Items/BlueprintAndItem", lang)
    };
    const eligibleForVault = new Set<string>([
        ...Object.values(ExportDojoRecipes.research).flatMap(r => r.ingredients.map(i => i.ItemType)),
        ...Object.values(ExportDojoRecipes.fabrications).flatMap(f => f.ingredients.map(i => i.ItemType)),
        ...Object.values(ExportDojoRecipes.rooms).flatMap(r => r.ingredients.map(i => i.ItemType)),
        ...Object.values(ExportDojoRecipes.decos).flatMap(d => d.ingredients.map(i => i.ItemType))
    ]);
    for (const [uniqueName, item] of Object.entries({ ...ExportWarframes, ...supplementalSuits })) {
        if (item.productCategory != "SpecialItems") {
            res[item.productCategory].push({
                uniqueName,
                name: getString(item.name, lang),
                exalted: item.exalted,
                maxLevelCap: item.maxLevelCap,
                badReason: uniqueName in supplementalSuits ? "metadataPatch" : undefined
            });
        }
        item.abilities.forEach(ability => {
            if (!res.Abilities.some(x => x.uniqueName == ability.uniqueName)) {
                res.Abilities.push({
                    uniqueName: ability.uniqueName,
                    name: getString(ability.name || uniqueName, lang)
                });
            }
        });
    }
    for (const [uniqueName, item] of Object.entries(ExportSentinels)) {
        if (item.productCategory == "Sentinels" || item.productCategory == "KubrowPets") {
            res[item.productCategory].push({
                uniqueName,
                name: getString(item.name, lang),
                exalted: item.exalted
            });
        }
    }
    for (const [uniqueName, item] of Object.entries(ExportWeapons)) {
        if (nonPlayerWeaponTypes.has(uniqueName)) continue;
        if (item.partType) {
            if (!uniqueName.split("/")[7]?.startsWith("PvPVariant")) {
                // not a pvp variant
                if (!uniqueName.startsWith("/Lotus/Types/Items/Deimos/")) {
                    res.ModularParts.push({
                        uniqueName,
                        name: getString(item.name, lang),
                        partType: item.partType
                    });
                }
                if (uniqueName.split("/")[5] != "SentTrainingAmplifier") {
                    res.miscitems.push({
                        uniqueName: uniqueName,
                        name: getString(item.name, lang),
                        parentName: item.parentName
                    });
                }
            }
        } else if (item.totalDamage !== 0) {
            if (
                item.productCategory == "LongGuns" ||
                item.productCategory == "Pistols" ||
                item.productCategory == "Melee" ||
                item.productCategory == "SpaceGuns" ||
                item.productCategory == "SpaceMelee" ||
                item.productCategory == "SentinelWeapons" ||
                item.productCategory == "OperatorAmps"
            ) {
                const listedItem: ListedItem = {
                    uniqueName,
                    name: getString(item.name, lang),
                    maxLevelCap: item.maxLevelCap,
                    parentName: item.parentName,
                    evolutionWeapon:
                        evolutionWeapons.has(uniqueName) || evolutionWeapons.has(item.parentName) ? true : undefined,
                    baseEvolutionWeapon: evolutionWeapons.has(uniqueName) ? true : undefined,
                    permanentEvolutionWeapon: permanentEvolutionWeapons.has(uniqueName) ? true : undefined
                };
                res[item.productCategory].push(listedItem);

                // Only allow the rifle part of a bayonet to be added via webui.
                if (item.bayonetOtherWeaponType && item.excludeFromMarket) {
                    listedItem.badReason = "notraw";
                }
            }
        } else if (!item.excludeFromCodex) {
            res.miscitems.push({
                uniqueName: uniqueName,
                name: getString(item.name, lang),
                parentName: item.parentName
            });
        }
    }
    for (const [uniqueName, item] of Object.entries(ExportResources)) {
        if (item.productCategory == "SupplyDrop") {
            continue; // skip helminth resources
        }
        let name = getNormalizedString(item.name, lang);
        if ("dissectionParts" in item) {
            name = getString("/Lotus/Language/Fish/FishDisplayName", lang).replaceAll("|FISH_NAME|", name);
            if (item.syndicateTag == "CetusSyndicate") {
                if (uniqueName.indexOf("Large") != -1) {
                    name = name.replaceAll("|FISH_SIZE|", getString("/Lotus/Language/Fish/FishSizeLargeAbbrev", lang));
                } else if (uniqueName.indexOf("Medium") != -1) {
                    name = name.replaceAll("|FISH_SIZE|", getString("/Lotus/Language/Fish/FishSizeMediumAbbrev", lang));
                } else {
                    name = name.replaceAll("|FISH_SIZE|", getString("/Lotus/Language/Fish/FishSizeSmallAbbrev", lang));
                }
            } else {
                if (uniqueName.indexOf("Large") != -1) {
                    name = name.replaceAll(
                        "|FISH_SIZE|",
                        getString("/Lotus/Language/SolarisVenus/RobofishAgeCategoryElderAbbrev", lang)
                    );
                } else if (uniqueName.indexOf("Medium") != -1) {
                    name = name.replaceAll(
                        "|FISH_SIZE|",
                        getString("/Lotus/Language/SolarisVenus/RobofishAgeCategoryMatureAbbrev", lang)
                    );
                } else {
                    name = name.replaceAll(
                        "|FISH_SIZE|",
                        getString("/Lotus/Language/SolarisVenus/RobofishAgeCategoryYoungAbbrev", lang)
                    );
                }
            }
        }
        if (item.productCategory == "ShipDecorations") {
            const target = isGlyphItem(uniqueName, item.name) ? res.BundleGlyphs : res.ShipDecorations;
            target.push({
                uniqueName: uniqueName,
                name: name,
                parentName: item.parentName
            });
        } else if (
            name &&
            !uniqueName.startsWith("/Lotus/Types/Game/Projections/") &&
            !uniqueName.startsWith("/Lotus/Types/Gameplay/Duviri/Resource/Fish/Duviri") && // Duviri fish seem to be present twice, but only the ones under /Lotus/Types/Items/Fish/Duviri/ can be used for the fish tank/vignette.
            uniqueName != "/Lotus/Types/Gameplay/EntratiLab/Resources/EntratiLanthornBundle"
        ) {
            res.miscitems.push({
                uniqueName: uniqueName,
                name: name,
                subtype: "Resource",
                parentName: item.parentName,
                ...(eligibleForVault.has(uniqueName) && { eligibleForVault: true })
            });
        }
    }
    for (const [uniqueName, item] of Object.entries(ExportRelics)) {
        const qualitySuffix =
            item.quality !== "VPQ_BRONZE"
                ? ` [${toTitleCase(getString(relicQualitySuffixes[item.quality], lang))}]`
                : "";

        res.miscitems.push({
            uniqueName: uniqueName,
            name:
                getString("/Lotus/Language/Relics/VoidProjectionName", lang)
                    .replaceAll("|ERA|", getString(`/Lotus/Language/Relics/Era_${item.era.toUpperCase()}`, lang))
                    .replaceAll("|CATEGORY|", item.category) + qualitySuffix
        });
    }
    for (const [uniqueName, item] of Object.entries(ExportGear)) {
        const target = isGlyphItem(uniqueName, item.name) ? res.BundleGlyphs : res.miscitems;
        target.push({
            uniqueName: uniqueName,
            name: getString(item.name, lang),
            subtype: "Gear",
            parentName: item.parentName
        });
    }
    const recipeNameTemplate = getString("/Lotus/Language/Items/BlueprintAndItem", lang);
    for (const [uniqueName, item] of Object.entries({ ...ExportRecipes, ...supplementalRecipes })) {
        if (!item.hidden && !(uniqueName in pseudoRecipeToOwnedRecipeMap)) {
            const resultName = getItemName(item.resultType);
            if (resultName) {
                let itemName = getString(resultName, lang);
                if (item.num > 1) itemName = `${itemName} X ${item.num}`;
                res.miscitems.push({
                    uniqueName: uniqueName,
                    name: recipeNameTemplate.replace("|ITEM|", itemName)
                });
            }
        }
    }
    for (const [uniqueName, item] of Object.entries(ExportDrones)) {
        res.miscitems.push({
            uniqueName: uniqueName,
            name: getString(item.name, lang)
        });
    }
    for (const [uniqueName, item] of Object.entries(ExportRailjackWeapons)) {
        res.miscitems.push({
            uniqueName: uniqueName,
            name: getString(item.name, lang),
            parentName: item.parentName
        });
    }
    for (const [uniqueName, item] of Object.entries(ExportCustoms)) {
        const fileName = uniqueName.substring(uniqueName.lastIndexOf("/") + 1);
        const isTennogen =
            item.name.startsWith("/Lotus/Language/SteamWorkshop/") ||
            uniqueName.includes("/SteamWorkshop/") ||
            uniqueName.includes("/Tennogen/") ||
            (/^SW[A-Z]/.test(fileName) && !fileName.startsWith("SW1999"));
        if (isGlyphItem(uniqueName, item.name)) {
            res.BundleGlyphs.push({
                uniqueName,
                name: getString(item.name, lang),
                alwaysAvailable: item.alwaysAvailable
            });
        } else if (isTennogen) {
            res.Tennogen.push({
                uniqueName,
                name: getString(item.name, lang),
                alwaysAvailable: item.alwaysAvailable
            });
        } else if (item.productCategory == "WeaponSkins") {
            if (
                !uniqueName.startsWith("/Lotus/Types/Game/Lotus") && // Base Items
                !uniqueName.endsWith("ProjectileSkin") && // UnrealTournament ProjectileSkins
                !uniqueName.endsWith("Coat") // Frost Prime stuff
            ) {
                res.WeaponSkins.push({
                    uniqueName: uniqueName,
                    name: getString(item.name, lang),
                    alwaysAvailable: item.alwaysAvailable
                });
            }
        } else /*if (item.productCategory == "CrewShipWeaponSkins")*/ {
            if (!item.alwaysAvailable) {
                res.miscitems.push({
                    uniqueName: uniqueName,
                    name: getString(item.name, lang)
                });
            }
        }
    }
    const suitAndSentinelTypes = new Set(
        [...res.Suits, ...res.Sentinels].map(item => item.uniqueName)
    );
    for (const [uniqueName, item] of Object.entries(ExportBundles)) {
        const componentTypeNames = item.components.map(component => component.typeName);
        const allComponentsMatch = (pattern: RegExp): boolean =>
            componentTypeNames.length > 0 && componentTypeNames.every(typeName => pattern.test(typeName));
        const isGeneBundle =
            /^\/Lotus\/Types\/StoreItems\/Packages\/(?:Kavat|Kubrow)(?:Base)?ColorPack/.test(uniqueName) ||
            allComponentsMatch(/KubrowPet\/(?:Colors|Patterns)|CatbrowPet\/(?:Colors|Patterns)|GeneMask/i);
        const target =
            /Heirloom/i.test(uniqueName)
                ? res.BundleHeirlooms
                : isGlyphItem(uniqueName, item.name) || allComponentsMatch(/AvatarImages|Glyph/i)
                  ? res.BundleGlyphs
                  : /TennoGen/i.test(uniqueName)
                    ? res.Tennogen
                    : uniqueName.startsWith("/Lotus/Types/StoreItems/Packages/IncarnonPackages/")
                      ? res.BundleIncarnons
                      : isGeneBundle
                        ? res.BundleGenes
                        : allComponentsMatch(/\/Boosters\//i)
                          ? res.BundleBoosters
                          : supplementalModBundleTypes.has(uniqueName) ||
                              allComponentsMatch(/\/Upgrades\/Mods\/(?!FusionBundles\/)/i)
                            ? res.BundleMods
                            : allComponentsMatch(/BobbleHead|Noggle/i)
                              ? res.BundleNoggles
                              : res.Bundles;
        if (
            target == res.Bundles &&
            componentTypeNames.some(typeName => {
                const internalTypeName = typeName.startsWith("/Lotus/StoreItems/")
                    ? "/Lotus/" + typeName.substring("/Lotus/StoreItems/".length)
                    : typeName;
                return suitAndSentinelTypes.has(internalTypeName);
            })
        ) {
            continue;
        }
        target.push({
            uniqueName,
            name: item.name ? getString(item.name, lang) : uniqueName.substring(uniqueName.lastIndexOf("/") + 1)
        });
    }

    for (const [uniqueName, upgrade] of Object.entries({ ...ExportUpgrades, ...supplementalUpgrades })) {
        const mod: ListedItem = {
            uniqueName,
            name: getString(upgrade.name, lang),
            fusionLimit: upgrade.fusionLimit
        };
        if (upgrade.isStarter) {
            mod.badReason = "starter";
        } else if (upgrade.isFrivolous) {
            mod.badReason = "frivolous";
        } else if (upgrade.upgradeEntries) {
            mod.badReason = "notraw";
        }
        if (upgrade.type == "PARAZON") {
            mod.parazon = true;
        }
        res.mods.push(mod);
    }
    {
        const uniqueItemTypes = [
            ...new Set(
                Object.values(suitDefaultUpgrades)
                    .flat()
                    .map(u => u.ItemType)
            )
        ];
        const abilityNameOverrides: Record<string, string> = {
            "/Lotus/Powersuits/AntiMatter/AntiMatterDropAbilityCard": "/Lotus/Language/Suits/DropAbilityName",
            "/Lotus/Powersuits/AntiMatter/NullStarAbilityCard": "/Lotus/Language/Suits/NullstarAbilityName",
            "/Lotus/Powersuits/Banshee/EarthQuakeAbilityCard": "/Lotus/Language/Suits/SoundquakeAbilityName",
            "/Lotus/Powersuits/Berserker/GrappleAbilityCard": "/Lotus/Language/Suits/GrappleHookAbilityName",
            "/Lotus/Powersuits/Berserker/IntimidateAbilityCard": "/Lotus/Language/Suits/BerserkerScreamAbilityName",
            "/Lotus/Powersuits/Berserker/ShieldBlastAbilityCard": "/Lotus/Language/Suits/ShieldBashAbilityName",
            "/Lotus/Powersuits/Cowgirl/RicochetArmourAbilityCard": "/Lotus/Language/Suits/RicochetArmorAbilityName",
            "/Lotus/Powersuits/Ember/FireSkinAbilityCard": "/Lotus/Language/Suits/OverheatAbilityName",
            "/Lotus/Powersuits/Excalibur/SuperJumpAbilityCard": "/Lotus/Language/Items/SuperJumpAbility",
            "/Lotus/Powersuits/Frost/IceShieldAbilityCard": "/Lotus/Language/Suits/SnowGlobeAbilityName",
            "/Lotus/Powersuits/Frost/IceSpikeAbilityCard": "/Lotus/Language/Suits/IceWaveAbilityName",
            "/Lotus/Powersuits/Frost/IcicleAbilityCard": "/Lotus/Language/Suits/FreezeAbilityName",
            "/Lotus/Powersuits/Harlequin/LightAbilityCard": "/Lotus/Language/Suits/EclipseAbilityName",
            "/Lotus/Powersuits/Harlequin/ObjectChangeAbilityCard": "/Lotus/Language/Suits/SleightOfHandAbilityName",
            "/Lotus/Powersuits/Harlequin/PrismAbilityCard": "/Lotus/Language/Suits/GrandFinaleName",
            "/Lotus/Powersuits/Jade/DaggerAbilityCard": "/Lotus/Language/Suits/PhysicDaggerAbilityName",
            "/Lotus/Powersuits/Jade/SelfBulletAttractorAbilityCard": "/Lotus/Language/Suits/AbsorbAbilityName",
            "/Lotus/Powersuits/Loki/DisarmAbilityCard": "/Lotus/Language/Suits/RadialDisarmAbilityName",
            "/Lotus/Powersuits/Loki/SwitchAbilityCard": "/Lotus/Language/Suits/SwitchTeleportAbilityName",
            "/Lotus/Powersuits/Ninja/TelelportToAbilityCard": "/Lotus/Language/Suits/TeleportToAbilityName",
            "/Lotus/Powersuits/Pirate/LiquifyAbilityCard": "/Lotus/Language/Suits/LiquefyAbilityName",
            "/Lotus/Powersuits/Rhino/RadialBlastAbilityCard": "/Lotus/Language/Suits/RhinoRoarAbilityName",
            "/Lotus/Powersuits/Tengu/DiveBombAbilityCard": "/Lotus/Language/Suits/ZephyrDiveBombAbilityName",
            "/Lotus/Powersuits/Tengu/TailWindAbilityCard": "/Lotus/Language/Suits/ZephyrTailWindAbilityName",
            "/Lotus/Powersuits/Tengu/TornadoAbilityCard": "/Lotus/Language/Suits/ZephyrTornadoAbilityName",
            "/Lotus/Powersuits/Tengu/TurbulenceAbilityCard": "/Lotus/Language/Suits/ZephyrTurbulenceAbilityName",
            "/Lotus/Powersuits/Trapper/BounceTrapAbilityCard": "/Lotus/Language/Suits/TrapperMultinadeAbilityName",
            "/Lotus/Powersuits/Volt/OverloadAbilityCard": "/Lotus/Language/Suits/OverLoadAbilityName"
        };
        for (const uniqueName of uniqueItemTypes) {
            let locStr: string;

            if (abilityNameOverrides[uniqueName]) {
                locStr = abilityNameOverrides[uniqueName];
            } else {
                const abilityBase = uniqueName.split("/").pop()!.replace(/Card$/, "");
                locStr = `/Lotus/Language/Suits/${abilityBase}Name`;
            }
            res.mods.push({
                uniqueName,
                name: getString(locStr, lang),
                fusionLimit: 3
            });
        }
    }
    for (const [uniqueName, upgrade] of Object.entries(ExportAvionics)) {
        res.mods.push({
            uniqueName,
            name: getString(upgrade.name, lang),
            fusionLimit: upgrade.fusionLimit
        });
    }
    for (const [uniqueName, arcane] of Object.entries(ExportArcanes)) {
        if (uniqueName.substring(0, 18) != "/Lotus/Types/Game/") {
            const mod: ListedItem = {
                uniqueName,
                name: getString(arcane.name, lang),
                fusionLimit: arcane.fusionLimit
            };
            if (arcane.excludeFromCodex) {
                mod.badReason = "frivolous";
            }
            res.mods.push(mod);
        }
    }
    for (const [uniqueName, syndicate] of Object.entries(ExportSyndicates)) {
        res.Syndicates.push({
            uniqueName,
            name: getString(syndicate.name, lang)
        });
    }
    for (const [uniqueName, key] of Object.entries({ ...ExportKeys, ...supplementalKeys })) {
        if (key.chainStages) {
            res.QuestKeys.push({
                uniqueName,
                name: getString(key.name || "", lang),
                chainLength: key.chainStages.length
            });
        } else if (key.name) {
            res.miscitems.push({
                uniqueName,
                name: getString(key.name, lang),
                parentName: key.parentName
            });
        }
    }

    for (const item of Object.values(ExportBoosters)) {
        res.Boosters.push({
            uniqueName: item.typeName,
            name: getString(item.name, lang)
        });
    }

    for (const uniqueName of Object.keys(varzia.primeDualPacks)) {
        res.VarziaOffers.push({
            uniqueName,
            name: getString(getItemName(uniqueName) || uniqueName, lang)
        });
    }

    for (const [uniqueName, ability] of Object.entries(ExportAbilities)) {
        res.Abilities.push({
            uniqueName,
            name: getString(ability.name || uniqueName, lang)
        });
    }

    for (const uniqueName of Object.keys(ExportDojoRecipes.research)) {
        if (
            !["Zekti", "Vidar", "Lavan"].some(house => uniqueName.includes(house)) &&
            !uniqueName.startsWith("/Lotus/Types/Items/ShipFeatureItems/Railjack/")
        ) {
            let resultType;
            if (uniqueName in ExportRecipes) {
                resultType = ExportRecipes[uniqueName].resultType;
            } else if (uniqueName in ExportDojoRecipes.fabrications) {
                resultType = ExportDojoRecipes.fabrications[uniqueName].resultType;
            } else if (uniqueName.startsWith("/Lotus/Types/Game/")) {
                resultType = uniqueName.replace("Blueprint", "");
            } else {
                resultType = uniqueName;
            }

            let name = getString(getItemName(resultType) || resultType, lang);

            if (uniqueName in ExportRecipes) {
                const recipeNum = ExportRecipes[uniqueName].num;
                if (recipeNum > 1) {
                    name = `${name} X ${recipeNum}`;
                }
            }

            res.TechProjects.push({
                uniqueName,
                name
            });
        }
    }

    for (const uniqueName of [
        ...Object.entries(ExportDojoRecipes.decos)
            .filter(([_, data]) => data.requiredInVault)
            .map(([uniqueName]) => uniqueName),
        // not requiredInVault:
        "/Lotus/Levels/ClanDojo/ComponentPropRecipes/PlagueStarEventTrophyBronzeRecipe",
        "/Lotus/Levels/ClanDojo/ComponentPropRecipes/PlagueStarEventTrophyGoldRecipe",
        "/Lotus/Levels/ClanDojo/ComponentPropRecipes/PlagueStarEventTrophySilverRecipe",
        "/Lotus/Levels/ClanDojo/ComponentPropRecipes/PlagueStarEventTrophyTerracottaRecipe"
        // removed in 38.6.0:
        // "/Lotus/Levels/ClanDojo/ComponentPropRecipes/ThumperTrophyBronzeRecipe",
        // "/Lotus/Levels/ClanDojo/ComponentPropRecipes/ThumperTrophyCrystalRecipe",
        // "/Lotus/Levels/ClanDojo/ComponentPropRecipes/ThumperTrophyGoldRecipe",
        // "/Lotus/Levels/ClanDojo/ComponentPropRecipes/ThumperTrophySilverRecipe",
        // "/Lotus/Levels/ClanDojo/ComponentPropRecipes/NaturalPlaceables/CoralChunkARecipe"
    ]) {
        let name = getString(getItemName(uniqueName) || uniqueName, lang);
        if (uniqueName.startsWith("/Lotus/Levels/ClanDojo/ComponentPropRecipes/GradivusDilemma")) {
            const factionTag = uniqueName.includes("Corpus") ? "FC_CORPUS" : "FC_GRINEER";
            const faction = ExportFactions[factionTag].name;
            name += ` [${getString(faction || factionTag, lang)}]`;
        }
        res.VaultDecoRecipes.push({
            uniqueName,
            name
        });
    }

    for (const [uniqueName, item] of Object.entries(ExportFlavour)) {
        const target = /Colou?rPicker/i.test(uniqueName)
            ? res.ColorPalettes
            : isGlyphItem(uniqueName, item.name)
              ? res.BundleGlyphs
              : res.FlavourItems;
        target.push({
            uniqueName,
            name: getString(item.name, lang),
            alwaysAvailable: item.alwaysAvailable
        });
    }

    for (const [uniqueName, item] of Object.entries(ExportMissionTypes)) {
        res.MissionTypes.push({
            uniqueName,
            name: toTitleCase(getString(item.name || "", lang))
        });
    }

    for (const [uniqueName, node] of Object.entries(ExportRegions)) {
        res.Nodes.push({
            uniqueName,
            name: getString(node.name || uniqueName, lang)
        });
    }

    for (const [uniqueName, mod] of Object.entries(U5Modules)) {
        res.mods.push({
            uniqueName,
            name: mod.name
                ? getString(mod.name || uniqueName, lang)
                : getString(getItemName(mod.fits[0].type) || uniqueName, lang),
            fusionLimit: 0,
            fits: mod.fits,
            upgrades: mod.upgrades,
            badReason: "u5mod"
        });
    }

    for (const [uniqueName, name] of Object.entries(nightwaveTagToSeasonName)) {
        res.NightwaveTags.push({
            uniqueName,
            name: getString(name, lang) || name
        });
    }

    for (const [uniqueName, name] of Object.entries(supplementalItemNames)) {
        res.AdditionalDict.push({
            uniqueName,
            name: getString(name, lang)
        });
    }

    for (const uniqueName of supplementalDict) {
        res.AdditionalDict.push({
            uniqueName,
            name: getString(uniqueName, lang)
        });
    }

    const normalizeStoreItemType = (typeName: string): string =>
        typeName.startsWith("/Lotus/StoreItems/")
            ? "/Lotus/" + typeName.substring("/Lotus/StoreItems/".length)
            : typeName;
    const knownItems = new Map<string, ListedItem>();
    for (const list of Object.values(res)) {
        if (!Array.isArray(list)) continue;
        for (const item of list as ListedItem[]) knownItems.set(normalizeStoreItemType(item.uniqueName), item);
    }
    const seasonalOffers = [
        ...dogDaysFlashSales,
        ...saintPatrickDayFlashSales,
        ...prideMonthFlashSales,
        ...tennobaumFlashSales,
        ...naberusNightsFlashSales,
        ...lunarNewYearAllFlashSales
    ];
    const seasonalByType = new Map(seasonalOffers.map(offer => [normalizeStoreItemType(offer.TypeName), offer]));
    const seasonalSupplementalNameKeys = new Map([
        ["/Lotus/Upgrades/Skins/Clan/LNY2026HorseGlyph", "/Lotus/Language/Seasonal/LNY2026HorseGlyphName"]
    ]);
    for (const [uniqueName, offer] of seasonalByType) {
        const knownItem = knownItems.get(uniqueName);
        const nameKey =
            getItemName(uniqueName) ?? getItemName(offer.TypeName) ?? seasonalSupplementalNameKeys.get(uniqueName);
        const listedItem: ListedItem = {
            uniqueName,
            name:
                knownItem?.name ??
                (nameKey ? getString(nameKey, lang) : uniqueName.substring(uniqueName.lastIndexOf("/") + 1)),
            marketCreditsPrice: typeof offer.RegularOverride == "number" ? offer.RegularOverride : null,
            marketPlatinumPrice: typeof offer.PremiumOverride == "number" ? offer.PremiumOverride : null
        };
        const isGlyph = isGlyphItem(uniqueName, nameKey);
        if (isGlyph) {
            const existing = res.BundleGlyphs.find(item => normalizeStoreItemType(item.uniqueName) == uniqueName);
            if (existing) {
                existing.marketCreditsPrice = listedItem.marketCreditsPrice;
                existing.marketPlatinumPrice = listedItem.marketPlatinumPrice;
            } else {
                res.BundleGlyphs.push(listedItem);
            }
        } else {
            res.Seasonal.push(listedItem);
        }
    }

    return res;
};

const getItemListsController: RequestHandler = (req, response) => {
    response.json(getItemLists(typeof req.query.lang == "string" ? req.query.lang : "en"));
};

export { getItemListsController };
