import { toMongoDate } from "../../helpers/inventoryHelpers.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { addMiscItem, getInventory } from "../../services/inventoryService.ts";
import { toStoreItem } from "../../services/itemDataService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { createGarden, getPersonalRooms } from "../../services/personalRoomsService.ts";
import type { IMongoDate } from "../../types/commonTypes.ts";
import type { IMissionReward } from "../../types/missionTypes.ts";
import type { IGardeningClient, IPersonalRoomsClient } from "../../types/personalRoomsTypes.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import type { RequestHandler } from "express";
import { dict_en, ExportResources } from "warframe-public-export-plus";

export const gardeningController: RequestHandler = async (req, res) => {
    const data = getJSONfromString<IGardeningRequest>(String(req.body));
    if (data.Mode != "HarvestAll") {
        throw new Error(`unexpected gardening mode: ${data.Mode}`);
    }

    const accountId = await getAccountIdForRequest(req);
    const [inventory, personalRooms] = await Promise.all([
        getInventory(accountId, "MiscItems"),
        getPersonalRooms(accountId, "Apartment")
    ]);

    // Harvest plants
    const inventoryChanges: IInventoryChanges = {};
    const rewards: Record<string, IMissionReward[][]> = {};
    for (const planter of personalRooms.Apartment.Gardening.Planters) {
        rewards[planter.Name] = [];
        for (const plant of planter.Plants) {
            const itemType =
                "/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItem" +
                plant.PlantType.substring(plant.PlantType.length - 1);
            const itemCount = Math.random() < 0.775 ? 2 : 4;

            addMiscItem(inventory, itemType, itemCount, inventoryChanges);

            rewards[planter.Name].push([
                {
                    StoreItem: toStoreItem(itemType),
                    TypeName: itemType,
                    ItemCount: itemCount,
                    DailyCooldown: false,
                    Rarity: itemCount == 2 ? 0.7743589743589744 : 0.22564102564102564,
                    TweetText: `${itemCount}x ${dict_en[ExportResources[itemType].name]} (Resource)`,
                    ProductCategory: "MiscItems"
                }
            ]);
        }
    }

    // Refresh garden
    personalRooms.Apartment.Gardening = createGarden();

    await Promise.all([inventory.save(), personalRooms.save()]);

    const planter = personalRooms.Apartment.Gardening.Planters[personalRooms.Apartment.Gardening.Planters.length - 1];
    const plant = planter.Plants[planter.Plants.length - 1];
    res.json({
        GardenTagName: planter.Name,
        PlantType: plant.PlantType,
        PlotIndex: plant.PlotIndex,
        EndTime: toMongoDate(plant.EndTime),
        InventoryChanges: inventoryChanges,
        Gardening: personalRooms.toJSON<IPersonalRoomsClient>().Apartment.Gardening,
        Rewards: rewards
    } satisfies IGardeningResponse);
};

interface IGardeningRequest {
    Mode: string;
}

interface IGardeningResponse {
    GardenTagName: string;
    PlantType: string;
    PlotIndex: number;
    EndTime: IMongoDate;
    InventoryChanges: IInventoryChanges;
    Gardening: IGardeningClient;
    Rewards: Record<string, IMissionReward[][]>;
}
