import { RequestHandler } from "express";
import { getAccountForRequest } from "@/src/services/loginService";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { config } from "@/src/services/configService";
import allDialogue from "@/static/fixed_responses/allDialogue.json";
import { ILoadoutDatabase } from "@/src/types/saveLoadoutTypes";
import { IInventoryResponse, IShipInventory, equipmentKeys } from "@/src/types/inventoryTypes/inventoryTypes";
import { IPolarity, ArtifactPolarity } from "@/src/types/inventoryTypes/commonInventoryTypes";
import {
    ExportCustoms,
    ExportFlavour,
    ExportKeys,
    ExportRegions,
    ExportResources,
    ExportVirtuals
} from "warframe-public-export-plus";
import { handleSubsumeCompletion } from "./infestedFoundryController";

export const inventoryController: RequestHandler = async (request, response) => {
    const account = await getAccountForRequest(request);

    const inventory = await Inventory.findOne({ accountOwnerId: account._id.toString() });

    if (!inventory) {
        response.status(400).json({ error: "inventory was undefined" });
        return;
    }

    // Handle daily reset
    const today: number = Math.trunc(new Date().getTime() / 86400000);
    if (account.LastLoginDay != today) {
        account.LastLoginDay = today;
        await account.save();

        inventory.DailyAffiliation = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationPvp = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationLibrary = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationCetus = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationQuills = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationSolaris = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationVentkids = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationVox = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationEntrati = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationNecraloid = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationZariman = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationKahl = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationCavia = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyAffiliationHex = 16000 + inventory.PlayerLevel * 500;
        inventory.DailyFocus = 250000 + inventory.PlayerLevel * 5000;
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

    const inventoryWithLoadOutPresets = await inventory.populate<{ LoadOutPresets: ILoadoutDatabase }>(
        "LoadOutPresets"
    );
    const inventoryWithLoadOutPresetsAndShips = await inventoryWithLoadOutPresets.populate<{ Ships: IShipInventory }>(
        "Ships"
    );
    const inventoryResponse = inventoryWithLoadOutPresetsAndShips.toJSON<IInventoryResponse>();

    if (config.infiniteCredits) {
        inventoryResponse.RegularCredits = 999999999;
    }
    if (config.infinitePlatinum) {
        inventoryResponse.PremiumCreditsFree = 999999999;
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

    if (config.unlockAllQuests) {
        for (const [k, v] of Object.entries(ExportKeys)) {
            if ("chainStages" in v) {
                if (!inventoryResponse.QuestKeys.find(quest => quest.ItemType == k)) {
                    inventoryResponse.QuestKeys.push({ ItemType: k });
                }
            }
        }
    }
    if (config.completeAllQuests) {
        for (const quest of inventoryResponse.QuestKeys) {
            quest.unlock = true;
            quest.Completed = true;

            let numStages = 1;
            if (quest.ItemType in ExportKeys && "chainStages" in ExportKeys[quest.ItemType]) {
                numStages = ExportKeys[quest.ItemType].chainStages!.length;
            }
            quest.Progress = [];
            for (let i = 0; i != numStages; ++i) {
                quest.Progress.push({
                    c: 0,
                    i: false,
                    m: false,
                    b: []
                });
            }
        }

        inventoryResponse.ArchwingEnabled = true;

        // Skip "Watch The Maker"
        addString(inventoryResponse.NodeIntrosCompleted, "/Lotus/Levels/Cinematics/NewWarIntro/NewWarStageTwo.level");
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
        inventoryResponse.WeaponSkins = [];
        let i = 0;
        for (const uniqueName in ExportCustoms) {
            i++;
            inventoryResponse.WeaponSkins.push({
                ItemId: {
                    $oid: i.toString().padStart(24, "0")
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
        if (!("xpBasedLevelCapDisabled" in request.query)) {
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
        for (let i = 0; i != 10; ++i) {
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

    // Fix for #380
    inventoryResponse.NextRefill = { $date: { $numberLong: "9999999999999" } };

    // This determines if the "void fissures" tab is shown in navigation.
    inventoryResponse.HasOwnedVoidProjectionsPreviously = true;

    response.json(inventoryResponse);
};

const addString = (arr: string[], str: string): void => {
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
    return ExportVirtuals[resourceName]?.parentName;
};
