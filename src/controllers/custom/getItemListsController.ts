import { RequestHandler } from "express";
import { getDict, getItemName, getString } from "@/src/services/itemDataService";
import {
    ExportArcanes,
    ExportAvionics,
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
    ExportWeapons,
    TRelicQuality
} from "warframe-public-export-plus";
import archonCrystalUpgrades from "@/static/fixed_responses/webuiArchonCrystalUpgrades.json";

interface ListedItem {
    uniqueName: string;
    name: string;
    fusionLimit?: number;
    exalted?: string[];
    badReason?: "starter" | "frivolous" | "notraw";
    partType?: string;
    chainLength?: number;
    parazon?: boolean;
}

interface ItemLists {
    archonCrystalUpgrades: Record<string, string>;
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
    mods: ListedItem[];
}

const relicQualitySuffixes: Record<TRelicQuality, string> = {
    VPQ_BRONZE: "",
    VPQ_SILVER: " [Flawless]",
    VPQ_GOLD: " [Radiant]",
    VPQ_PLATINUM: " [Exceptional]"
};

const getItemListsController: RequestHandler = (req, response) => {
    const lang = getDict(typeof req.query.lang == "string" ? req.query.lang : "en");
    const res: ItemLists = {
        archonCrystalUpgrades,
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
        mods: []
    };
    for (const [uniqueName, item] of Object.entries(ExportWarframes)) {
        res[item.productCategory].push({
            uniqueName,
            name: getString(item.name, lang),
            exalted: item.exalted
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
                name: name
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
            name: getString(item.name, lang)
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

    response.json(res);
};

export { getItemListsController };
