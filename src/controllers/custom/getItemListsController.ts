import { RequestHandler } from "express";
import { getDict, getItemName, getString } from "@/src/services/itemDataService";
import {
    ExportArcanes,
    ExportAvionics,
    ExportGear,
    ExportMisc,
    ExportRecipes,
    ExportResources,
    ExportSentinels,
    ExportSyndicates,
    ExportUpgrades,
    ExportWarframes,
    ExportWeapons
} from "warframe-public-export-plus";
import archonCrystalUpgrades from "@/static/fixed_responses/webuiArchonCrystalUpgrades.json";

interface ListedItem {
    uniqueName: string;
    name: string;
    fusionLimit?: number;
    exalted?: string[];
}

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
    for (const [uniqueName, item] of Object.entries(ExportWarframes)) {
        if (
            item.productCategory == "Suits" ||
            item.productCategory == "SpaceSuits" ||
            item.productCategory == "MechSuits"
        ) {
            res[item.productCategory].push({
                uniqueName,
                name: getString(item.name, lang),
                exalted: item.exalted
            });
        }
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
        if (
            uniqueName.split("/")[4] == "OperatorAmplifiers" ||
            uniqueName.split("/")[5] == "SUModularSecondarySet1" ||
            uniqueName.split("/")[5] == "SUModularPrimarySet1" ||
            uniqueName.split("/")[5] == "InfKitGun" ||
            uniqueName.split("/")[5] == "HoverboardParts"
        ) {
            res.ModularParts.push({
                uniqueName,
                name: getString(item.name, lang)
            });
            if (uniqueName.split("/")[5] != "SentTrainingAmplifier") {
                res.miscitems.push({
                    uniqueName: "MiscItems:" + uniqueName,
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
                item.productCategory == "SentinelWeapons"
            ) {
                res[item.productCategory].push({
                    uniqueName,
                    name: getString(item.name, lang)
                });
            }
        } else if (!item.excludeFromCodex) {
            res.miscitems.push({
                uniqueName: "MiscItems:" + uniqueName,
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
        res.miscitems.push({
            uniqueName: item.productCategory + ":" + uniqueName,
            name: name
        });
    }
    for (const [uniqueName, item] of Object.entries(ExportGear)) {
        res.miscitems.push({
            uniqueName: "Consumables:" + uniqueName,
            name: getString(item.name, lang)
        });
    }
    const recipeNameTemplate = getString("/Lotus/Language/Items/BlueprintAndItem", lang);
    for (const [uniqueName, item] of Object.entries(ExportRecipes)) {
        if (!item.hidden) {
            const resultName = getItemName(item.resultType);
            if (resultName) {
                res.miscitems.push({
                    uniqueName: "Recipes:" + uniqueName,
                    name: recipeNameTemplate.replace("|ITEM|", getString(resultName, lang))
                });
            }
        }
    }

    res.mods = [];
    const badItems: Record<string, boolean> = {};
    for (const [uniqueName, upgrade] of Object.entries(ExportUpgrades)) {
        res.mods.push({
            uniqueName,
            name: getString(upgrade.name, lang),
            fusionLimit: upgrade.fusionLimit
        });
        if (upgrade.isStarter || upgrade.isFrivolous || upgrade.upgradeEntries) {
            badItems[uniqueName] = true;
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
        res.mods.push({
            uniqueName,
            name: getString(arcane.name, lang)
        });
        if (arcane.isFrivolous) {
            badItems[uniqueName] = true;
        }
    }
    for (const [uniqueName, syndicate] of Object.entries(ExportSyndicates)) {
        res.Syndicates.push({
            uniqueName,
            name: getString(syndicate.name, lang)
        });
    }

    response.json({
        badItems,
        archonCrystalUpgrades,
        uniqueLevelCaps: ExportMisc.uniqueLevelCaps,
        ...res
    });
};

export { getItemListsController };
