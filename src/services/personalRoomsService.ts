import { PersonalRooms } from "@/src/models/personalRoomsModel";

export const getPersonalRooms = async (accountId: string) => {
    const personalRooms = await PersonalRooms.findOne({ personalRoomsOwnerId: accountId });

    if (!personalRooms) {
        throw new Error(`personal rooms not found for account ${accountId}`);
    }
    return personalRooms;
};
