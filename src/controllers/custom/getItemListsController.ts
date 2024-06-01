import { RequestHandler } from "express";
import { MinItem, warframes, weapons, items } from "@/src/services/itemDataService";
import badItems from "@/static/json/exclude-mods.json";

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
    res.json({
        warframes: reduceItems(warframes),
        weapons: reduceItems(weapons.filter(item => item.productCategory != "OperatorAmps")),
        miscitems: reduceItems(
            items.filter(item => item.category == "Misc" || item.category == "Resources" || item.category == "Fish")
        ),
        mods: reduceItems(items.filter(item => item.category == "Mods" || item.category == "Arcanes")),
        badItems
    });
};

export { getItemListsController };
