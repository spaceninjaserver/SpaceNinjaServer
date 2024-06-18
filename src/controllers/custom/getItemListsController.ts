import { RequestHandler } from "express";
import { MinItem, items, getEnglishString } from "@/src/services/itemDataService";
import badItems from "@/static/json/exclude-mods.json";
import { ExportArcanes, ExportResources, ExportWarframes, ExportWeapons } from "warframe-public-export-plus";

interface ListedItem {
    uniqueName: string;
    name: string;
    fusionLimit?: number;
}

function reduceItems(items: MinItem[]): ListedItem[] {
    return items.map((item: MinItem): ListedItem => {
        return {
            uniqueName: item.uniqueName,
            name: item.name,
            fusionLimit: (item as any).fusionLimit
        };
    });
}

const getItemListsController: RequestHandler = (_req, res) => {
    const weapons = [];
    const miscitems = [];
    for (const [uniqueName, item] of Object.entries(ExportWeapons)) {
        if (item.productCategory !== "OperatorAmps") {
            if (item.totalDamage !== 0) {
                weapons.push({
                    uniqueName,
                    name: getEnglishString(item.name)
                });
            } else if (!item.excludeFromCodex) {
                miscitems.push({
                    uniqueName,
                    name: getEnglishString(item.name)
                });
            }
        }
    }
    for (const [uniqueName, item] of Object.entries(ExportResources)) {
        miscitems.push({
            uniqueName,
            name: getEnglishString(item.name)
        });
    }

    const mods = reduceItems(items.filter(item => item.category == "Mods"));
    for (const [uniqueName, arcane] of Object.entries(ExportArcanes)) {
        mods.push({
            uniqueName: uniqueName,
            name: getEnglishString(arcane.name)
        });
    }

    res.json({
        warframes: Object.entries(ExportWarframes)
            .filter(([_uniqueName, warframe]) => warframe.productCategory == "Suits")
            .map(([uniqueName, warframe]) => {
                return {
                    uniqueName,
                    name: getEnglishString(warframe.name)
                };
            }),
        weapons,
        miscitems,
        mods,
        badItems
    });
};

export { getItemListsController };
