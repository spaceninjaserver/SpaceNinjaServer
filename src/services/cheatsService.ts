import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import type { IAccountCheats } from "../types/inventoryTypes/inventoryTypes.ts";

interface ILockCheat {
    projection: string;
    isInventoryInIdealState: (inventory: TInventoryDatabaseDocument) => boolean;
    cleanupInventory: (inventory: TInventoryDatabaseDocument) => void;
}

export const lockCheats: Partial<Record<keyof IAccountCheats, ILockCheat>> = {
    alertsRepeatable: {
        projection: "CompletedAlerts PeriodicMissionCompletions",
        isInventoryInIdealState: (inventory: TInventoryDatabaseDocument) =>
            !inventory.CompletedAlerts.length && !inventory.PeriodicMissionCompletions.length,
        cleanupInventory: (inventory: TInventoryDatabaseDocument) => {
            inventory.CompletedAlerts.splice(0);
            inventory.PeriodicMissionCompletions.splice(0);
        }
    },
    syndicateMissionsRepeatable: {
        projection: "CompletedSyndicates",
        isInventoryInIdealState: (inventory: TInventoryDatabaseDocument) => !inventory.CompletedSyndicates.length,
        cleanupInventory: (inventory: TInventoryDatabaseDocument) => {
            inventory.CompletedSyndicates.splice(0);
        }
    },
    noVendorPurchaseLimits: {
        projection: "RecentVendorPurchases UsedDailyDeals",
        isInventoryInIdealState: (inventory: TInventoryDatabaseDocument) =>
            !inventory.RecentVendorPurchases?.length && !inventory.UsedDailyDeals.length,
        cleanupInventory: (inventory: TInventoryDatabaseDocument) => {
            inventory.RecentVendorPurchases?.splice(0);
            inventory.UsedDailyDeals.splice(0);
        }
    },
    noDeathMarks: {
        projection: "DeathMarks Harvestable DeathSquadable",
        isInventoryInIdealState: (inventory: TInventoryDatabaseDocument) =>
            !inventory.DeathMarks.length && !inventory.Harvestable && !inventory.DeathSquadable,
        cleanupInventory: (inventory: TInventoryDatabaseDocument) => {
            inventory.DeathMarks.splice(0);
            if (inventory.Harvestable) {
                inventory.Harvestable = false;
            }
            if (inventory.DeathSquadable) {
                inventory.DeathSquadable = false;
            }
        }
    },

    noMasteryRankUpCooldown: {
        projection: "TrainingDate",
        isInventoryInIdealState: (inventory: TInventoryDatabaseDocument) =>
            inventory.TrainingDate.getTime() > Date.now(),
        cleanupInventory: (inventory: TInventoryDatabaseDocument) => {
            inventory.TrainingDate = new Date();
        }
    },
    noBlessingCooldown: {
        projection: "BlessingCooldown",
        isInventoryInIdealState: (inventory: TInventoryDatabaseDocument) =>
            (inventory.BlessingCooldown?.getTime() ?? 0) > Date.now(),
        cleanupInventory: (inventory: TInventoryDatabaseDocument) => {
            inventory.BlessingCooldown = new Date();
        }
    },
    noKimCooldowns: {
        projection: "DialogueHistory",
        isInventoryInIdealState: (inventory: TInventoryDatabaseDocument) => {
            if (inventory.DialogueHistory?.Dialogues) {
                for (const diag of inventory.DialogueHistory.Dialogues) {
                    if (diag.AvailableDate.getTime() > Date.now() || diag.AvailableGiftDate.getTime() > Date.now()) {
                        return false;
                    }
                }
            }
            return true;
        },
        cleanupInventory: (inventory: TInventoryDatabaseDocument) => {
            if (inventory.DialogueHistory?.Dialogues) {
                for (const diag of inventory.DialogueHistory.Dialogues) {
                    if (diag.AvailableDate.getTime() > Date.now()) {
                        diag.AvailableDate = new Date();
                    }
                    if (diag.AvailableGiftDate.getTime() > Date.now()) {
                        diag.AvailableGiftDate = new Date();
                    }
                }
            }
        }
    }
};
