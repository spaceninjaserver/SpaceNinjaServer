import { Inventory } from "@/src/models/inventoryModel";
import new_inventory from "@/static/fixed_responses/postTutorialInventory.json";
import config from "@/config.json";
import { Types } from "mongoose";
import { ISuitResponse } from "@/src/types/inventoryTypes/SuitTypes";
import { SlotType } from "@/src/types/purchaseTypes";
import { IWeaponResponse } from "@/src/types/inventoryTypes/weaponTypes";
import {
    ChallengeProgress,
    CrewShipSalvagedWeaponSkin,
    FlavourItem,
    IInventoryDatabaseDocument,
    MiscItem,
    RawUpgrade
} from "@/src/types/inventoryTypes/inventoryTypes";
import { IMissionInventoryUpdate, IMissionInventoryUpdateGear } from "../types/missionInventoryUpdateType";

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

export const addCustomization = async (customizatonName: string, accountId: string): Promise<FlavourItem> => {
    const inventory = await getInventory(accountId);

    const flavourItemIndex = inventory.FlavourItems.push({ ItemType: customizatonName }) - 1;
    const changedInventory = await inventory.save();
    return changedInventory.FlavourItems[flavourItemIndex].toJSON(); //mongoose bug forces as FlavourItem
};

const addGearExpByCategory = (
    inventory: IInventoryDatabaseDocument,
    gearArray: IMissionInventoryUpdateGear[] | undefined,
    categoryName: "Pistols" | "LongGuns" | "Melee" | "Suits"
) => {
    const category = inventory[categoryName];

    gearArray?.forEach(({ ItemId, XP }) => {
        const itemIndex = category.findIndex(i => i._id?.equals(ItemId.$oid));
        const item = category[itemIndex];

        if (itemIndex !== -1 && item.XP != undefined) {
            item.XP += XP;
            inventory.markModified(`${categoryName}.${itemIndex}.XP`);
        }
    });
};

const addMiscItems = (inventory: IInventoryDatabaseDocument, itemsArray: MiscItem[] | undefined) => {
    const { MiscItems } = inventory;

    itemsArray?.forEach(({ ItemCount, ItemType }) => {
        const itemIndex = MiscItems.findIndex(i => i.ItemType === ItemType);

        if (itemIndex !== -1) {
            MiscItems[itemIndex].ItemCount += ItemCount;
            inventory.markModified(`MiscItems.${itemIndex}.ItemCount`);
        } else {
            MiscItems.push({ ItemCount, ItemType });
        }
    });
};

const addMods = (inventory: IInventoryDatabaseDocument, itemsArray: RawUpgrade[] | undefined) => {
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

const addChallenges = (inventory: IInventoryDatabaseDocument, itemsArray: ChallengeProgress[] | undefined) => {
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

const gearKeys = ["Suits", "Pistols", "LongGuns", "Melee"] as const;
type GearKeysType = (typeof gearKeys)[number];

export const missionInventoryUpdate = async (data: IMissionInventoryUpdate, accountId: string) => {
    const { RawUpgrades, MiscItems, RegularCredits, ChallengeProgress } = data;
    const inventory = await getInventory(accountId);

    // TODO - multipliers logic for mission reward (looted comes multiplied)

    // credits
    inventory.RegularCredits += RegularCredits || 0;

    // gear exp
    gearKeys.forEach((key: GearKeysType) => addGearExpByCategory(inventory, data[key], key));

    // other
    addMods(inventory, RawUpgrades);
    addMiscItems(inventory, MiscItems);
    addChallenges(inventory, ChallengeProgress);

    const changedInventory = await inventory.save();
    return changedInventory.toJSON();
};

export const addBooster = async (ItemType: string, time: number, accountId: string): Promise<void> => {
    const currentTime = Math.floor(Date.now() / 1000) - 129600; // booster time getting more without 129600, probably defence logic, idk

    const inventory = await getInventory(accountId);
    const { Boosters } = inventory;

    const itemIndex = Boosters.findIndex(i => i.ItemType === ItemType);

    if (itemIndex !== -1) {
        const existingBooster = Boosters[itemIndex];
        existingBooster.ExpiryDate = Math.max(existingBooster.ExpiryDate, currentTime) + time;
        inventory.markModified(`Boosters.${itemIndex}.ExpiryDate`);
    } else {
        Boosters.push({ ItemType, ExpiryDate: currentTime + time }) - 1;
    }

    await inventory.save();
};

export const upgradeMod = async (
    {
        Upgrade,
        LevelDiff,
        Cost,
        FusionPointCost
    }: { Upgrade: CrewShipSalvagedWeaponSkin; LevelDiff: number; Cost: number; FusionPointCost: number },
    accountId: string
): Promise<string | undefined> => {
    try {
        const inventory = await getInventory(accountId);
        const { Upgrades, RawUpgrades } = inventory;
        const { ItemType, UpgradeFingerprint, ItemId } = Upgrade;

        const safeUpgradeFingerprint = UpgradeFingerprint || '{"lvl":0}';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsedUpgradeFingerprint = JSON.parse(safeUpgradeFingerprint);
        parsedUpgradeFingerprint.lvl += LevelDiff;
        const stringifiedUpgradeFingerprint = JSON.stringify(parsedUpgradeFingerprint);

        let itemIndex = Upgrades.findIndex(i => i._id?.equals(ItemId!.$oid));

        if (itemIndex !== -1) {
            Upgrades[itemIndex].UpgradeFingerprint = stringifiedUpgradeFingerprint;
            inventory.markModified(`Upgrades.${itemIndex}.UpgradeFingerprint`);
        } else {
            itemIndex =
                Upgrades.push({
                    UpgradeFingerprint: stringifiedUpgradeFingerprint,
                    ItemType
                }) - 1;

            const rawItemIndex = RawUpgrades.findIndex(i => i.ItemType === ItemType);
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
