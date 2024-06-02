import { RequestHandler } from "express";
import { MinItem, warframes, weapons, items, getEnglishString } from "@/src/services/itemDataService";
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
    for (const arcane of ExportArcanes) {
        mods.push({
            uniqueName: arcane.uniqueName,
            name: getEnglishString(arcane.name)
        });
    }
    res.json({
        warframes: reduceItems(warframes),
        weapons: reduceItems(weapons.filter(item => item.productCategory != "OperatorAmps")),
        miscitems: reduceItems(
            items.filter(item => item.category == "Misc" || item.category == "Resources" || item.category == "Fish")
        ),
        mods,
        badItems
    });
};

export { getItemListsController };
