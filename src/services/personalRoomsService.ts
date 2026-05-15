import { PersonalRooms } from "../models/personalRoomsModel.ts";
import { addItem } from "./inventoryService.ts";
import type {
    IGardeningDatabase,
    IGetShipResponse,
    IPersonalRoomsClient,
    TPersonalRoomsDatabaseDocument
} from "../types/personalRoomsTypes.ts";
import { getRandomElement } from "./rngService.ts";
import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import { logger } from "../utils/logger.ts";
import type { Types } from "mongoose";
import { getLoadout } from "./loadoutService.ts";
import { toOid } from "../helpers/inventoryHelpers.ts";
import type { ILoadoutClient } from "../types/saveLoadoutTypes.ts";

export const getPersonalRooms = async (
    accountId: string | Types.ObjectId,
    projection?: string
): Promise<TPersonalRoomsDatabaseDocument> => {
    const personalRooms = await PersonalRooms.findOne({ personalRoomsOwnerId: accountId }, projection);

    if (!personalRooms) {
        throw new Error(`personal rooms not found for account ${String(accountId)}`);
    }
    return personalRooms;
};

export const unlockShipFeature = async (inventory: TInventoryDatabaseDocument, shipFeature: string): Promise<void> => {
    const personalRooms = await getPersonalRooms(inventory.accountOwnerId.toString());

    if (personalRooms.Ship.Features.includes(shipFeature)) {
        logger.warn(`ship feature ${shipFeature} already unlocked`);
    } else {
        personalRooms.Ship.Features.push(shipFeature);
        await personalRooms.save();
    }
    const miscItem = inventory.MiscItems.find(x => x.ItemType === shipFeature);
    if (miscItem && miscItem.ItemCount > 0) await addItem(inventory, shipFeature, miscItem.ItemCount * -1);
};

export const createGarden = (): IGardeningDatabase => {
    const plantTypes = [
        "/Lotus/Types/Items/Plants/MiscItems/DuvxDuviriGrowingPlantA",
        "/Lotus/Types/Items/Plants/MiscItems/DuvxDuviriGrowingPlantB",
        "/Lotus/Types/Items/Plants/MiscItems/DuvxDuviriGrowingPlantC",
        "/Lotus/Types/Items/Plants/MiscItems/DuvxDuviriGrowingPlantD",
        "/Lotus/Types/Items/Plants/MiscItems/DuvxDuviriGrowingPlantE",
        "/Lotus/Types/Items/Plants/MiscItems/DuvxDuviriGrowingPlantF"
    ];
    const endTime = new Date((Math.trunc(Date.now() / 1000) + 79200) * 1000); // Plants will take 22 hours to grow
    return {
        Planters: [
            {
                Name: "Garden0",
                Plants: [
                    {
                        PlantType: getRandomElement(plantTypes)!,
                        EndTime: endTime,
                        PlotIndex: 0
                    },
                    {
                        PlantType: getRandomElement(plantTypes)!,
                        EndTime: endTime,
                        PlotIndex: 1
                    }
                ]
            },
            {
                Name: "Garden1",
                Plants: [
                    {
                        PlantType: getRandomElement(plantTypes)!,
                        EndTime: endTime,
                        PlotIndex: 0
                    },
                    {
                        PlantType: getRandomElement(plantTypes)!,
                        EndTime: endTime,
                        PlotIndex: 1
                    }
                ]
            },
            {
                Name: "Garden2",
                Plants: [
                    {
                        PlantType: getRandomElement(plantTypes)!,
                        EndTime: endTime,
                        PlotIndex: 0
                    },
                    {
                        PlantType: getRandomElement(plantTypes)!,
                        EndTime: endTime,
                        PlotIndex: 1
                    }
                ]
            }
        ]
    };
};

export const refreshContentUrlSignature = (personalRooms: TPersonalRoomsDatabaseDocument): void => {
    personalRooms.Ship.ContentUrlSignature = "";
    for (let i = 0; i != 16; ++i) {
        personalRooms.Ship.ContentUrlSignature += Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, "0");
    }
};

export const getShip = async (personalRoomsDb: TPersonalRoomsDatabaseDocument): Promise<IGetShipResponse> => {
    const personalRooms = personalRoomsDb.toJSON<IPersonalRoomsClient>();
    const loadout = await getLoadout(personalRoomsDb.personalRoomsOwnerId);
    return {
        ShipOwnerId: personalRoomsDb.personalRoomsOwnerId.toString(),
        LoadOutInventory: { LoadOutPresets: loadout.toJSON<ILoadoutClient>() },
        Ship: {
            ...personalRooms.Ship,
            ShipId: toOid(personalRoomsDb.activeShipId)
        },
        Apartment: personalRooms.Apartment,
        TailorShop: personalRooms.TailorShop
    };
};
