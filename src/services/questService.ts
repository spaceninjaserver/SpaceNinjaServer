import type { IKeyChainRequest } from "../types/requestTypes.ts";
import { isEmptyObject } from "../helpers/general.ts";
import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import { createMessage } from "./inboxService.ts";
import {
    addEquipment,
    addItem,
    addItems,
    addKeyChainItems,
    addPowerSuit,
    setupKahlSyndicate
} from "./inventoryService.ts";
import { fromStoreItem, getKeyChainMessage, getLevelKeyRewards } from "./itemDataService.ts";
import type { IQuestKeyClient, IQuestKeyDatabase, IQuestStage } from "../types/inventoryTypes/inventoryTypes.ts";
import { logger } from "../utils/logger.ts";
import { ExportKeys, ExportRecipes } from "warframe-public-export-plus";
import { addFixedLevelRewards } from "./missionInventoryUpdateService.ts";
import { fromOid } from "../helpers/inventoryHelpers.ts";
import { handleBundleAcqusition } from "./purchaseService.ts";
import type { IInventoryChanges } from "../types/purchaseTypes.ts";
import questCompletionItems from "../../static/fixed_responses/questCompletionRewards.json" with { type: "json" };
import type { ITypeCount } from "../types/commonTypes.ts";
import { addString } from "../helpers/stringHelpers.ts";
import { unlockShipFeature } from "./personalRoomsService.ts";
import { EquipmentFeatures } from "../types/equipmentTypes.ts";

export interface IUpdateQuestRequest {
    QuestKeys: IQuestKeyClient[];
    PS: string;
    questCompletion: boolean;
    PlayerShipEvents: unknown[];
    crossPlaySetting: string;
    DoQuestReward: boolean;
}

export const updateQuestKey = async (
    inventory: TInventoryDatabaseDocument,
    questKeyUpdate: IUpdateQuestRequest["QuestKeys"]
): Promise<IInventoryChanges> => {
    if (questKeyUpdate.length > 1) {
        logger.error(`more than 1 quest key not supported`);
        throw new Error("more than 1 quest key not supported");
    }

    const questKeyIndex = inventory.QuestKeys.findIndex(questKey => questKey.ItemType === questKeyUpdate[0].ItemType);

    if (questKeyIndex === -1) {
        throw new Error(`quest key ${questKeyUpdate[0].ItemType} not found`);
    }

    delete questKeyUpdate[0].CompletionDate;
    inventory.QuestKeys[questKeyIndex].overwrite(questKeyUpdate[0]);

    const inventoryChanges: IInventoryChanges = {};
    if (questKeyUpdate[0].Completed) {
        inventory.QuestKeys[questKeyIndex].CompletionDate = new Date();

        const questKey = questKeyUpdate[0].ItemType;
        await handleQuestCompletion(
            inventory,
            questKey,
            inventoryChanges,
            (questKeyUpdate[0].Progress?.[0]?.c ?? 0) > 0
        );
    }
    return inventoryChanges;
};

export const updateQuestStage = (
    inventory: TInventoryDatabaseDocument,
    { KeyChain, ChainStage }: IKeyChainRequest,
    questStageUpdate: Partial<IQuestStage>
): void => {
    const quest = inventory.QuestKeys.find(quest => quest.ItemType === KeyChain);

    if (!quest) {
        throw new Error(`Quest ${KeyChain} not found in QuestKeys`);
    }

    if (!quest.Progress) {
        throw new Error(`Progress should always exist when giving keychain triggered items or messages`);
    }

    const questStage = quest.Progress[ChainStage];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!questStage) {
        const questStageIndex =
            quest.Progress.push({
                c: questStageUpdate.c ?? -1,
                i: questStageUpdate.i ?? false,
                m: questStageUpdate.m ?? false,
                b: questStageUpdate.b ?? []
            }) - 1;
        if (questStageIndex !== ChainStage) {
            throw new Error(`Quest stage index mismatch: ${questStageIndex} !== ${ChainStage}`);
        }
        return;
    }

    for (const [key, value] of Object.entries(questStageUpdate) as [keyof IQuestStage, number | boolean | any[]][]) {
        (questStage[key] as any) = value;
    }
};

