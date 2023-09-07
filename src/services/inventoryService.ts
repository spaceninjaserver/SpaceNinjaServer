import { Inventory } from "@/src/models/inventoryModel";
import new_inventory from "@/static/fixed_responses/postTutorialInventory.json";
import config from "@/config.json";
import { Types } from "mongoose";
import { ISuitDatabase, ISuitResponse } from "@/src/types/inventoryTypes/SuitTypes";
import { SlotType } from "@/src/types/purchaseTypes";
import { IWeaponDatabase, IWeaponResponse } from "@/src/types/inventoryTypes/weaponTypes";
import {
    IChallengeProgress,
    IConsumable,
    IFlavourItem,
    IInventoryDatabaseDocument,
    IMiscItem,
    IMission,
    IRawUpgrade
} from "@/src/types/inventoryTypes/inventoryTypes";
import { IGenericUpdate } from "../types/genericUpdate";
import { IArtifactsRequest, IMissionInventoryUpdateRequest } from "../types/requestTypes";

const createInventory = async (accountOwnerId: Types.ObjectId) => {
    try {
        const inventory = new Inventory({ ...new_inventory, accountOwnerId: accountOwnerId });
        if (config.skipStoryModeChoice) {
            inventory.StoryModeChoice = "WARFRAME";
        }
        if (config.skipTutorial) {
            inventory.PlayedParkourTutorial = true;
            inventory.ReceivedStartingGear = true;
        }
        await inventory.save();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`error creating inventory" ${error.message}`);
        }
        throw new Error("error creating inventory that is not of instance Error");
    }
};

//const updateInventory = async (accountOwnerId: Types.ObjectId, inventoryChanges: any) => {};

const getInventory = async (accountOwnerId: string) => {
    const inventory = await Inventory.findOne({ accountOwnerId: accountOwnerId });

    if (!inventory) {
        throw new Error(`Didn't find an inventory for ${accountOwnerId}`);
    }

    return inventory;
};

const addPowerSuit = async (powersuitName: string, accountId: string): Promise<ISuitResponse> => {
    const inventory = await getInventory(accountId);
    const suitIndex = inventory.Suits.push({ ItemType: powersuitName, Configs: [], UpgradeVer: 101, XP: 0 });
    const changedInventory = await inventory.save();
    return changedInventory.Suits[suitIndex - 1].toJSON();
};

export const updateSlots = async (slotType: SlotType, accountId: string, slots: number) => {
    const inventory = await getInventory(accountId);

    switch (slotType) {
        case SlotType.SUIT:
            inventory.SuitBin.Slots += slots;
            break;
        case SlotType.WEAPON:
            inventory.WeaponBin.Slots += slots;
            break;
        default:
            throw new Error("invalid slot type");
    }
    await inventory.save();
};

export const updateCurrency = async (price: number, usePremium: boolean, accountId: string) => {
    const currencyName = usePremium ? "PremiumCredits" : "RegularCredits";

    const inventory = await getInventory(accountId);
    inventory[currencyName] = inventory[currencyName] - price;
    await inventory.save();
    return { [currencyName]: -price };
};

// TODO: AffiliationMods support (Nightwave).
export const updateGeneric = async (data: IGenericUpdate, accountId: string) => {
    const inventory = await getInventory(accountId);

    // Make it an array for easier parsing.
    if (typeof data.NodeIntrosCompleted === "string") {
        data.NodeIntrosCompleted = [data.NodeIntrosCompleted];
    }

    // Combine the two arrays into one.
    data.NodeIntrosCompleted = inventory.NodeIntrosCompleted.concat(data.NodeIntrosCompleted);

    // Remove duplicate entries.
    const nodes = [...new Set(data.NodeIntrosCompleted)];

    inventory.NodeIntrosCompleted = nodes;
    await inventory.save();

    return data;
};

export type WeaponTypeInternal = "LongGuns" | "Pistols" | "Melee";

export const addWeapon = async (
    weaponType: WeaponTypeInternal,
    weaponName: string,
    accountId: string
): Promise<IWeaponResponse> => {
    const inventory = await getInventory(accountId);

    let weaponIndex;
    switch (weaponType) {
        case "LongGuns":
            weaponIndex = inventory.LongGuns.push({ ItemType: weaponName, Configs: [], XP: 0 });
            break;
        case "Pistols":
            weaponIndex = inventory.Pistols.push({ ItemType: weaponName, Configs: [], XP: 0 });
            break;
        case "Melee":
            weaponIndex = inventory.Melee.push({ ItemType: weaponName, Configs: [], XP: 0 });
            break;
        default:
            throw new Error("unknown weapon type");
    }

    const changedInventory = await inventory.save();
    return changedInventory[weaponType][weaponIndex - 1].toJSON();
};

