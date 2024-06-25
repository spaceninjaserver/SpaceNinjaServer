import { PersonalRooms } from "@/src/models/personalRoomsModel";
import { logger } from "@/src/utils/logger";

export const getPersonalRooms = async (accountId: string) => {
    const personalRooms = await PersonalRooms.findOne({ personalRoomsOwnerId: accountId });

    if (!personalRooms) {
        logger.error(`personal rooms not found for account ${accountId}`);
        throw new Error("personal rooms not found");
    }
    return personalRooms;
};

export const unlockShipFeature = async (accountId: string, shipFeature: string) => {
    const personalRooms = await getPersonalRooms(accountId);
    if (!personalRooms.Ship.Features.includes(shipFeature)) personalRooms.Ship.Features.push(shipFeature);
    await personalRooms.save();
};

