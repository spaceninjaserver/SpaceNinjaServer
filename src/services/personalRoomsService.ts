import { PersonalRooms } from "@/src/models/personalRoomsModel";

export const getPersonalRooms = async (accountId: string) => {
    const personalRooms = await PersonalRooms.findOne({ personalRoomsOwnerId: accountId });

    if (!personalRooms) {
        throw new Error(`personal rooms not found for account ${accountId}`);
    }
    return personalRooms;
};

export const updateShipFeature = async (accountId: string, shipFeature: string) => {
    const personalRooms = await getPersonalRooms(accountId);
    personalRooms.Ship.Features.push(shipFeature);

    //push if not already present

    //remove ship feature item from misc items
    await personalRooms.save();
};