export const addCustomization = async (customizatonName: string, accountId: string): Promise<IFlavourItem> => {
    const inventory = await getInventory(accountId);

    const flavourItemIndex = inventory.FlavourItems.push({ ItemType: customizatonName }) - 1;
    const changedInventory = await inventory.save();
    return changedInventory.FlavourItems[flavourItemIndex].toJSON(); //mongoose bug forces as FlavourItem
};

const addGearExpByCategory = (
    inventory: IInventoryDatabaseDocument,
    gearArray: ISuitDatabase[] | IWeaponDatabase[] | undefined,
    categoryName: "Pistols" | "LongGuns" | "Melee" | "Suits"
) => {
    const category = inventory[categoryName];

    gearArray?.forEach(({ ItemId, XP }) => {
        const itemIndex = ItemId ? category.findIndex(item => item._id?.equals(ItemId.$oid)) : -1;
        const item = category[itemIndex];

        if (itemIndex !== -1 && item.XP != undefined) {
            item.XP += XP || 0;
            inventory.markModified(`${categoryName}.${itemIndex}.XP`);
        }
    });
};

const addMiscItems = (inventory: IInventoryDatabaseDocument, itemsArray: IMiscItem[] | undefined) => {
    const { MiscItems } = inventory;

    itemsArray?.forEach(({ ItemCount, ItemType }) => {
        const itemIndex = MiscItems.findIndex(miscItem => miscItem.ItemType === ItemType);

        if (itemIndex !== -1) {
            MiscItems[itemIndex].ItemCount += ItemCount;
            inventory.markModified(`MiscItems.${itemIndex}.ItemCount`);
        } else {
            MiscItems.push({ ItemCount, ItemType });
        }
    });
};

const addConsumables = (inventory: IInventoryDatabaseDocument, itemsArray: IConsumable[] | undefined) => {
    const { Consumables } = inventory;

    itemsArray?.forEach(({ ItemCount, ItemType }) => {
        const itemIndex = Consumables.findIndex(i => i.ItemType === ItemType);

        if (itemIndex !== -1) {
            Consumables[itemIndex].ItemCount += ItemCount;
            inventory.markModified(`Consumables.${itemIndex}.ItemCount`);
        } else {
            Consumables.push({ ItemCount, ItemType });
        }
    });
};

const addRecipes = (inventory: IInventoryDatabaseDocument, itemsArray: IConsumable[] | undefined) => {
    const { Recipes } = inventory;

    itemsArray?.forEach(({ ItemCount, ItemType }) => {
        const itemIndex = Recipes.findIndex(i => i.ItemType === ItemType);

        if (itemIndex !== -1) {
            Recipes[itemIndex].ItemCount += ItemCount;
            inventory.markModified(`Recipes.${itemIndex}.ItemCount`);
        } else {
            Recipes.push({ ItemCount, ItemType });
        }
    });
};

const addMods = (inventory: IInventoryDatabaseDocument, itemsArray: IRawUpgrade[] | undefined) => {
    const { RawUpgrades } = inventory;
    itemsArray?.forEach(({ ItemType, ItemCount }) => {
        const itemIndex = RawUpgrades.findIndex(i => i.ItemType === ItemType);

        if (itemIndex !== -1) {
            RawUpgrades[itemIndex].ItemCount += ItemCount;
            inventory.markModified(`RawUpgrades.${itemIndex}.ItemCount`);
        } else {
            RawUpgrades.push({ ItemCount, ItemType });
        }
    });
};

const addChallenges = (inventory: IInventoryDatabaseDocument, itemsArray: IChallengeProgress[] | undefined) => {
    const category = inventory.ChallengeProgress;

    itemsArray?.forEach(({ Name, Progress }) => {
        const itemIndex = category.findIndex(i => i.Name === Name);

        if (itemIndex !== -1) {
            category[itemIndex].Progress += Progress;
            inventory.markModified(`ChallengeProgress.${itemIndex}.ItemCount`);
        } else {
            category.push({ Name, Progress });
        }
    });
};