export const resetQuestKeyToStage = (
    inventory: TInventoryDatabaseDocument,
    { KeyChain, ChainStage }: IKeyChainRequest
): void => {
    const quest = inventory.QuestKeys.find(quest => quest.ItemType === KeyChain);

    if (!quest) {
        throw new Error(`Quest ${KeyChain} not found in QuestKeys`);
    }

    quest.Progress ??= [];

    const run = quest.Progress[0]?.c ?? 0;
    if (run >= 0) {
        for (let i = ChainStage; i < quest.Progress.length; ++i) {
            quest.Progress[i].c = run - 1;
        }
    }
};

export const addQuestKey = (
    inventory: TInventoryDatabaseDocument,
    questKey: IQuestKeyDatabase,
    silentFailure?: boolean
): IQuestKeyClient | undefined => {
    if (inventory.QuestKeys.some(q => q.ItemType === questKey.ItemType)) {
        if (!silentFailure) {
            logger.warn(`Quest key ${questKey.ItemType} already exists. It will not be added`);
        }
        return;
    }

    if (questKey.ItemType == "/Lotus/Types/Keys/InfestedMicroplanetQuest/InfestedMicroplanetQuestKeyChain") {
        void createMessage(inventory.accountOwnerId, [
            {
                sndr: "/Lotus/Language/Bosses/Loid",
                icon: "/Lotus/Interface/Icons/Npcs/Entrati/Loid.png",
                sub: "/Lotus/Language/InfestedMicroplanet/DeimosIntroQuestInboxTitle",
                msg: "/Lotus/Language/InfestedMicroplanet/DeimosIntroQuestInboxMessage"
            }
        ]);
    }

    const index = inventory.QuestKeys.push(questKey);

    return inventory.QuestKeys[index - 1].toJSON<IQuestKeyClient>();
};

export const completeQuest = async (
    inventory: TInventoryDatabaseDocument,
    questKey: string,
    buildLabel: string | undefined,
    sendMessages: boolean = false
): Promise<void | IQuestKeyClient> => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const chainStages = ExportKeys[questKey]?.chainStages;

    if (!chainStages) {
        throw new Error(`Quest ${questKey} does not contain chain stages`);
    }

    const chainStageTotal = chainStages.length;
    let existingQuestKey = inventory.QuestKeys.find(qk => qk.ItemType === questKey);

    if (!existingQuestKey) {
        const completedQuestKey: IQuestKeyDatabase = {
            ItemType: questKey,
            Completed: false,
            unlock: true,
            Progress: Array.from({ length: chainStageTotal }, () => ({
                c: 0,
                i: true,
                m: true,
                b: []
            }))
        };
        addQuestKey(inventory, completedQuestKey);
        existingQuestKey = inventory.QuestKeys.find(qk => qk.ItemType === questKey)!;
    } else if (existingQuestKey.Completed) {
        return;
    }

    existingQuestKey.Progress = existingQuestKey.Progress ?? [];

    const run = existingQuestKey.Progress[0]?.c ?? 0;

    const existingProgressLength = existingQuestKey.Progress.length;
    if (existingProgressLength < chainStageTotal) {
        const missingProgress: IQuestStage[] = Array.from(
            { length: chainStageTotal - existingProgressLength },
            () => ({ c: run, i: false, m: false, b: [] }) as IQuestStage
        );
        existingQuestKey.Progress.push(...missingProgress);
    }

    for (let i = 0; i < chainStageTotal; i++) {
        const stage = existingQuestKey.Progress[i];
        if (stage.c <= run) {
            stage.c = run;
            await giveKeyChainStageTriggered(inventory, { KeyChain: questKey, ChainStage: i }, sendMessages);
            await giveKeyChainMissionReward(inventory, { KeyChain: questKey, ChainStage: i }, buildLabel);
            await installShipFeatures(inventory, { KeyChain: questKey, ChainStage: i }, buildLabel);
        }
    }

    if (existingQuestKey.Progress.every(p => p.c == run)) {
        existingQuestKey.Completed = true;
        existingQuestKey.CompletionDate = new Date();
        await handleQuestCompletion(inventory, questKey, undefined, run > 0);

        if (questKey == "/Lotus/Types/Keys/ModQuest/ModQuestKeyChain") {
            // This would be set by the client during the equilogue, but since we're cheating through, we have to do it ourselves.
            addString(inventory.NodeIntrosCompleted, "ModQuestTeshinAccess");
        }
    }

    return existingQuestKey.toJSON<IQuestKeyClient>();
};

