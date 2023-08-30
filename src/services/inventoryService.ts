import { Inventory } from "@/src/models/inventoryModel";
import new_inventory from "@/static/fixed_responses/postTutorialInventory.json";
import config from "@/config.json";
import { Types } from "mongoose";
import { ISuitResponse } from "@/src/types/inventoryTypes/SuitTypes";
import { SlotType } from "@/src/types/purchaseTypes";
import { IWeaponResponse } from "@/src/types/inventoryTypes/weaponTypes";
import { FlavourItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { MissionInventoryUpdate, MissionInventoryUpdateCard, MissionInventoryUpdateGear, MissionInventoryUpdateItem } from "../types/missionInventoryUpdateType";

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

export const missionInventoryUpdate = async (data: MissionInventoryUpdate, accountId: string): Promise<void> => {
    const { RawUpgrades, MiscItems, Suits, Pistols, LongGuns, Melee, RegularCredits } = data;
    const inventory = await getInventory(accountId);

    // TODO - multipliers logic

    const addGearExpByCategory = (gearArray: MissionInventoryUpdateGear[] | undefined, categoryName: 'Pistols'|'LongGuns'|'Melee'|'Suits') => {
        const category = inventory[categoryName];

        gearArray?.forEach(({ ItemId, XP }) => {
            const itemIndex = category.findIndex(i => i._id?.equals(ItemId.$oid));
            const item = category[itemIndex];

            if (itemIndex !== -1 && item.XP!=undefined) {
                item.XP += XP;
                inventory.markModified(`${categoryName}.${itemIndex}.XP`);
            }
        });
    };

    const addItemsByCategory = (itemsArray: (MissionInventoryUpdateItem | MissionInventoryUpdateCard)[] | undefined, categoryName: 'RawUpgrades'|'MiscItems') => {
        const category = inventory[categoryName];

        itemsArray?.forEach(({ ItemCount, ItemType }) => {
            const itemIndex = category.findIndex(i => i.ItemType === ItemType);

            if (itemIndex !== -1) {
                category[itemIndex].ItemCount += ItemCount;
                inventory.markModified(`${categoryName}.${itemIndex}.ItemCount`);
            } else {
                category.push({ ItemCount, ItemType });
            }
        });
    };

    inventory.RegularCredits += RegularCredits||0;
    addGearExpByCategory(Pistols, 'Pistols');
    addGearExpByCategory(LongGuns, 'LongGuns');
    addGearExpByCategory(Melee, 'Melee');
    addGearExpByCategory(Suits, 'Suits');
    addItemsByCategory(RawUpgrades, 'RawUpgrades'); // TODO - check mods fusion level
    addItemsByCategory(MiscItems, 'MiscItems');

    // TODO - save ChallengeProgress (idk where to save)

    await inventory.save();
};

export { createInventory, addPowerSuit };