const addMissionComplate = (inventory: IInventoryDatabaseDocument, { Tag, Completes }: IMission) => {
    const { Missions } = inventory;
    const itemIndex = Missions.findIndex(item => item.Tag === Tag);

    if (itemIndex !== -1) {
        Missions[itemIndex].Completes += Completes;
        inventory.markModified(`Missions.${itemIndex}.Completes`);
    } else {
        Missions.push({ Tag, Completes });
    }
};

const gearKeys = ["Suits", "Pistols", "LongGuns", "Melee"] as const;
type GearKeysType = (typeof gearKeys)[number];

export const missionInventoryUpdate = async (data: IMissionInventoryUpdateRequest, accountId: string) => {
    const { RawUpgrades, MiscItems, RegularCredits, ChallengeProgress, FusionPoints, Consumables, Recipes, Missions } =
        data;
    const inventory = await getInventory(accountId);

    // credits
    inventory.RegularCredits += RegularCredits || 0;

    // endo
    inventory.FusionPoints += FusionPoints || 0;

    // Gear XP
    gearKeys.forEach((key: GearKeysType) => addGearExpByCategory(inventory, data[key], key));

    // other
    addMods(inventory, RawUpgrades);
    addMiscItems(inventory, MiscItems);
    addConsumables(inventory, Consumables);
    addRecipes(inventory, Recipes);
    addChallenges(inventory, ChallengeProgress);
    addMissionComplate(inventory, Missions!);

    const changedInventory = await inventory.save();
    return changedInventory.toJSON();
};

export const addBooster = async (ItemType: string, time: number, accountId: string): Promise<void> => {
    const currentTime = Math.floor(Date.now() / 1000) - 129600; // Value is wrong without 129600. Figure out why, please. :)

    const inventory = await getInventory(accountId);
    const { Boosters } = inventory;

    const itemIndex = Boosters.findIndex(booster => booster.ItemType === ItemType);

    if (itemIndex !== -1) {
        const existingBooster = Boosters[itemIndex];
        existingBooster.ExpiryDate = Math.max(existingBooster.ExpiryDate, currentTime) + time;
        inventory.markModified(`Boosters.${itemIndex}.ExpiryDate`);
    } else {
        Boosters.push({ ItemType, ExpiryDate: currentTime + time }) - 1;
    }

    await inventory.save();
};

export const upgradeMod = async (artifactsData: IArtifactsRequest, accountId: string): Promise<string | undefined> => {
    const { Upgrade, LevelDiff, Cost, FusionPointCost } = artifactsData;
    try {
        const inventory = await getInventory(accountId);
        const { Upgrades, RawUpgrades } = inventory;
        const { ItemType, UpgradeFingerprint, ItemId } = Upgrade;

        const safeUpgradeFingerprint = UpgradeFingerprint || '{"lvl":0}';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsedUpgradeFingerprint = JSON.parse(safeUpgradeFingerprint);
        parsedUpgradeFingerprint.lvl += LevelDiff;
        const stringifiedUpgradeFingerprint = JSON.stringify(parsedUpgradeFingerprint);

        let itemIndex = Upgrades.findIndex(upgrade => upgrade._id?.equals(ItemId!.$oid));

        if (itemIndex !== -1) {
            Upgrades[itemIndex].UpgradeFingerprint = stringifiedUpgradeFingerprint;
            inventory.markModified(`Upgrades.${itemIndex}.UpgradeFingerprint`);
        } else {
            itemIndex =
                Upgrades.push({
                    UpgradeFingerprint: stringifiedUpgradeFingerprint,
                    ItemType
                }) - 1;

            const rawItemIndex = RawUpgrades.findIndex(rawUpgrade => rawUpgrade.ItemType === ItemType);
            RawUpgrades[rawItemIndex].ItemCount--;
            if (RawUpgrades[rawItemIndex].ItemCount > 0) {
                inventory.markModified(`RawUpgrades.${rawItemIndex}.UpgradeFingerprint`);
            } else {
                RawUpgrades.splice(rawItemIndex, 1);
            }
        }

        inventory.RegularCredits -= Cost;
        inventory.FusionPoints -= FusionPointCost;

        const changedInventory = await inventory.save();
        const itemId = changedInventory.toJSON().Upgrades[itemIndex]?.ItemId?.$oid;

        if (!itemId) {
            throw new Error("Item Id not found in upgradeMod");
        }

        return itemId;
    } catch (error) {
        console.error("Error in upgradeMod:", error);
        throw error;
    }
};

export { createInventory, addPowerSuit };
