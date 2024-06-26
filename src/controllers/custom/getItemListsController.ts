import { RequestHandler } from "express";
import { getString } from "@/src/services/itemDataService";
import {
    ExportArcanes,
    ExportGear,
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
    const weapons = [];
    const miscitems = [];
    const lang = req.query.lang?.toString()
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
            uniqueName: "MiscItems:" + uniqueName,
            name: getString(item.name, lang)
        });
    }
    for (const [uniqueName, item] of Object.entries(ExportGear)) {
        miscitems.push({
            uniqueName: "Consumables:" + uniqueName,
            name: getString(item.name, lang)
        });
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
    }

    res.json({
        warframes: Object.entries(ExportWarframes)
            .filter(([_uniqueName, warframe]) => warframe.productCategory == "Suits")
            .map(([uniqueName, warframe]) => {
                return {
                    uniqueName,
                    name: getString(warframe.name, lang)
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
