import { RequestHandler } from "express";
import { getDict, getExalted, getItemName, getString } from "@/src/services/itemDataService";
import {
    ExportArcanes,
    ExportGear,
    ExportRecipes,
    ExportResources,
    ExportSentinels,
    ExportUpgrades,
    ExportWarframes,
    ExportWeapons
} from "warframe-public-export-plus";
import archonCrystalUpgrades from "@/static/fixed_responses/webuiArchonCrystalUpgrades.json";

interface ListedItem {
    uniqueName: string;
    name: string;
    fusionLimit?: number;
    exalted?: { uniqueName: string; name: string }[];
}

const getItemListsController: RequestHandler = (req, res) => {
    const lang = getDict(typeof req.query.lang == "string" ? req.query.lang : "en");
    const weapons = [];
    const miscitems = [];
    const warframes = [];
    for (const [uniqueName, item] of Object.entries(ExportWarframes)) {
        if (item.productCategory == "Suits") {
            const warframe: ListedItem = {
                uniqueName,
                name: getString(item.name, lang)
            };
            const exalted = getExalted(uniqueName);
            if (exalted) {
                warframe.exalted = [];
                exalted.forEach(element => {
                    const exalted = ExportWeapons[element] || ExportSentinels[element];
                    warframe.exalted?.push({
                        uniqueName: element,
                        name: getString(exalted.name, lang)
                    });
                });
            }
            warframes.push(warframe);
        }
    }
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
        miscitems.push({
            uniqueName: item.productCategory + ":" + uniqueName,
            name: getString(item.name, lang)
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
        if (!item.secretIngredientAction) {
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
        warframes,
        weapons,
        miscitems,
        mods,
        badItems,
        archonCrystalUpgrades
    });
};

export { getItemListsController };
