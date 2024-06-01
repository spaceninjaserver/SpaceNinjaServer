import { RequestHandler } from "express";
import { MinItem, warframes, weapons, items } from "@/src/services/itemDataService";

interface ListedItem {
    uniqueName: string;
    name: string;
}

function reduceItems(items: MinItem[]): ListedItem[] {
    return items.map((item: MinItem): ListedItem => {
        return {
            uniqueName: item.uniqueName,
            name: item.name
        };
    });
}

const getItemListsController: RequestHandler = (_req, res) => {
    res.json({
        warframes: reduceItems(warframes),
        weapons: reduceItems(weapons.filter(item => item.productCategory != "OperatorAmps")),
        miscitems: reduceItems(
            items.filter(item => item.category == "Misc" || item.category == "Resources" || item.category == "Fish")
        )
    });
};

export { getItemListsController };
