import { RequestHandler } from "express";
import { isEmptyObject, parseString } from "@/src/helpers/general";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addKeyChainItems, getInventory } from "@/src/services/inventoryService";
import { IGroup } from "@/src/types/loginTypes";
import { updateQuestStage } from "@/src/services/questService";

export const giveKeyChainTriggeredItemsController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    const keyChainInfo = getJSONfromString<IKeyChainRequest>((req.body as string).toString());

    const inventory = await getInventory(accountId);
    const inventoryChanges = await addKeyChainItems(inventory, keyChainInfo);

    if (isEmptyObject(inventoryChanges)) {
        throw new Error("inventory changes was empty after getting keychain items: should not happen");
    }
    // items were added: update quest stage's i (item was given)
    updateQuestStage(inventory, keyChainInfo, { i: true });

    await inventory.save();
    res.send(inventoryChanges);

    //TODO: Check whether Wishlist is used to track items which should exist uniquely in the inventory
    /*
    some items are added or removed (not sure) to the wishlist, in that case a 
    WishlistChanges: ["/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem"],
    is added to the response, need to determine for which items this is the case and what purpose this has.
    */
    //{"KeyChain":"/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain","ChainStage":0}
    //{"WishlistChanges":["/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem"],"MiscItems":[{"ItemType":"/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem","ItemCount":1}]}
};

export interface IKeyChainRequest {
    KeyChain: string;
    ChainStage: number;
    Groups?: IGroup[];
}
