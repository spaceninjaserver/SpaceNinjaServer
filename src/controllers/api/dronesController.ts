import { toMongoDate, toOid } from "../../helpers/inventoryHelpers.ts";
import { addMiscItems, getInventory } from "../../services/inventoryService.ts";
import { fromStoreItem } from "../../services/itemDataService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getRandomInt, getRandomWeightedRewardUc } from "../../services/rngService.ts";
import type { IMongoDate, IOid } from "../../types/commonTypes.ts";
import type { IDroneClient } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import type { RequestHandler } from "express";
import { ExportDrones, ExportResources, ExportSystems } from "warframe-public-export-plus";

export const dronesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    if ("GetActive" in req.query) {
        const inventory = await getInventory(accountId, "Drones");
        const activeDrones: IActiveDrone[] = [];
        for (const drone of inventory.Drones) {
            if (drone.DeployTime) {
                activeDrones.push({
                    DeployTime: toMongoDate(drone.DeployTime),
                    System: drone.System!,
                    ItemId: toOid(drone._id),
                    ItemType: drone.ItemType,
                    CurrentHP: drone.CurrentHP,
                    DamageTime: toMongoDate(drone.DamageTime!),
                    PendingDamage: drone.PendingDamage!,
                    Resources: [
                        {
                            ItemType: drone.ResourceType!,
                            BinTotal: drone.ResourceCount!,
                            StartTime: toMongoDate(drone.DeployTime)
                        }
                    ]
                });
            }
        }
        res.json({
            ActiveDrones: activeDrones
        });
    } else if ("droneId" in req.query && "systemIndex" in req.query) {
        const inventory = await getInventory(
            accountId,
            "Drones instantResourceExtractorDrones noResourceExtractorDronesDamage"
        );
        const drone = inventory.Drones.id(req.query.droneId as string)!;
        const droneMeta = ExportDrones[drone.ItemType];
        drone.DeployTime = inventory.instantResourceExtractorDrones ? new Date(0) : new Date();
        if (drone.RepairStart) {
            const repairMinutes = (Date.now() - drone.RepairStart.getTime()) / 60_000;
            const hpPerMinute = droneMeta.repairRate / 60;
            drone.CurrentHP = Math.min(drone.CurrentHP + Math.round(repairMinutes * hpPerMinute), droneMeta.durability);
            drone.RepairStart = undefined;
        }
        drone.System = parseInt(req.query.systemIndex as string);
        const system = ExportSystems[drone.System - 1];
        drone.DamageTime = inventory.instantResourceExtractorDrones
            ? new Date()
            : new Date(Date.now() + getRandomInt(3 * 3600 * 1000, 4 * 3600 * 1000));
        drone.PendingDamage =
            !inventory.noResourceExtractorDronesDamage && Math.random() < system.damageChance
                ? getRandomInt(system.droneDamage.minValue, system.droneDamage.maxValue)
                : 0;
        const resource = getRandomWeightedRewardUc(system.resources, droneMeta.probabilities)!;
        //logger.debug(`drone rolled`, resource);
        drone.ResourceType = fromStoreItem(resource.StoreItem);
        const resourceMeta = ExportResources[drone.ResourceType];
        if (resourceMeta.pickupQuantity) {
            const pickupsToCollect = droneMeta.binCapacity * droneMeta.capacityMultipliers[resource.Rarity];
            drone.ResourceCount = 0;
            for (let i = 0; i != pickupsToCollect; ++i) {
                drone.ResourceCount += getRandomInt(
                    resourceMeta.pickupQuantity.minValue,
                    resourceMeta.pickupQuantity.maxValue
                );
            }
        } else {
            drone.ResourceCount = droneMeta.binCapacity * droneMeta.capacityMultipliers[resource.Rarity];
        }
        await inventory.save();
        res.json({});
    } else if ("collectDroneId" in req.query) {
        const inventory = await getInventory(accountId);
        const drone = inventory.Drones.id(req.query.collectDroneId as string)!;

        if (new Date() >= drone.DamageTime!) {
            drone.CurrentHP -= drone.PendingDamage!;
            drone.RepairStart = new Date();
        }

        const inventoryChanges: IInventoryChanges = {};
        if (drone.CurrentHP <= 0) {
            inventory.RegularCredits += 100;
            inventoryChanges.RegularCredits = 100;
            inventory.Drones.pull({ _id: req.query.collectDroneId as string });
            inventoryChanges.RemovedIdItems = [
                {
                    ItemId: { $oid: req.query.collectDroneId as string }
                }
            ];
        } else {
            const completionTime = drone.DeployTime!.getTime() + ExportDrones[drone.ItemType].fillRate * 3600_000;
            if (Date.now() >= completionTime) {
                const miscItemChanges = [
                    {
                        ItemType: drone.ResourceType!,
                        ItemCount: drone.ResourceCount!
                    }
                ];
                addMiscItems(inventory, miscItemChanges);
                inventoryChanges.MiscItems = miscItemChanges;
            }

            drone.DeployTime = undefined;
            drone.System = undefined;
            drone.DamageTime = undefined;
            drone.PendingDamage = undefined;
            drone.ResourceType = undefined;
            drone.ResourceCount = undefined;

            inventoryChanges.Drones = [drone.toJSON<IDroneClient>()];
        }

        await inventory.save();
        res.json({
            InventoryChanges: inventoryChanges
        });
    } else {
        throw new Error(`drones.php query not handled`);
    }
};

interface IActiveDrone {
    DeployTime: IMongoDate;
    System: number;
    ItemId: IOid;
    ItemType: string;
    CurrentHP: number;
    DamageTime: IMongoDate;
    PendingDamage: number;
    Resources: {
        ItemType: string;
        BinTotal: number;
        StartTime: IMongoDate;
    }[];
}
