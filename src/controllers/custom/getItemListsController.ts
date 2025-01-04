import { RequestHandler } from "express";
import { getDict, getItemName, getString } from "@/src/services/itemDataService";
import {
    ExportArcanes,
    ExportGear,
    ExportRecipes,
    ExportResources,
    ExportUpgrades,
    ExportWarframes,
    ExportWeapons
} from "warframe-public-export-plus";
import archonCrystalUpgrades from "@/static/fixed_responses/webuiArchonCrystalUpgrades.json";

interface ListedItem {
    uniqueName: string;
    name: string;
    fusionLimit?: number;
}

const getItemListsController: RequestHandler = (req, res) => {
    const lang = getDict(typeof req.query.lang == "string" ? req.query.lang : "en");
    const weapons = [];
    const miscitems = [];
    for (const [uniqueName, item] of Object.entries(ExportWeapons)) {
        if (item.productCategory !== "OperatorAmps") {
            if (item.totalDamage !== 0) {
                weapons.push({
                    uniqueName,
                    name: getString(item.name, lang)
                });
            } else if (!item.excludeFromCodex) {
                miscitems.push({
                    uniqueName: "MiscItems:" + uniqueName,
                    name: getString(item.name, lang)
                });
            }
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
        miscitems.push({
            uniqueName: item.productCategory + ":" + uniqueName,
            name: name
        });
    }
    for (const [uniqueName, item] of Object.entries(ExportGear)) {
        miscitems.push({
            uniqueName: "Consumables:" + uniqueName,
            name: getString(item.name, lang)
        });
    }
    const recipeNameTemplate = getString("/Lotus/Language/Items/BlueprintAndItem", lang);
    for (const [uniqueName, item] of Object.entries(ExportRecipes)) {
        if (!item.hidden) {
            const resultName = getItemName(item.resultType);
            if (resultName) {
                miscitems.push({
                    uniqueName: "Recipes:" + uniqueName,
                    name: recipeNameTemplate.replace("|ITEM|", getString(resultName, lang))
                });
            }
        }
    }

    const mods: ListedItem[] = [];
    const badItems: Record<string, boolean> = {};
    for (const [uniqueName, upgrade] of Object.entries(ExportUpgrades)) {
        mods.push({
            uniqueName,
            name: getString(upgrade.name, lang),
            fusionLimit: upgrade.fusionLimit
        });
        if (upgrade.isStarter || upgrade.isFrivolous || upgrade.upgradeEntries) {
            badItems[uniqueName] = true;
        }
    }
    for (const [uniqueName, arcane] of Object.entries(ExportArcanes)) {
        mods.push({
            uniqueName,
            name: getString(arcane.name, lang)
        });
        if (arcane.isFrivolous) {
            badItems[uniqueName] = true;
        }
    }

    res.json({
        warframes: Object.entries(ExportWarframes)
            .filter(([_uniqueName, warframe]) => warframe.productCategory == "Suits")
            .map(([uniqueName, warframe]) => {
                return {
                    uniqueName,
                    name: getString(warframe.name, lang),
                    exalted: warframe.exalted
                };
            }),
        weapons,
        miscitems,
        mods,
        badItems,
        archonCrystalUpgrades
    });
};

export { getItemListsController };
