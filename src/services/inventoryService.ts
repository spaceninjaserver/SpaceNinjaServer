import { Inventory } from "@/src/models/inventoryModel";
import new_inventory from "@/static/fixed_responses/postTutorialInventory.json";
import config from "@/config.json";
import { Types } from "mongoose";
import { InventoryChanges } from "../types/commonTypes";

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

const UpdateInventory = async (accountId: string, inventoryChanges: InventoryChanges) => {
    try {
        const inventory = await Inventory.findOne({ accountOwnerId: accountId });
        if (inventory) {
            if (inventoryChanges.Suits) {
                inventoryChanges.Suits.forEach(item => {
                    if (item.ItemId && item.ItemType) {
                        inventory.Suits.push({
                            ItemType: item.ItemType,
                            Configs: [],
                            ItemId: item.ItemId
                        });
                    }
                });
            }
            if (inventoryChanges.LongGuns) {
                inventoryChanges.LongGuns.forEach(item => {
                    if (item.ItemId && item.ItemType) {
                        inventory.LongGuns.push({
                            ItemType: item.ItemType,
                            Configs: [],
                            ItemId: item.ItemId
                        });
                    }
                });
            }
            if (inventoryChanges.Pistols) {
                inventoryChanges.Pistols.forEach(item => {
                    if (item.ItemId && item.ItemType) {
                        inventory.Pistols.push({
                            ItemType: item.ItemType,
                            Configs: [],
                            ItemId: item.ItemId
                        });
                    }
                });
            }
            if (inventoryChanges.Melee) {
                inventoryChanges.Melee.forEach(item => {
                    if (item.ItemId && item.ItemType) {
                        inventory.Melee.push({
                            ItemType: item.ItemType,
                            Configs: [],
                            ItemId: item.ItemId
                        });
                    }
                });
            }
            if (inventoryChanges.FlavourItems) {
                inventoryChanges.FlavourItems.forEach(item => {
                    if (item.ItemType) {
                        inventory.FlavourItems.push({
                            ItemType: item.ItemType
                        });
                    }
                });
            }
            if (inventoryChanges.MiscItems) {
                inventoryChanges.MiscItems.forEach(item => {
                    if (item.ItemType && item.ItemCount) {
                        inventory.MiscItems.push({
                            ItemType: item.ItemType,
                            ItemCount: item.ItemCount
                        });
                    }
                });
            }
            await inventory.updateOne(inventory);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`error update inventory" ${error.message}`);
        }
        throw new Error("error update inventory that is not of instance Error");
    }
};

export { createInventory, UpdateInventory };
