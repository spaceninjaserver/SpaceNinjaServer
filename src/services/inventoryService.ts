import { Inventory } from "../models/inventoryModel";
import new_inventory from "@/static/fixed_responses/new_inventory.json";
import config from "@/config.json";
import { Types } from "mongoose";

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

export { createInventory };