const getQuestCompletionItems = (questKey: string): ITypeCount[] | undefined => {
    if (questKey in questCompletionItems) {
        logger.debug(`using questCompletionItems for ${questKey}`);
        return questCompletionItems[questKey as keyof typeof questCompletionItems];
    }
    logger.debug(`using PE+ reward data for ${questKey}`);

    const items: ITypeCount[] = [];
    const meta = ExportKeys[questKey];
    if (meta.rewards) {
        for (const reward of meta.rewards) {
            if (reward.rewardType == "RT_STORE_ITEM") {
                items.push({
                    ItemType: fromStoreItem(reward.itemType),
                    ItemCount: 1
                });
            } else if (reward.rewardType == "RT_RESOURCE" || reward.rewardType == "RT_RECIPE") {
                items.push({
                    ItemType: reward.itemType,
                    ItemCount: reward.amount
                });
            }
        }
    }
    return items;
};

// Checks that `questKey` is in `requirements`, and if so, that all other quests in `requirements` are also already completed.
const doesQuestCompletionFinishSet = (
    inventory: TInventoryDatabaseDocument,
    questKey: string,
    requirements: string[]
): boolean => {
    let holds = false;
    for (const requirement of requirements) {
        if (questKey == requirement) {
            holds = true;
        } else {
            if (!inventory.QuestKeys.find(x => x.ItemType == requirement)?.Completed) {
                return false;
            }
        }
    }
    return holds;
};

const handleQuestCompletion = async (
    inventory: TInventoryDatabaseDocument,
    questKey: string,
    inventoryChanges: IInventoryChanges = {},
    isRerun: boolean = false
): Promise<void> => {
    logger.debug(`completed quest ${questKey}`);

    if (inventory.ActiveQuest == questKey) inventory.ActiveQuest = "";
    if (questKey == "/Lotus/Types/Keys/OrokinMoonQuest/OrokinMoonQuestKeyChain") {
        const att = isRerun
            ? []
            : [
                  "/Lotus/Weapons/Tenno/Melee/Swords/StalkerTwo/StalkerTwoSmallSword",
                  "/Lotus/Upgrades/Skins/Sigils/ScarSigil"
              ];
        await createMessage(inventory.accountOwnerId, [
            {
                sndr: "/Lotus/Language/Bosses/Ordis",
                msg: "/Lotus/Language/G1Quests/SecondDreamFinishInboxMessage",
                att,
                sub: "/Lotus/Language/G1Quests/SecondDreamFinishInboxTitle",
                icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
                highPriority: true
            }
        ]);
    } else if (questKey == "/Lotus/Types/Keys/DragonQuest/DragonQuestKeyChain" && !isRerun) {
        let syndicate = inventory.Affiliations.find(x => x.Tag == "LibrarySyndicate");
        if (!syndicate) {
            syndicate =
                inventory.Affiliations[
                    inventory.Affiliations.push({ Tag: "LibrarySyndicate", Standing: 0, Title: 0 }) - 1
                ];
        }
        if (!syndicate.Initiated) {
            syndicate.Initiated = true;
            await handleBundleAcqusition("/Lotus/Types/StoreItems/Packages/SanctuaryInitiationKit", inventory);
        }
    } else if (questKey == "/Lotus/Types/Keys/NewWarQuest/NewWarQuestKeyChain" && !isRerun) {
        setupKahlSyndicate(inventory);
    }

    if (isRerun) return;

    // Whispers in the Walls is unlocked once The New War + Heart of Deimos are completed.
    if (
        doesQuestCompletionFinishSet(inventory, questKey, [
            "/Lotus/Types/Keys/NewWarQuest/NewWarQuestKeyChain",
            "/Lotus/Types/Keys/InfestedMicroplanetQuest/InfestedMicroplanetQuestKeyChain"
        ])
    ) {
        await createMessage(inventory.accountOwnerId, [
            {
                sndr: "/Lotus/Language/Bosses/Loid",
                msg: "/Lotus/Language/EntratiLab/EntratiQuest/WiTWQuestRecievedInboxBody",
                att: ["/Lotus/Types/Keys/EntratiLab/EntratiQuestKeyChain"],
                sub: "/Lotus/Language/EntratiLab/EntratiQuest/WiTWQuestRecievedInboxTitle",
                icon: "/Lotus/Interface/Icons/Npcs/Entrati/Loid.png",
                highPriority: true
            }
        ]);
    }

    // The Hex (Quest) is unlocked once The Lotus Eaters + The Duviri Paradox are completed.
    if (
        doesQuestCompletionFinishSet(inventory, questKey, [
            "/Lotus/Types/Keys/1999PrologueQuest/1999PrologueQuestKeyChain",
            "/Lotus/Types/Keys/DuviriQuest/DuviriQuestKeyChain"
        ])
    ) {
        await createMessage(inventory.accountOwnerId, [
            {
                sndr: "/Lotus/Language/NewWar/P3M1ChooseMara",
                msg: "/Lotus/Language/1999Quest/1999QuestInboxBody",
                att: ["/Lotus/Types/Keys/1999Quest/1999QuestKeyChain"],
                sub: "/Lotus/Language/1999Quest/1999QuestInboxSubject",
                icon: "/Lotus/Interface/Icons/Npcs/Operator.png",
                highPriority: true
            }
        ]);
    }

    const questCompletionItems = getQuestCompletionItems(questKey);
    logger.debug(`quest completion items`, questCompletionItems);
    if (questCompletionItems) {
        await addItems(inventory, questCompletionItems, inventoryChanges);
        for (const item of questCompletionItems) {
            await removeRequiredItems(inventory, item.ItemType);
        }
    }
};

