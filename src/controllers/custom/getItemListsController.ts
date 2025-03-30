import { RequestHandler } from "express";
import { getDict, getItemName, getString } from "@/src/services/itemDataService";
import {
    ExportArcanes,
    ExportAvionics,
    ExportDrones,
    ExportGear,
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
}

const relicQualitySuffixes: Record<TRelicQuality, string> = {
    VPQ_BRONZE: "",
    VPQ_SILVER: " [Flawless]",
    VPQ_GOLD: " [Radiant]",
    VPQ_PLATINUM: " [Exceptional]"
};

const getItemListsController: RequestHandler = (req, response) => {
    const lang = getDict(typeof req.query.lang == "string" ? req.query.lang : "en");
    const res: Record<string, ListedItem[]> = {};
    res.Suits = [];
    res.LongGuns = [];
    res.Melee = [];
    res.ModularParts = [];
    res.Pistols = [];
    res.Sentinels = [];
    res.SentinelWeapons = [];
    res.SpaceGuns = [];
    res.SpaceMelee = [];
    res.SpaceSuits = [];
    res.MechSuits = [];
    res.miscitems = [];
    res.Syndicates = [];
    res.OperatorAmps = [];
    for (const [uniqueName, item] of Object.entries(ExportWarframes)) {
        res[item.productCategory].push({
            uniqueName,
            name: getString(item.name, lang),
            exalted: item.exalted
        });
    }
    for (const [uniqueName, item] of Object.entries(ExportSentinels)) {
        if (item.productCategory == "Sentinels") {
            res[item.productCategory].push({
                uniqueName,
                name: getString(item.name, lang)
            });
        }
    }
    for (const [uniqueName, item] of Object.entries(ExportWeapons)) {
        if (item.partType) {
            res.ModularParts.push({
                uniqueName,
                name: getString(item.name, lang),
                partType: item.partType
            });
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
            if (uniqueName.indexOf("Large") != -1) {
                name = name.split("|FISH_SIZE|").join(getString("/Lotus/Language/Fish/FishSizeLargeAbbrev", lang));
            } else if (uniqueName.indexOf("Medium") != -1) {
                name = name.split("|FISH_SIZE|").join(getString("/Lotus/Language/Fish/FishSizeMediumAbbrev", lang));
            } else {
                name = name.split("|FISH_SIZE|").join(getString("/Lotus/Language/Fish/FishSizeSmallAbbrev", lang));
            }
        }
        if (
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
                res.miscitems.push({
                    uniqueName: uniqueName,
                    name: recipeNameTemplate.replace("|ITEM|", getString(resultName, lang))
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

    res.mods = [];
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

    response.json({
        archonCrystalUpgrades,
        uniqueLevelCaps: ExportMisc.uniqueLevelCaps,
        ...res
    });
};

export { getItemListsController };
