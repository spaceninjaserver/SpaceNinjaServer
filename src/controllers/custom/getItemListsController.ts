import { RequestHandler } from "express";
import { MinItem, MinWeapon, warframes, items, getEnglishString } from "@/src/services/itemDataService";
import badItems from "@/static/json/exclude-mods.json";
import { ExportArcanes, ExportWeapons } from "warframe-public-export-plus";

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
    const mods = reduceItems(items.filter(item => item.category == "Mods"));
    for (const [uniqueName, arcane] of Object.entries(ExportArcanes)) {
        mods.push({
            uniqueName: uniqueName,
            name: getEnglishString(arcane.name)
        });
    }
    res.json({
        warframes: reduceItems(warframes),
        weapons: Object.entries(ExportWeapons)
            .filter(([_uniqueName, weapon]) => weapon.productCategory !== "OperatorAmps" && weapon.totalDamage !== 0)
            .map(([uniqueName, weapon]) => {
                return {
                    uniqueName,
                    name: getEnglishString(weapon.name)
                };
            }),
        miscitems: reduceItems(
            items.filter(
                item =>
                    item.category == "Misc" ||
                    item.category == "Resources" ||
                    item.category == "Fish" ||
                    ((item as any).productCategory == "Pistols" && (item as MinWeapon).totalDamage == 0)
            )
        ),
        mods,
        badItems
    });
};

export { getItemListsController };