export const giveKeyChainItem = async (
    inventory: TInventoryDatabaseDocument,
    keyChainInfo: IKeyChainRequest,
    questKey: IQuestKeyDatabase
): Promise<IInventoryChanges> => {
    let inventoryChanges: IInventoryChanges = {};

    if (!questKey.Progress?.[keyChainInfo.ChainStage]?.i) {
        inventoryChanges = await addKeyChainItems(inventory, keyChainInfo);

        if (isEmptyObject(inventoryChanges)) {
            logger.warn("inventory changes was empty after getting keychain items: should not happen");
        }
        // items were added: update quest stage's i (item was given)
        updateQuestStage(inventory, keyChainInfo, { i: true });
    }

    return inventoryChanges;

    //TODO: Check whether Wishlist is used to track items which should exist uniquely in the inventory
    /*
    some items are added or removed (not sure) to the wishlist, in that case a 
    WishlistChanges: ["/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem"],
    is added to the response, need to determine for which items this is the case and what purpose this has.
    */
    //{"KeyChain":"/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain","ChainStage":0}
    //{"WishlistChanges":["/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem"],"MiscItems":[{"ItemType":"/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem","ItemCount":1}]}
};

export const giveKeyChainMessage = async (
    inventory: TInventoryDatabaseDocument,
    keyChainInfo: IKeyChainRequest,
    questKey: IQuestKeyDatabase,
    sendMessage: boolean = true
): Promise<void> => {
    const keyChainMessage = getKeyChainMessage(keyChainInfo);

    if ((questKey.Progress?.[0]?.c ?? 0) > 0) {
        keyChainMessage.att = [];
        keyChainMessage.countedAtt = [];
    }

    if (sendMessage) {
        await createMessage(inventory.accountOwnerId, [keyChainMessage]);
    } else {
        if (keyChainMessage.countedAtt?.length) await addItems(inventory, keyChainMessage.countedAtt);
        if (keyChainMessage.att?.length) {
            await addItems(inventory, keyChainMessage.att);
            for (const reward of keyChainMessage.att) {
                await removeRequiredItems(inventory, reward);
            }
        }
    }

    updateQuestStage(inventory, keyChainInfo, { m: true });
};

