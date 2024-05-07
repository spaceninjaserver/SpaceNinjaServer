import { RequestHandler } from "express";
import { parseString } from "@/src/helpers/general";
import { logger } from "@/src/utils/logger";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { IInventoryDatabase, IQuestKeyResponse } from "@/src/types/inventoryTypes/inventoryTypes";
import { getInventory } from "@/src/services/inventoryService";
import { updateShipFeature } from "@/src/services/personalRoomsService";
import quests from "@/static/game_data/quests.json";
//import { addItemsToInventory, getKeyChainItems } from "@/src/services/gameDataService";
import { TQuestKeys } from "@/src/types/questTypes";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const giveKeyChainTriggeredItemsController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
    const keyChainItemRequest = getJSONfromString(req.body.toString()) as IGiveKeyChainTriggeredItemsRequest;
    console.log(keyChainItemRequest);

    const keyChainName = keyChainItemRequest.KeyChain;
    const keyChainStage = keyChainItemRequest.ChainStage;

    //const keyChainItems = getKeyChainItems(keyChainName, keyChainStage);

    //  logger.debug(`adding key chain items ${keyChainItems} for ${keyChainName} at stage ${keyChainStage}`);

    //give items

    //const inventoryChanges = await addItemsToInventory(accountId, keyChainItems);
    //form item changes
    res.send({});
    //{
    //MiscItems: [{ ItemType: "/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem", ItemCount: 1 }]
    //}
};

/*
some items are added or removed (not sure) to the wishlist, in that case a 
WishlistChanges: ["/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem"],
is added to the response, need to determine for which items this is the case.
*/

// export const buildInventoryChanges = (keyChainItems: Record<string, any>) => {
//     const inventoryChanges = {};

//     for (const key of Object.keys(keyChainItems)) {
//         if (keyChainItems[key].makeWishlistChange) {
//             inventoryChanges["WishlistChanges"] = [key];
//         }
//     }
//     return inventoryChanges;
// };

export type IKeyChains =
    | "/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain"
    | "/Lotus/Types/Keys/InfestedMicroplanetQuest/InfestedMicroplanetQuestKeyChain";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
//TODO: Record<string, any> is a placeholder for the actual type

// type test = keyof typeof KeyChainItems;

// export interface IItems {
//     [key in keyof test]: string;
// }

export interface IGiveKeyChainTriggeredItemsRequest {
    KeyChain: TQuestKeys;
    ChainStage: number;
}

//{"KeyChain":"/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain","ChainStage":0}
//{"WishlistChanges":["/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem"],"MiscItems":[{"ItemType":"/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem","ItemCount":1}]}

// const addKeyChainItems = async (accountId: string, _inventory: IInventoryDatabase, keyChain: IKeyChains) => {
//     const keyChainItems = KeyChainItems[keyChain];
//     if (!keyChainItems) {
//         logger.error(`keyChain ${keyChain} not found`);
//         return;
//     }

//     switch (keyChainItems.InventoryCategory) {
//         case "ShipFeatures":
//             await addShipFeature(accountId, keyChainItems.MiscItems[0].ItemType);
//             break;
//     }
//     console.log(keyChainItems);
// };
