import { RequestHandler } from "express";
import { MinItem, MinWeapon, warframes, weapons, items, getEnglishString } from "@/src/services/itemDataService";
import badItems from "@/static/json/exclude-mods.json";
import ExportArcanes from "@/node_modules/warframe-public-export-plus/ExportArcanes.json";

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
        weapons: reduceItems(weapons.filter(item => item.productCategory != "OperatorAmps" && item.totalDamage != 0)),
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
