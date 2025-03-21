import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { Inventory, TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { config } from "@/src/services/configService";
import allDialogue from "@/static/fixed_responses/allDialogue.json";
import { ILoadoutDatabase } from "@/src/types/saveLoadoutTypes";
import { IInventoryClient, IShipInventory, equipmentKeys } from "@/src/types/inventoryTypes/inventoryTypes";
import { IPolarity, ArtifactPolarity, EquipmentFeatures } from "@/src/types/inventoryTypes/commonInventoryTypes";
import {
    ExportCustoms,
    ExportFlavour,
    ExportRegions,
    ExportResources,
    ExportVirtuals
} from "warframe-public-export-plus";
import { applyCheatsToInfestedFoundry, handleSubsumeCompletion } from "./infestedFoundryController";
import { addMiscItems, allDailyAffiliationKeys, createLibraryDailyTask } from "@/src/services/inventoryService";
import { logger } from "@/src/utils/logger";

export const inventoryController: RequestHandler = async (request, response) => {
    const accountId = await getAccountIdForRequest(request);

    const inventory = await Inventory.findOne({ accountOwnerId: accountId });

    if (!inventory) {
        response.status(400).json({ error: "inventory was undefined" });
        return;
    }

    // Handle daily reset
    if (!inventory.NextRefill || Date.now() >= inventory.NextRefill.getTime()) {
        for (const key of allDailyAffiliationKeys) {
            inventory[key] = 16000 + inventory.PlayerLevel * 500;
        }
        inventory.DailyFocus = 250000 + inventory.PlayerLevel * 5000;

        inventory.LibraryAvailableDailyTaskInfo = createLibraryDailyTask();

        if (inventory.NextRefill) {
            if (config.noArgonCrystalDecay) {
                inventory.FoundToday = undefined;
            } else {
                const lastLoginDay = Math.trunc(inventory.NextRefill.getTime() / 86400000) - 1;
                const today = Math.trunc(Date.now() / 86400000);
                const daysPassed = today - lastLoginDay;
                for (let i = 0; i != daysPassed; ++i) {
                    const numArgonCrystals =
                        inventory.MiscItems.find(x => x.ItemType == "/Lotus/Types/Items/MiscItems/ArgonCrystal")
                            ?.ItemCount ?? 0;
                    if (numArgonCrystals == 0) {
                        break;
                    }
                    const numStableArgonCrystals =
                        inventory.FoundToday?.find(x => x.ItemType == "/Lotus/Types/Items/MiscItems/ArgonCrystal")
                            ?.ItemCount ?? 0;
                    const numDecayingArgonCrystals = numArgonCrystals - numStableArgonCrystals;
                    const numDecayingArgonCrystalsToRemove = Math.ceil(numDecayingArgonCrystals / 2);
                    logger.debug(`ticking argon crystals for day ${i + 1} of ${daysPassed}`, {
                        numArgonCrystals,
                        numStableArgonCrystals,
                        numDecayingArgonCrystals,
                        numDecayingArgonCrystalsToRemove
                    });
                    // Remove half of owned decaying argon crystals
                    addMiscItems(inventory, [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/ArgonCrystal",
                            ItemCount: numDecayingArgonCrystalsToRemove * -1
                        }
                    ]);
                    // All stable argon crystals are now decaying
                    inventory.FoundToday = undefined;
                }
            }
        }

        inventory.NextRefill = new Date((Math.trunc(Date.now() / 86400000) + 1) * 86400000);
        await inventory.save();
    }

    if (
        inventory.InfestedFoundry &&
        inventory.InfestedFoundry.AbilityOverrideUnlockCooldown &&
        new Date() >= inventory.InfestedFoundry.AbilityOverrideUnlockCooldown
    ) {
        handleSubsumeCompletion(inventory);
        await inventory.save();
    }

    response.json(await getInventoryResponse(inventory, "xpBasedLevelCapDisabled" in request.query));
};