export const giveKeyChainMissionReward = async (
    inventory: TInventoryDatabaseDocument,
    keyChainInfo: IKeyChainRequest,
    buildLabel: string | undefined
): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const chainStages = ExportKeys[keyChainInfo.KeyChain]?.chainStages;

    if (chainStages) {
        const missionName = chainStages[keyChainInfo.ChainStage].key;
        const questKey = inventory.QuestKeys.find(q => q.ItemType === keyChainInfo.KeyChain);
        if (missionName && questKey) {
            const fixedLevelRewards = getLevelKeyRewards(missionName, buildLabel);
            const run = questKey.Progress?.[0]?.c ?? 0;
            if (fixedLevelRewards.levelKeyRewards) {
                const missionRewards: { StoreItem: string; ItemCount: number }[] = [];
                inventory.RegularCredits += addFixedLevelRewards(fixedLevelRewards.levelKeyRewards, missionRewards);

                for (const reward of missionRewards) {
                    await addItem(inventory, fromStoreItem(reward.StoreItem), reward.ItemCount);
                    await removeRequiredItems(inventory, fromStoreItem(reward.StoreItem));
                }

                updateQuestStage(inventory, keyChainInfo, { c: run });
            } else if (fixedLevelRewards.levelKeyRewards2) {
                for (const reward of fixedLevelRewards.levelKeyRewards2) {
                    if (reward.rewardType == "RT_CREDITS") {
                        inventory.RegularCredits += reward.amount;
                        continue;
                    }
                    if (reward.rewardType == "RT_RESOURCE") {
                        await addItem(inventory, fromStoreItem(reward.itemType), reward.amount);
                    } else {
                        await addItem(inventory, fromStoreItem(reward.itemType));
                        await removeRequiredItems(inventory, fromStoreItem(reward.itemType));
                    }
                }

                updateQuestStage(inventory, keyChainInfo, { c: run });
            }
        }
    }
};

export const giveKeyChainStageTriggered = async (
    inventory: TInventoryDatabaseDocument,
    keyChainInfo: IKeyChainRequest,
    sendMessage: boolean = true
): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const chainStages = ExportKeys[keyChainInfo.KeyChain]?.chainStages;
    const questKey = inventory.QuestKeys.find(qk => qk.ItemType === keyChainInfo.KeyChain);

    if (chainStages && questKey) {
        if (chainStages[keyChainInfo.ChainStage].itemsToGiveWhenTriggered.length > 0) {
            await giveKeyChainItem(inventory, keyChainInfo, questKey);
        }

        if (chainStages[keyChainInfo.ChainStage].messageToSendWhenTriggered) {
            await giveKeyChainMessage(inventory, keyChainInfo, questKey, sendMessage);
        }
    }
};

export const installShipFeatures = async (
    inventory: TInventoryDatabaseDocument,
    keyChainInfo: IKeyChainRequest,
    buildLabel: string | undefined
): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const chainStages = ExportKeys[keyChainInfo.KeyChain]?.chainStages;
    const questKey = inventory.QuestKeys.find(qk => qk.ItemType === keyChainInfo.KeyChain);
    if (chainStages && questKey) {
        if (keyChainInfo.ChainStage - 1 >= 0) {
            const prevStage = chainStages[keyChainInfo.ChainStage - 1];
            for (const item of prevStage.itemsToGiveWhenTriggered) {
                if (item.startsWith("/Lotus/StoreItems/Types/Items/ShipFeatureItems/")) {
                    logger.debug(`installing ship feature ${fromStoreItem(item)}`);
                    await unlockShipFeature(inventory, fromStoreItem(item));
                }
            }
            if (prevStage.key) {
                const fixedLevelRewards = getLevelKeyRewards(prevStage.key, buildLabel);
                if (fixedLevelRewards.levelKeyRewards?.items) {
                    for (const item of fixedLevelRewards.levelKeyRewards.items) {
                        if (item.startsWith("/Lotus/StoreItems/Types/Items/ShipFeatureItems/")) {
                            logger.debug(`installing ship feature ${fromStoreItem(item)}`);
                            await unlockShipFeature(inventory, fromStoreItem(item));
                        }
                    }
                }
                if (fixedLevelRewards.levelKeyRewards2) {
                    for (const item of fixedLevelRewards.levelKeyRewards2) {
                        if (
                            item.rewardType == "RT_STORE_ITEM" &&
                            item.itemType.startsWith("/Lotus/StoreItems/Types/Items/ShipFeatureItems/")
                        ) {
                            logger.debug(`installing ship feature ${fromStoreItem(item.itemType)}`);
                            await unlockShipFeature(inventory, fromStoreItem(item.itemType));
                        }
                    }
                }
            }
        }
    }
};

