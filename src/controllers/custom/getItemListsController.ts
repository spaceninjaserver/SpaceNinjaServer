import type { RequestHandler } from "express";
import { getDict, getItemName, getString } from "@/src/services/itemDataService";
import type { TRelicQuality } from "warframe-public-export-plus";
import {
    ExportAbilities,
    ExportArcanes,
    ExportAvionics,
    ExportBoosters,
    ExportCustoms,
    ExportDrones,
    ExportGear,
    ExportKeys,
    ExportMisc,
    ExportRailjackWeapons,
    ExportRecipes,
    ExportRelics,
    ExportResources,
    ExportSentinels,
    ExportSyndicates,
    ExportUpgrades,
    ExportWarframes,
    ExportWeapons
} from "warframe-public-export-plus";
import allIncarnons from "@/static/fixed_responses/allIncarnonList.json";
import varzia from "@/static/fixed_responses/worldState/varzia.json";

interface ListedItem {
    uniqueName: string;
    name: string;
    subtype?: string;
    fusionLimit?: number;
    exalted?: string[];
    badReason?: "starter" | "frivolous" | "notraw";
    partType?: string;
    chainLength?: number;
    parazon?: boolean;
}

interface ItemLists {
    uniqueLevelCaps: Record<string, number>;
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
    EvolutionProgress: ListedItem[];
    mods: ListedItem[];
    Boosters: ListedItem[];
    VarziaOffers: ListedItem[];
    Abilities: ListedItem[];
    //circuitGameModes: ListedItem[];
}

const relicQualitySuffixes: Record<TRelicQuality, string> = {
    VPQ_BRONZE: "",
    VPQ_SILVER: " [Flawless]",
    VPQ_GOLD: " [Radiant]",
    VPQ_PLATINUM: " [Exceptional]"
};

/*const toTitleCase = (str: string): string => {
    return str.replace(/[^\s-]+/g, word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
};*/

const getItemListsController: RequestHandler = (req, response) => {
    const lang = getDict(typeof req.query.lang == "string" ? req.query.lang : "en");
    const res: ItemLists = {
        uniqueLevelCaps: ExportMisc.uniqueLevelCaps,
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
        EvolutionProgress: [],
        mods: [],
        Boosters: [],
        VarziaOffers: [],
        Abilities: []
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
    };
    for (const [uniqueName, item] of Object.entries(ExportWarframes)) {
        res[item.productCategory].push({
            uniqueName,
            name: getString(item.name, lang),
            exalted: item.exalted
        });
        item.abilities.forEach(ability => {
            res.Abilities.push({
                uniqueName: ability.uniqueName,
                name: getString(ability.name || uniqueName, lang)
            });
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
                        name: getString(item.name, lang)
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
                res[item.productCategory].push({
                    uniqueName,
                    name: getString(item.name, lang)
                });
            }
        } else if (!item.excludeFromCodex) {
            res.miscitems.push({
                uniqueName: uniqueName,
                name: getString(item.name, lang)
            });
        }
    }
    for (const [uniqueName, item] of Object.entries(ExportResources)) {
        let name = getString(item.name, lang);
        if ("dissectionParts" in item) {
            name = getString("/Lotus/Language/Fish/FishDisplayName", lang).split("|FISH_NAME|").join(name);
            if (item.syndicateTag == "CetusSyndicate") {
                if (uniqueName.indexOf("Large") != -1) {
                    name = name.split("|FISH_SIZE|").join(getString("/Lotus/Language/Fish/FishSizeLargeAbbrev", lang));
                } else if (uniqueName.indexOf("Medium") != -1) {
                    name = name.split("|FISH_SIZE|").join(getString("/Lotus/Language/Fish/FishSizeMediumAbbrev", lang));
                } else {
                    name = name.split("|FISH_SIZE|").join(getString("/Lotus/Language/Fish/FishSizeSmallAbbrev", lang));
                }
            } else {
                if (uniqueName.indexOf("Large") != -1) {
                    name = name
                        .split("|FISH_SIZE|")
                        .join(getString("/Lotus/Language/SolarisVenus/RobofishAgeCategoryElderAbbrev", lang));
                } else if (uniqueName.indexOf("Medium") != -1) {
                    name = name
                        .split("|FISH_SIZE|")
                        .join(getString("/Lotus/Language/SolarisVenus/RobofishAgeCategoryMatureAbbrev", lang));
                } else {
                    name = name
                        .split("|FISH_SIZE|")
                        .join(getString("/Lotus/Language/SolarisVenus/RobofishAgeCategoryYoungAbbrev", lang));
                }
            }
        }
        if (
            name &&
            uniqueName.substr(0, 30) != "/Lotus/Types/Game/Projections/" &&
            uniqueName != "/Lotus/Types/Gameplay/EntratiLab/Resources/EntratiLanthornBundle"
        ) {
            res.miscitems.push({
                uniqueName: uniqueName,
                name: name,
                subtype: "Resource"
            });
        }
    }
    for (const [uniqueName, item] of Object.entries(ExportRelics)) {
        res.miscitems.push({
            uniqueName: uniqueName,
            name:
                getString("/Lotus/Language/Relics/VoidProjectionName", lang)
                    .split("|ERA|")
                    .join(item.era)
                    .split("|CATEGORY|")
                    .join(item.category) + relicQualitySuffixes[item.quality]
        });
    }
    for (const [uniqueName, item] of Object.entries(ExportGear)) {
        res.miscitems.push({
            uniqueName: uniqueName,
            name: getString(item.name, lang),
            subtype: "Gear"
        });
    }
    const recipeNameTemplate = getString("/Lotus/Language/Items/BlueprintAndItem", lang);
    for (const [uniqueName, item] of Object.entries(ExportRecipes)) {
        if (!item.hidden) {
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
            name: getString(item.name, lang)
        });
    }
    for (const [uniqueName, item] of Object.entries(ExportCustoms)) {
        res.miscitems.push({
            uniqueName: uniqueName,
            name: getString(item.name, lang)
        });
    }

    for (const [uniqueName, upgrade] of Object.entries(ExportUpgrades)) {
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
                name: getString(arcane.name, lang)
            };
            if (arcane.isFrivolous) {
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
    for (const [uniqueName, key] of Object.entries(ExportKeys)) {
        if (key.chainStages) {
            res.QuestKeys.push({
                uniqueName,
                name: getString(key.name || "", lang),
                chainLength: key.chainStages.length
            });
        } else if (key.name) {
            res.miscitems.push({
                uniqueName,
                name: getString(key.name, lang)
            });
        }
    }
    for (const uniqueName of allIncarnons) {
        res.EvolutionProgress.push({
            uniqueName,
            name: getString(getItemName(uniqueName) || "", lang)
        });
    }

    for (const item of Object.values(ExportBoosters)) {
        res.Boosters.push({
            uniqueName: item.typeName,
            name: getString(item.name, lang)
        });
    }

    for (const item of Object.values(varzia.primeDualPacks)) {
        res.VarziaOffers.push({
            uniqueName: item.ItemType,
            name: getString(getItemName(item.ItemType) || "", lang)
        });
    }

    for (const [uniqueName, ability] of Object.entries(ExportAbilities)) {
        res.Abilities.push({
            uniqueName,
            name: getString(ability.name || uniqueName, lang)
        });
    }

    response.json(res);
};

export { getItemListsController };