export const getInventoryResponse = async (
    inventory: TInventoryDatabaseDocument,
    xpBasedLevelCapDisabled: boolean
): Promise<IInventoryClient> => {
    const inventoryWithLoadOutPresets = await inventory.populate<{ LoadOutPresets: ILoadoutDatabase }>(
        "LoadOutPresets"
    );
    const inventoryWithLoadOutPresetsAndShips = await inventoryWithLoadOutPresets.populate<{ Ships: IShipInventory }>(
        "Ships"
    );
    const inventoryResponse = inventoryWithLoadOutPresetsAndShips.toJSON<IInventoryClient>();

    if (config.infiniteCredits) {
        inventoryResponse.RegularCredits = 999999999;
    }
    if (config.infinitePlatinum) {
        inventoryResponse.PremiumCreditsFree = 0;
        inventoryResponse.PremiumCredits = 999999999;
    }
    if (config.infiniteEndo) {
        inventoryResponse.FusionPoints = 999999999;
    }
    if (config.infiniteRegalAya) {
        inventoryResponse.PrimeTokens = 999999999;
    }

    if (config.skipAllDialogue) {
        inventoryResponse.TauntHistory = [
            {
                node: "TreasureTutorial",
                state: "TS_COMPLETED"
            }
        ];
        for (const str of allDialogue) {
            addString(inventoryResponse.NodeIntrosCompleted, str);
        }
    }

    if (config.unlockAllMissions) {
        inventoryResponse.Missions = [];
        for (const tag of Object.keys(ExportRegions)) {
            inventoryResponse.Missions.push({
                Completes: 1,
                Tier: 1,
                Tag: tag
            });
        }
        addString(inventoryResponse.NodeIntrosCompleted, "TeshinHardModeUnlocked");
    }

    if (config.unlockAllShipDecorations) {
        inventoryResponse.ShipDecorations = [];
        for (const [uniqueName, item] of Object.entries(ExportResources)) {
            if (item.productCategory == "ShipDecorations") {
                inventoryResponse.ShipDecorations.push({ ItemType: uniqueName, ItemCount: 1 });
            }
        }
    }

    if (config.unlockAllFlavourItems) {
        inventoryResponse.FlavourItems = [];
        for (const uniqueName in ExportFlavour) {
            inventoryResponse.FlavourItems.push({ ItemType: uniqueName });
        }
    }

    if (config.unlockAllSkins) {
        const missingWeaponSkins = new Set(Object.keys(ExportCustoms));
        inventoryResponse.WeaponSkins.forEach(x => missingWeaponSkins.delete(x.ItemType));
        for (const uniqueName of missingWeaponSkins) {
            inventoryResponse.WeaponSkins.push({
                ItemId: {
                    $oid: "ca70ca70ca70ca70" + catBreadHash(uniqueName).toString(16).padStart(8, "0")
                },
                ItemType: uniqueName
            });
        }
    }

    if (config.unlockAllCapturaScenes) {
        for (const uniqueName of Object.keys(ExportResources)) {
            if (resourceInheritsFrom(uniqueName, "/Lotus/Types/Items/MiscItems/PhotoboothTile")) {
                inventoryResponse.MiscItems.push({
                    ItemType: uniqueName,
                    ItemCount: 1
                });
            }
        }
    }

    if (typeof config.spoofMasteryRank === "number" && config.spoofMasteryRank >= 0) {
        inventoryResponse.PlayerLevel = config.spoofMasteryRank;
        if (!xpBasedLevelCapDisabled) {
            // This client has not been patched to accept any mastery rank, need to fake the XP.
            inventoryResponse.XPInfo = [];
            let numFrames = getExpRequiredForMr(Math.min(config.spoofMasteryRank, 5030)) / 6000;
            while (numFrames-- > 0) {
                inventoryResponse.XPInfo.push({
                    ItemType: "/Lotus/Powersuits/Mag/Mag",
                    XP: 1_600_000
                });
            }
        }
    }

    if (config.universalPolarityEverywhere) {
        const Polarity: IPolarity[] = [];
        for (let i = 0; i != 12; ++i) {
            Polarity.push({
                Slot: i,
                Value: ArtifactPolarity.Any
            });
        }
        for (const key of equipmentKeys) {
            if (key in inventoryResponse) {
                for (const equipment of inventoryResponse[key]) {
                    equipment.Polarity = Polarity;
                }
            }
        }
    }

    if (config.unlockDoubleCapacityPotatoesEverywhere) {
        for (const key of equipmentKeys) {
            if (key in inventoryResponse) {
                for (const equipment of inventoryResponse[key]) {
                    equipment.Features ??= 0;
                    equipment.Features |= EquipmentFeatures.DOUBLE_CAPACITY;
                }
            }
        }
    }

    if (config.unlockExilusEverywhere) {
        for (const key of equipmentKeys) {
            if (key in inventoryResponse) {
                for (const equipment of inventoryResponse[key]) {
                    equipment.Features ??= 0;
                    equipment.Features |= EquipmentFeatures.UTILITY_SLOT;
                }
            }
        }
    }

    if (config.unlockArcanesEverywhere) {
        for (const key of equipmentKeys) {
            if (key in inventoryResponse) {
                for (const equipment of inventoryResponse[key]) {
                    equipment.Features ??= 0;
                    equipment.Features |= EquipmentFeatures.ARCANE_SLOT;
                }
            }
        }
    }

    if (config.noDailyStandingLimits) {
        const spoofedDailyAffiliation = Math.max(999_999, 16000 + inventoryResponse.PlayerLevel * 500);
        for (const key of allDailyAffiliationKeys) {
            inventoryResponse[key] = spoofedDailyAffiliation;
        }
    }

    if (inventoryResponse.InfestedFoundry) {
        applyCheatsToInfestedFoundry(inventoryResponse.InfestedFoundry);
    }

    // Omitting this field so opening the navigation resyncs the inventory which is more desirable for typical usage.
    //inventoryResponse.LastInventorySync = toOid(new Types.ObjectId());

    // Set 2FA enabled so trading post can be used
    inventoryResponse.HWIDProtectEnabled = true;

    return inventoryResponse;
};

export const addString = (arr: string[], str: string): void => {
    if (!arr.find(x => x == str)) {
        arr.push(str);
    }
};

const getExpRequiredForMr = (rank: number): number => {
    if (rank <= 30) {
        return 2500 * rank * rank;
    }
    return 2_250_000 + 147_500 * (rank - 30);
};

const resourceInheritsFrom = (resourceName: string, targetName: string): boolean => {
    let parentName = resourceGetParent(resourceName);
    for (; parentName != undefined; parentName = resourceGetParent(parentName)) {
        if (parentName == targetName) {
            return true;
        }
    }
    return false;
};

const resourceGetParent = (resourceName: string): string | undefined => {
    if (resourceName in ExportResources) {
        return ExportResources[resourceName].parentName;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return ExportVirtuals[resourceName]?.parentName;
};

// This is FNV1a-32 except operating under modulus 2^31 because JavaScript is stinky and likes producing negative integers out of nowhere.
export const catBreadHash = (name: string): number => {
    let hash = 2166136261;
    for (let i = 0; i != name.length; ++i) {
        hash = (hash ^ name.charCodeAt(i)) & 0x7fffffff;
        hash = (hash * 16777619) & 0x7fffffff;
    }
    return hash;
};
