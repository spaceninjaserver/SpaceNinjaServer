import { PersonalRooms } from "@/src/models/personalRoomsModel";
import { addItem, getInventory } from "@/src/services/inventoryService";
import { TPersonalRoomsDatabaseDocument } from "../types/personalRoomsTypes";

export const getPersonalRooms = async (accountId: string): Promise<TPersonalRoomsDatabaseDocument> => {
    const personalRooms = await PersonalRooms.findOne({ personalRoomsOwnerId: accountId });

    if (!personalRooms) {
        throw new Error(`personal rooms not found for account ${accountId}`);
    }
    return personalRooms;
};

export const updateShipFeature = async (accountId: string, shipFeature: string): Promise<void> => {
    const personalRooms = await getPersonalRooms(accountId);

    if (personalRooms.Ship.Features.includes(shipFeature)) {
        throw new Error(`ship feature ${shipFeature} already unlocked`);
    }

    personalRooms.Ship.Features.push(shipFeature);
    await personalRooms.save();

    const inventory = await getInventory(accountId);
    await addItem(inventory, shipFeature, -1);
    await inventory.save();
};