export const removeRequiredItems = async (inventory: TInventoryDatabaseDocument, typeName: string): Promise<void> => {
    switch (typeName) {
        case "/Lotus/Types/Recipes/WarframeRecipes/MagicianHelmetBlueprint": {
            const recipeItem = inventory.Recipes.find(
                i => i.ItemType == "/Lotus/Types/Keys/LimboQuest/LimboHelmetKeyBlueprint"
            );
            if (recipeItem && recipeItem.ItemCount > 0) {
                const recipe = ExportRecipes[recipeItem.ItemType];
                if (!inventory.MiscItems.find(i => i.ItemType == recipe.resultType)) {
                    await addItem(inventory, recipe.resultType);
                    if (recipe.consumeOnUse) await addItem(inventory, recipeItem.ItemType, -1);
                }
            }
            break;
        }
        case "/Lotus/Types/Recipes/WarframeRecipes/MagicianSystemsBlueprint": {
            const recipeItem = inventory.Recipes.find(
                i => i.ItemType == "/Lotus/Types/Keys/LimboQuest/LimboSystemsKeyBlueprint"
            );
            if (recipeItem && recipeItem.ItemCount > 0) {
                const recipe = ExportRecipes[recipeItem.ItemType];
                if (!inventory.MiscItems.find(i => i.ItemType == recipe.resultType)) {
                    await addItem(inventory, recipe.resultType);
                    if (recipe.consumeOnUse) await addItem(inventory, recipeItem.ItemType, -1);
                }
            }
            break;
        }
        case "/Lotus/Types/Recipes/WarframeRecipes/MagicianChassisBlueprint": {
            const recipeItem = inventory.Recipes.find(
                i => i.ItemType == "/Lotus/Types/Keys/LimboQuest/LimboChassisKeyBlueprint"
            );
            if (recipeItem && recipeItem.ItemCount > 0) {
                const recipe = ExportRecipes[recipeItem.ItemType];
                if (!inventory.MiscItems.find(i => i.ItemType == recipe.resultType)) {
                    await addItem(inventory, recipe.resultType);
                    if (recipe.consumeOnUse) await addItem(inventory, recipeItem.ItemType, -1);
                }
            }
            break;
        }

        case "/Lotus/Types/Recipes/WarframeRecipes/BrawlerBlueprint": {
            const recipeItem = inventory.Recipes.find(
                i => i.ItemType == "/Lotus/Types/Recipes/Components/InfestedIrradiatedBaitBallBlueprint"
            );
            if (recipeItem && recipeItem.ItemCount > 0) {
                const recipe = ExportRecipes[recipeItem.ItemType];
                if (!inventory.MiscItems.find(i => i.ItemType == recipe.resultType)) {
                    await addItem(inventory, recipe.resultType);
                    await addItem(inventory, recipe.resultType, -1, false, undefined, undefined, true);
                    if (recipe.consumeOnUse) await addItem(inventory, recipeItem.ItemType, -1);
                }
            }
            break;
        }

        case "/Lotus/Types/Game/CrewShip/RailJack/DefaultHarness": {
            const recipeItem = inventory.Recipes.find(
                i => i.ItemType == "/Lotus/Types/Recipes/ArchwingRecipes/StandardArchwing/StandardArchwingBlueprint"
            );
            if (recipeItem && recipeItem.ItemCount > 0) {
                const recipe = ExportRecipes[recipeItem.ItemType];
                if (!inventory.MiscItems.find(i => i.ItemType == recipe.resultType)) {
                    await addItem(inventory, recipe.resultType);
                    if (recipe.consumeOnUse) await addItem(inventory, recipeItem.ItemType, recipeItem.ItemCount * -1);
                    await addItems(inventory, [
                        {
                            ItemType:
                                "/Lotus/Types/Recipes/ArchwingRecipes/StandardArchwing/StandardArchwingWingsBlueprint",
                            ItemCount: -1
                        },
                        {
                            ItemType:
                                "/Lotus/Types/Recipes/ArchwingRecipes/StandardArchwing/StandardArchwingChassisBlueprint",
                            ItemCount: -1
                        },
                        {
                            ItemType:
                                "/Lotus/Types/Recipes/ArchwingRecipes/StandardArchwing/StandardArchwingSystemsBlueprint",
                            ItemCount: -1
                        }
                    ]);
                }
            }
            break;
        }

        case "/Lotus/Types/Keys/ModQuest/ModQuestKeyChain": {
            const recipeItem = inventory.Recipes.find(
                i => i.ItemType == "/Lotus/Types/Recipes/Components/VorBoltRemoverBlueprint"
            );
            if (recipeItem && recipeItem.ItemCount > 0) {
                const recipe = ExportRecipes[recipeItem.ItemType];
                if (!inventory.MiscItems.find(i => i.ItemType == recipe.resultType)) {
                    await addItem(inventory, recipe.resultType);
                    if (recipe.consumeOnUse) await addItem(inventory, recipeItem.ItemType, -1);
                }
            }
            break;
        }

        case "/Lotus/Types/Recipes/WarframeRecipes/ChromaBlueprint": {
            const itemsToRemove = [
                "/Lotus/Types/Recipes/WarframeRecipes/ChromaBeaconABlueprint",
                "/Lotus/Types/Recipes/WarframeRecipes/ChromaBeaconBBlueprint",
                "/Lotus/Types/Recipes/WarframeRecipes/ChromaBeaconCBlueprint"
            ];
            for (const itemToRemove of itemsToRemove) {
                try {
                    await addItem(inventory, itemToRemove, -1, undefined, undefined, undefined, true);
                } catch (e) {
                    logger.debug(`removeRequiredItems: Couldn't remove ${itemToRemove}: ${(e as Error).message}`);
                }
            }
            break;
        }

        case "/Lotus/Types/Recipes/WarframeRecipes/OctaviaBlueprint": {
            const recipeItem = inventory.Recipes.find(
                i => i.ItemType == "/Lotus/Types/Keys/BardQuest/BardQuestSequencerBlueprint"
            );
            if (recipeItem && recipeItem.ItemCount > 0) {
                const recipe = ExportRecipes[recipeItem.ItemType];
                if (!inventory.MiscItems.find(i => i.ItemType == recipe.resultType)) {
                    await addItem(inventory, recipe.resultType);
                    if (recipe.consumeOnUse) await addItem(inventory, recipeItem.ItemType, -1);
                    const itemsToRemove = [
                        "/Lotus/Types/Keys/BardQuest/BardQuestSequencerPartA",
                        "/Lotus/Types/Keys/BardQuest/BardQuestSequencerPartB",
                        "/Lotus/Types/Keys/BardQuest/BardQuestSequencerPartC"
                    ];
                    for (const itemToRemove of itemsToRemove) {
                        try {
                            await addItem(inventory, itemToRemove, -1, undefined, undefined, undefined, true);
                        } catch (e) {
                            logger.debug(
                                `removeRequiredItems: Couldn't remove ${itemToRemove}: ${(e as Error).message}`
                            );
                        }
                    }
                }
            }
            break;
        }

        case "/Lotus/Types/Game/CrewShip/Ships/RailJack": {
            const recipeItem = inventory.Recipes.find(
                i => i.ItemType == "/Lotus/Types/Recipes/Railjack/RailjackCephalonBlueprint"
            );
            if (recipeItem && recipeItem.ItemCount > 0) {
                const recipe = ExportRecipes[recipeItem.ItemType];
                if (!inventory.MiscItems.find(i => i.ItemType == recipe.resultType)) {
                    await addItem(inventory, recipe.resultType);
                    if (recipe.consumeOnUse) await addItem(inventory, recipeItem.ItemType, recipeItem.ItemCount * -1);
                    await unlockShipFeature(inventory, recipe.resultType);
                }
            }
            break;
        }

        case "/Lotus/Types/Items/ShipDecos/MummyQuestVessel": {
            const gearItem = inventory.Consumables.find(
                i => i.ItemType == "/Lotus/Types/Keys/MummyQuest/MummyArtifact01GearItem"
            );
            if (gearItem && gearItem.ItemCount > 0) {
                await addItem(inventory, gearItem.ItemType, gearItem.ItemCount * -1);
            }
            break;
        }

        case "/Lotus/Types/Recipes/WarframeRecipes/ConcreteFrameBlueprint": {
            const recipeItem = inventory.Recipes.find(
                i => i.ItemType == "/Lotus/Types/Gameplay/EntratiLab/Quest/GargoyleRecipeItem"
            );
            if (recipeItem && recipeItem.ItemCount > 0) {
                const recipe = ExportRecipes[recipeItem.ItemType];
                if (!inventory.MiscItems.find(i => i.ItemType == recipe.resultType)) {
                    await addItem(inventory, recipe.resultType);
                    if (recipe.consumeOnUse) await addItem(inventory, recipeItem.ItemType, recipeItem.ItemCount * -1);
                }
            }
            break;
        }

        case "/Lotus/Upgrades/Skins/Umbra/UmbraAltHelmet": {
            const recipeItem = inventory.Recipes.find(
                i => i.ItemType == "/Lotus/Types/Recipes/WarframeRecipes/ExcaliburUmbraBlueprint"
            );
            if (recipeItem && recipeItem.ItemCount > 0) {
                const recipe = ExportRecipes[recipeItem.ItemType];
                if (!inventory.MiscItems.find(i => i.ItemType == recipe.resultType)) {
                    const umbraModA = (
                        await addItem(
                            inventory,
                            "/Lotus/Upgrades/Mods/Sets/Umbra/WarframeUmbraModA",
                            1,
                            false,
                            undefined,
                            `{"lvl":5}`
                        )
                    ).Upgrades![0];
                    const umbraModB = (
                        await addItem(
                            inventory,
                            "/Lotus/Upgrades/Mods/Sets/Umbra/WarframeUmbraModB",
                            1,
                            false,
                            undefined,
                            `{"lvl":5}`
                        )
                    ).Upgrades![0];
                    const umbraModC = (
                        await addItem(
                            inventory,
                            "/Lotus/Upgrades/Mods/Sets/Umbra/WarframeUmbraModC",
                            1,
                            false,
                            undefined,
                            `{"lvl":5}`
                        )
                    ).Upgrades![0];
                    const sacrificeModA = (
                        await addItem(
                            inventory,
                            "/Lotus/Upgrades/Mods/Sets/Sacrifice/MeleeSacrificeModA",
                            1,
                            false,
                            undefined,
                            `{"lvl":5}`
                        )
                    ).Upgrades![0];
                    const sacrificeModB = (
                        await addItem(
                            inventory,
                            "/Lotus/Upgrades/Mods/Sets/Sacrifice/MeleeSacrificeModB",
                            1,
                            false,
                            undefined,
                            `{"lvl":5}`
                        )
                    ).Upgrades![0];

                    await addPowerSuit(inventory, "/Lotus/Powersuits/Excalibur/ExcaliburUmbra", {
                        Configs: [
                            {
                                Upgrades: [
                                    "",
                                    "",
                                    "",
                                    "",
                                    "",
                                    fromOid(umbraModA.ItemId),
                                    fromOid(umbraModB.ItemId),
                                    fromOid(umbraModC.ItemId)
                                ]
                            }
                        ],
                        XP: 900_000,
                        Features: EquipmentFeatures.DOUBLE_CAPACITY
                    });
                    inventory.XPInfo.push({
                        ItemType: "/Lotus/Powersuits/Excalibur/ExcaliburUmbra",
                        XP: 900_000
                    });

                    addEquipment(inventory, "Melee", "/Lotus/Weapons/Tenno/Melee/Swords/UmbraKatana/UmbraKatana", {
                        Configs: [
                            {
                                Upgrades: [
                                    "",
                                    "",
                                    "",
                                    "",
                                    "",
                                    "",
                                    fromOid(sacrificeModA.ItemId),
                                    fromOid(sacrificeModB.ItemId)
                                ]
                            }
                        ],
                        XP: 450_000,
                        Features: EquipmentFeatures.DOUBLE_CAPACITY
                    });
                    inventory.XPInfo.push({
                        ItemType: "/Lotus/Weapons/Tenno/Melee/Swords/UmbraKatana/UmbraKatana",
                        XP: 450_000
                    });
                    if (recipe.consumeOnUse) await addItem(inventory, recipeItem.ItemType, recipeItem.ItemCount * -1);
                }
            }
            break;
        }
        default:
            break;
    }
};
