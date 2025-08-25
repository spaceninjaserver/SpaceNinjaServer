import { PersonalRooms } from "@/src/models/personalRoomsModel";
import { addItem, getInventory } from "@/src/services/inventoryService";
import type { IGardeningDatabase, TPersonalRoomsDatabaseDocument } from "@/src/types/personalRoomsTypes";
import { getRandomElement } from "@/src/services/rngService";

export const getPersonalRooms = async (
    accountId: string,
    projection?: string
): Promise<TPersonalRoomsDatabaseDocument> => {
    const personalRooms = await PersonalRooms.findOne({ personalRoomsOwnerId: accountId }, projection);

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
