import { RequestHandler } from "express";
import { isEmptyObject, parseString } from "@/src/helpers/general";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addKeyChainItems, getInventory } from "@/src/services/inventoryService";

export const giveKeyChainTriggeredItemsController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    const keyChainTriggeredItemsRequest = getJSONfromString(
        (req.body as string).toString()
    ) as IGiveKeyChainTriggeredItemsRequest;

    const inventory = await getInventory(accountId);
    const inventoryChanges = await addKeyChainItems(inventory, keyChainTriggeredItemsRequest);

    if (isEmptyObject(inventoryChanges)) {
        throw new Error("inventory changes was empty after getting keychain items: should not happen");
    }
    // items were added: update quest stage's i (item was given)
    const quest = inventory.QuestKeys.find(quest => quest.ItemType === keyChainTriggeredItemsRequest.KeyChain);

    if (!quest) {
        throw new Error(`Quest ${keyChainTriggeredItemsRequest.KeyChain} not found in QuestKeys`);
    }
    if (!quest.Progress) {
        throw new Error(`Progress should always exist when giving keychain triggered items`);
    }

    const questStage = quest.Progress[keyChainTriggeredItemsRequest.ChainStage];
    if (questStage) {
        questStage.i = true;
    } else {
        const questStageIndex = quest.Progress.push({ i: true }) - 1;
        if (questStageIndex !== keyChainTriggeredItemsRequest.ChainStage) {
            throw new Error(
                `Quest stage index mismatch: ${questStageIndex} !== ${keyChainTriggeredItemsRequest.ChainStage}`
            );
        }
    }

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

export interface IGiveKeyChainTriggeredItemsRequest {
    KeyChain: string;
    ChainStage: number;
}
