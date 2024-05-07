// import { addPowerSuit, getInventory } from "@/src/services/inventoryService";
// import { items } from "@/src/services/itemDataService";
// import { IMongoDate } from "@/src/types/commonTypes";
// import { IInventoryDatabase, ITypeCount } from "@/src/types/inventoryTypes/inventoryTypes";
// import { TQuestKeys } from "@/src/types/questTypes";
// import { logger } from "@/src/utils/logger";
// import keys from "@/static/game_data/quests.json";
// import storeItems from "@/static/game_data/storeItems.json";

// export const getKeyChainItems = (keyChainName: TQuestKeys, chainStage: number) => {
//     const keyChain = keys[keyChainName].ChainStages;
//     if (!keyChain) {
//         logger.error(`KeyChain ${keyChain} not found`);
//         throw new Error(`KeyChain ${keyChain} not found`);
//     }

//     const keyChainStage = keyChain[chainStage];
//     if (!keyChainStage) {
//         logger.error(`KeyChainStage ${chainStage} not found`);
//         throw new Error(`KeyChainStage ${chainStage} not found`);
//     }

//     if (keyChainStage.ItemsToGiveWhenTriggered.length === 0) {
//         logger.error(`No items to give for KeyChain ${keyChainName} at stage ${chainStage}`);
//         throw new Error(`No items to give for KeyChain ${keyChainName} at stage ${chainStage}`);
//     }

//     return keyChainStage.ItemsToGiveWhenTriggered;
// };

// interface IChainStage {
//     ItemsToGiveWhenTriggered: string[];
//     MessageToSendWhenTriggered: IMessage;
// }

// export interface IMessage {
//     messageId: string;
//     sub: string;
//     sndr: string;
//     msg: string;
//     contextInfo: string;
//     icon: string;
//     date: IMongoDate;
//     att: string[];
//     modPacks: string[];
//     countedAtt: string[];
//     attSpecial: string[];
//     transmission: string;
//     ordisReactionTransmission: string;
//     arg: string[];
//     r: string;
//     acceptAction: string;
//     declineAction: string;
//     highPriority: string;
//     gifts: string[];
//     teleportLoc: string;
//     RegularCredits: string;
//     PremiumCredits: string;
//     PrimeTokens: string;
//     Coupons: string[];
//     syndicateAttachment: string[];
//     tutorialTag: string;
//     url: string;
//     urlButtonText: string;
//     cinematic: string;
//     requiredLevel: string;
// }

// export interface IDifficulties {
//     LOW: number;
//     NORMAL: number;
//     HIGH: number;
// }

// export const addItemsToInventory = async (accountId: string, items: string[]) => {
//     logger.debug(`adding items ${items} to inventory for ${accountId}`);

//     const inventory = await getInventory(accountId);

//     let inventoryChanges = {};

//     for (const item of items) {
//         //call addItemToInventory and assign the return value to inventoryChanges spread syntax
//         inventoryChanges = { ...inventoryChanges, ...addItemToInventory(inventory, item) };

//     }

//     return { inventoryChanges };
// };

// /*
// certain properties are not valid InventoryChanges, such as accountOwnerId,
// could Omit<IInventoryDatabase, "accountOwnerId"> these properties
// */
// type TInventoryChanges = { [inventoryKey in keyof IInventoryDatabase]?: ITypeCount[] };

// export const addItemToInventory = (inventory: IInventoryDatabase, item: string) => {
//     logger.debug(`adding item ${item} to inventory`);

//     const itemCategory = getItemCategory(item);

//     switch (itemCategory) {
//         case "Powersuit":
//            return await addPowerSuit(inventory, item);
//             break;
//         default:
//             logger.error(`item category ${itemCategory} not found`);
//             throw new Error(`item category ${itemCategory} not found`);
//     }

// };

// export const getItemCategory = (item: string) => {

//     if (!item.includes("/StoreItems/")) {
//         logger.error(`item ${item} is not a store item, currently only store items are supported`);
//         throw new Error(`item ${item} is not a store item, currently only store items are supported`);
//     }

//     const itemCategory = storeItems[item].

//     if (!itemCategory) {
//         logger.error(`item category not found for ${item}`);
//         throw new Error(`item category not found for ${item}`);
//     }

//     return itemCategory;
// };

// export type TStoreItems = keyof typeof storeItems;
