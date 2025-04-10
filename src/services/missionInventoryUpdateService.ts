import {
    ExportEnemies,
    ExportFusionBundles,
    ExportRegions,
    ExportRewards,
    IMissionReward as IMissionRewardExternal,
    IRegion,
    IReward
} from "warframe-public-export-plus";
import { IMissionInventoryUpdateRequest, IRewardInfo } from "../types/requestTypes";
import { logger } from "@/src/utils/logger";
import { IRngResult, getRandomElement, getRandomReward } from "@/src/services/rngService";
import { equipmentKeys, TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import {
    addBooster,
    addChallenges,
    addConsumables,
    addCrewShipAmmo,
    addCrewShipRawSalvage,
    addEmailItem,
    addFocusXpIncreases,
    addFusionTreasures,
    addGearExpByCategory,
    addItem,
    addLevelKeys,
    addMiscItems,
    addMissionComplete,
    addMods,
    addRecipes,
    addShipDecorations,
    combineInventoryChanges,
    updateCurrency,
    updateSyndicate
} from "@/src/services/inventoryService";
import { updateQuestKey } from "@/src/services/questService";
import { Types } from "mongoose";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { getLevelKeyRewards, toStoreItem } from "@/src/services/itemDataService";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { getEntriesUnsafe } from "@/src/utils/ts-utils";
import { IEquipmentClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { handleStoreItemAcquisition } from "./purchaseService";
import { IMissionReward } from "../types/missionTypes";
import { crackRelic } from "@/src/helpers/relicHelper";
import { createMessage } from "./inboxService";
import kuriaMessage50 from "@/static/fixed_responses/kuriaMessages/fiftyPercent.json";
import kuriaMessage75 from "@/static/fixed_responses/kuriaMessages/seventyFivePercent.json";
import kuriaMessage100 from "@/static/fixed_responses/kuriaMessages/oneHundredPercent.json";
import conservationAnimals from "@/static/fixed_responses/conservationAnimals.json";
import { getInfNodes } from "@/src/helpers/nemesisHelpers";
import { Loadout } from "../models/inventoryModels/loadoutModel";
import { ILoadoutConfigDatabase } from "../types/saveLoadoutTypes";
import { getWorldState } from "./worldStateService";

const getRotations = (rotationCount: number, tierOverride: number | undefined): number[] => {
    if (rotationCount === 0) return [0];

    const rotationPattern =
        tierOverride === undefined
            ? [0, 0, 1, 2] // A, A, B, C
            : [tierOverride];
    const rotatedValues = [];

    for (let i = 0; i < rotationCount; i++) {
        rotatedValues.push(rotationPattern[i % rotationPattern.length]);
    }

    return rotatedValues;
};

const getRandomRewardByChance = (pool: IReward[]): IRngResult | undefined => {
    return getRandomReward(pool as IRngResult[]);
};

//type TMissionInventoryUpdateKeys = keyof IMissionInventoryUpdateRequest;
//const ignoredInventoryUpdateKeys = ["FpsAvg", "FpsMax", "FpsMin", "FpsSamples"] satisfies TMissionInventoryUpdateKeys[]; // for keys with no meaning for this server
//type TignoredInventoryUpdateKeys = (typeof ignoredInventoryUpdateKeys)[number];
//const knownUnhandledKeys: readonly string[] = ["test"] as const; // for unimplemented but important keys

export const addMissionInventoryUpdates = async (
    inventory: TInventoryDatabaseDocument,
    inventoryUpdates: IMissionInventoryUpdateRequest
): Promise<IInventoryChanges> => {
    const inventoryChanges: IInventoryChanges = {};
    if (inventoryUpdates.EndOfMatchUpload) {
        if (inventoryUpdates.Missions && inventoryUpdates.Missions.Tag in ExportRegions) {
            const node = ExportRegions[inventoryUpdates.Missions.Tag];
            if (node.miscItemFee) {
                addMiscItems(inventory, [
                    {
                        ItemType: node.miscItemFee.ItemType,
                        ItemCount: node.miscItemFee.ItemCount * -1
                    }
                ]);
            }
        }
        if (inventoryUpdates.KeyToRemove) {
            if (!inventoryUpdates.KeyOwner || inventory.accountOwnerId.equals(inventoryUpdates.KeyOwner)) {
                addLevelKeys(inventory, [
                    {
                        ItemType: inventoryUpdates.KeyToRemove,
                        ItemCount: -1
                    }
                ]);
            }
        }
        if (
            inventoryUpdates.MissionFailed &&
            inventoryUpdates.MissionStatus == "GS_FAILURE" &&
            inventoryUpdates.ObjectiveReached &&
            !inventoryUpdates.LockedWeaponGroup
        ) {
            const loadout = (await Loadout.findById(inventory.LoadOutPresets, "NORMAL"))!;
            const config = loadout.NORMAL.id(inventory.CurrentLoadOutIds[0].$oid)!;
            const SuitId = new Types.ObjectId(config.s!.ItemId.$oid);

            inventory.BrandedSuits ??= [];
            if (!inventory.BrandedSuits.find(x => x.equals(SuitId))) {
                inventory.BrandedSuits.push(SuitId);

                await createMessage(inventory.accountOwnerId, [
                    {
                        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
                        msg: "/Lotus/Language/G1Quests/BrandedMessage",
                        sub: "/Lotus/Language/G1Quests/BrandedTitle",
                        att: ["/Lotus/Types/Recipes/Components/BrandRemovalBlueprint"],
                        highPriority: true // TOVERIFY: I cannot find any content of this within the last 10 years so I can only assume that highPriority is set (it certainly would make sense), but I just don't know for sure that it is so on live.
                    }
                ]);
            }
        }
    }
    if (inventoryUpdates.RewardInfo) {
        if (inventoryUpdates.RewardInfo.periodicMissionTag) {
            const tag = inventoryUpdates.RewardInfo.periodicMissionTag;
            const existingCompletion = inventory.PeriodicMissionCompletions.find(completion => completion.tag === tag);

            if (existingCompletion) {
                existingCompletion.date = new Date();
            } else {
                inventory.PeriodicMissionCompletions.push({
                    tag: tag,
                    date: new Date()
                });
            }
        }
        if (inventoryUpdates.RewardInfo.NemesisAbandonedRewards) {
            inventory.NemesisAbandonedRewards = inventoryUpdates.RewardInfo.NemesisAbandonedRewards;
        }
        if (inventoryUpdates.MissionStatus == "GS_SUCCESS" && inventoryUpdates.RewardInfo.jobId) {
            // e.g. for Profit-Taker Phase 1:
            // JobTier: -6,
            // jobId: '/Lotus/Types/Gameplay/Venus/Jobs/Heists/HeistProfitTakerBountyOne_-6_SolarisUnitedHub1_663a71c80000000000000025_EudicoHeists',
            // This is sent multiple times, with JobStage starting at 0 and incrementing each time, but only the final upload has GS_SUCCESS.

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [bounty, tier, hub, id, tag] = inventoryUpdates.RewardInfo.jobId.split("_");
            if (tag == "EudicoHeists") {
                inventory.CompletedJobChains ??= [];
                let chain = inventory.CompletedJobChains.find(x => x.LocationTag == tag);
                if (!chain) {
                    chain =
                        inventory.CompletedJobChains[
                            inventory.CompletedJobChains.push({ LocationTag: tag, Jobs: [] }) - 1
                        ];
                }
                if (!chain.Jobs.includes(bounty)) {
                    chain.Jobs.push(bounty);
                }
            }
        }
    }
    for (const [key, value] of getEntriesUnsafe(inventoryUpdates)) {
        if (value === undefined) {
            logger.error(`Inventory update key ${key} has no value `);
            continue;
        }
        switch (key) {
            case "RegularCredits":
                inventory.RegularCredits += value;
                break;
            case "QuestKeys":
                await updateQuestKey(inventory, value);
                break;
            case "AffiliationChanges":
                updateSyndicate(inventory, value);
                break;
            // Incarnon Challenges
            case "EvolutionProgress": {
                for (const evoProgress of value) {
                    const entry = inventory.EvolutionProgress
                        ? inventory.EvolutionProgress.find(entry => entry.ItemType == evoProgress.ItemType)
                        : undefined;
                    if (entry) {
                        entry.Progress = evoProgress.Progress;
                        entry.Rank = evoProgress.Rank;
                    } else {
                        inventory.EvolutionProgress ??= [];
                        inventory.EvolutionProgress.push(evoProgress);
                    }
                }
                break;
            }
            case "Missions":
                addMissionComplete(inventory, value);
                break;
            case "LastRegionPlayed":
                inventory.LastRegionPlayed = value;
                break;
            case "RawUpgrades":
                addMods(inventory, value);
                break;
            case "MiscItems":
            case "BonusMiscItems":
                addMiscItems(inventory, value);
                break;
            case "Consumables":
                addConsumables(inventory, value);
                break;
            case "Recipes":
                addRecipes(inventory, value);
                break;
            case "ChallengeProgress":
                addChallenges(inventory, value, inventoryUpdates.SeasonChallengeCompletions);
                break;
            case "FusionTreasures":
                addFusionTreasures(inventory, value);
                break;
            case "CrewShipRawSalvage":
                addCrewShipRawSalvage(inventory, value);
                break;
            case "CrewShipAmmo":
                addCrewShipAmmo(inventory, value);
                break;
            case "ShipDecorations":
                // e.g. when getting a 50+ score in happy zephyr, this is how the poster is given.
                addShipDecorations(inventory, value);
                break;
            case "FusionBundles": {
                let fusionPoints = 0;
                for (const fusionBundle of value) {
                    const fusionPointsTotal =
                        ExportFusionBundles[fusionBundle.ItemType].fusionPoints * fusionBundle.ItemCount;
                    inventory.FusionPoints += fusionPointsTotal;
                    fusionPoints += fusionPointsTotal;
                }
                inventoryChanges.FusionPoints = fusionPoints;
                break;
            }
            case "EmailItems": {
                for (const tc of value) {
                    await addEmailItem(inventory, tc.ItemType);
                }
                break;
            }
            case "FocusXpIncreases": {
                addFocusXpIncreases(inventory, value);
                break;
            }
            case "PlayerSkillGains": {
                inventory.PlayerSkills.LPP_SPACE += value.LPP_SPACE;
                inventory.PlayerSkills.LPP_DRIFTER += value.LPP_DRIFTER;
                break;
            }
            case "CustomMarkers": {
                value.forEach(markers => {
                    const map = inventory.CustomMarkers
                        ? inventory.CustomMarkers.find(entry => entry.tag == markers.tag)
                        : undefined;
                    if (map) {
                        map.markerInfos = markers.markerInfos;
                    } else {
                        inventory.CustomMarkers ??= [];
                        inventory.CustomMarkers.push(markers);
                    }
                });
                break;
            }
            case "LoreFragmentScans":
                value.forEach(clientFragment => {
                    const fragment = inventory.LoreFragmentScans.find(x => x.ItemType == clientFragment.ItemType);
                    if (fragment) {
                        fragment.Progress += clientFragment.Progress;
                    } else {
                        inventory.LoreFragmentScans.push(clientFragment);
                    }
                });
                break;
            case "LibraryScans":
                value.forEach(scan => {
                    let synthesisIgnored = true;
                    if (
                        inventory.LibraryPersonalTarget &&
                        libraryPersonalTargetToAvatar[inventory.LibraryPersonalTarget] == scan.EnemyType
                    ) {
                        let progress = inventory.LibraryPersonalProgress.find(
                            x => x.TargetType == inventory.LibraryPersonalTarget
                        );
                        if (!progress) {
                            progress =
                                inventory.LibraryPersonalProgress[
                                    inventory.LibraryPersonalProgress.push({
                                        TargetType: inventory.LibraryPersonalTarget,
                                        Scans: 0,
                                        Completed: false
                                    }) - 1
                                ];
                        }
                        progress.Scans += scan.Count;
                        if (
                            progress.Scans >=
                            (inventory.LibraryPersonalTarget ==
                            "/Lotus/Types/Game/Library/Targets/DragonframeQuestTarget"
                                ? 3
                                : 10)
                        ) {
                            progress.Completed = true;
                        }
                        logger.debug(`synthesis of ${scan.EnemyType} added to personal target progress`);
                        synthesisIgnored = false;
                    }
                    if (
                        inventory.LibraryActiveDailyTaskInfo &&
                        inventory.LibraryActiveDailyTaskInfo.EnemyTypes.find(x => x == scan.EnemyType)
                    ) {
                        inventory.LibraryActiveDailyTaskInfo.Scans ??= 0;
                        inventory.LibraryActiveDailyTaskInfo.Scans += scan.Count;
                        logger.debug(`synthesis of ${scan.EnemyType} added to daily task progress`);
                        synthesisIgnored = false;
                    }
                    if (synthesisIgnored) {
                        logger.warn(`ignoring synthesis of ${scan.EnemyType} due to not knowing why you did that`);
                    }
                });
                break;
            case "CollectibleScans":
                for (const scan of value) {
                    const entry = inventory.CollectibleSeries?.find(x => x.CollectibleType == scan.CollectibleType);
                    if (entry) {
                        entry.Count = scan.Count;
                        entry.Tracking = scan.Tracking;
                        if (entry.CollectibleType == "/Lotus/Objects/Orokin/Props/CollectibleSeriesOne") {
                            const progress = entry.Count / entry.ReqScans;
                            for (const gate of entry.IncentiveStates) {
                                gate.complete = progress >= gate.threshold;
                                if (gate.complete && !gate.sent) {
                                    gate.sent = true;
                                    if (gate.threshold == 0.5) {
                                        await createMessage(inventory.accountOwnerId, [kuriaMessage50]);
                                    } else {
                                        await createMessage(inventory.accountOwnerId, [kuriaMessage75]);
                                    }
                                }
                            }
                            if (progress >= 1.0) {
                                await createMessage(inventory.accountOwnerId, [kuriaMessage100]);
                            }
                        }
                    } else {
                        logger.warn(`${scan.CollectibleType} was not found in inventory, ignoring scans`);
                    }
                }
                break;
            case "Upgrades":
                value.forEach(clientUpgrade => {
                    const upgrade = inventory.Upgrades.id(clientUpgrade.ItemId.$oid)!;
                    upgrade.UpgradeFingerprint = clientUpgrade.UpgradeFingerprint; // primitive way to copy over the riven challenge progress
                });
                break;
            case "Boosters":
                value.forEach(booster => {
                    addBooster(booster.ItemType, booster.ExpiryDate, inventory);
                });
                break;
            case "SyndicateId": {
                inventory.CompletedSyndicates.push(value);
                break;
            }
            case "SortieId": {
                inventory.CompletedSorties.push(value);
                break;
            }
            case "SeasonChallengeCompletions": {
                const processedCompletions = value.map(({ challenge, id }) => ({
                    challenge: challenge.substring(challenge.lastIndexOf("/") + 1),
                    id
                }));
                inventory.SeasonChallengeHistory.push(...processedCompletions);
                break;
            }
            case "DeathMarks": {
                for (const bossName of value) {
                    if (inventory.DeathMarks.indexOf(bossName) == -1) {
                        // It's a new death mark; we have to say the line.
                        await createMessage(inventory.accountOwnerId, [
                            {
                                sub: bossName,
                                sndr: "/Lotus/Language/G1Quests/DeathMarkSender",
                                msg: "/Lotus/Language/G1Quests/DeathMarkMessage",
                                icon: "/Lotus/Interface/Icons/Npcs/Stalker_d.png",
                                highPriority: true,
                                expiry: new Date(Date.now() + 86400_000) // TOVERIFY: This type of inbox message seems to automatically delete itself. We'll just delete it after 24 hours, but it's clear if this is correct.
                            }
                        ]);
                    }
                }
                inventory.DeathMarks = value;
                break;
            }
            case "CapturedAnimals": {
                for (const capturedAnimal of value) {
                    const meta = conservationAnimals[capturedAnimal.AnimalType as keyof typeof conservationAnimals];
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (meta) {
                        if (capturedAnimal.NumTags) {
                            addMiscItems(inventory, [
                                {
                                    ItemType: meta.tag,
                                    ItemCount: capturedAnimal.NumTags
                                }
                            ]);
                        }
                        if (capturedAnimal.NumExtraRewards) {
                            if ("extraReward" in meta) {
                                addMiscItems(inventory, [
                                    {
                                        ItemType: meta.extraReward,
                                        ItemCount: capturedAnimal.NumExtraRewards
                                    }
                                ]);
                            } else {
                                logger.warn(
                                    `client attempted to claim unknown extra rewards for conservation of ${capturedAnimal.AnimalType}`
                                );
                            }
                        }
                    } else {
                        logger.warn(`ignoring conservation of unknown AnimalType: ${capturedAnimal.AnimalType}`);
                    }
                }
                break;
            }
            case "DiscoveredMarkers": {
                for (const clientMarker of value) {
                    const dbMarker = inventory.DiscoveredMarkers.find(x => x.tag == clientMarker.tag);
                    if (dbMarker) {
                        dbMarker.discoveryState = clientMarker.discoveryState;
                    } else {
                        inventory.DiscoveredMarkers.push(clientMarker);
                    }
                }
                break;
            }
            case "LockedWeaponGroup": {
                inventory.LockedWeaponGroup = {
                    s: new Types.ObjectId(value.s.$oid),
                    l: value.l ? new Types.ObjectId(value.l.$oid) : undefined,
                    p: value.p ? new Types.ObjectId(value.p.$oid) : undefined,
                    m: value.m ? new Types.ObjectId(value.m.$oid) : undefined,
                    sn: value.sn ? new Types.ObjectId(value.sn.$oid) : undefined
                };
                break;
            }
            case "UnlockWeapons": {
                inventory.LockedWeaponGroup = undefined;
                break;
            }
            case "CurrentLoadOutIds": {
                if (value.LoadOuts) {
                    const loadout = await Loadout.findOne({ loadoutOwnerId: inventory.accountOwnerId });
                    if (loadout) {
                        for (const [loadoutId, loadoutConfig] of Object.entries(value.LoadOuts.NORMAL)) {
                            const { ItemId, ...loadoutConfigItemIdRemoved } = loadoutConfig;
                            const loadoutConfigDatabase: ILoadoutConfigDatabase = {
                                _id: new Types.ObjectId(ItemId.$oid),
                                ...loadoutConfigItemIdRemoved
                            };
                            const dbConfig = loadout.NORMAL.id(loadoutId);
                            if (dbConfig) {
                                dbConfig.overwrite(loadoutConfigDatabase);
                            } else {
                                logger.warn(`couldn't update loadout because there's no config with id ${loadoutId}`);
                            }
                        }
                        await loadout.save();
                    }
                }
                break;
            }
            case "creditsFee": {
                updateCurrency(inventory, value, false);
                inventoryChanges.RegularCredits ??= 0;
                inventoryChanges.RegularCredits -= value;
                break;
            }
            default:
                // Equipment XP updates
                if (equipmentKeys.includes(key as TEquipmentKey)) {
                    addGearExpByCategory(inventory, value as IEquipmentClient[], key as TEquipmentKey);
                }
                break;
            // if (
            //     (ignoredInventoryUpdateKeys as readonly string[]).includes(key) ||
            //     knownUnhandledKeys.includes(key)
            // ) {
            //     continue;
            // }
            // logger.error(`Unhandled inventory update key: ${key}`);
        }
    }

    return inventoryChanges;
};

interface AddMissionRewardsReturnType {
    MissionRewards: IMissionReward[];
    inventoryChanges?: IInventoryChanges;
    credits?: IMissionCredits;
}

//TODO: return type of partial missioninventoryupdate response
export const addMissionRewards = async (
    inventory: TInventoryDatabaseDocument,
    {
        wagerTier: wagerTier,
        Nemesis: nemesis,
        RewardInfo: rewardInfo,
        LevelKeyName: levelKeyName,
        Missions: missions,
        RegularCredits: creditDrops,
        VoidTearParticipantsCurrWave: voidTearWave,
        StrippedItems: strippedItems
    }: IMissionInventoryUpdateRequest
): Promise<AddMissionRewardsReturnType> => {
    if (!rewardInfo) {
        //TODO: if there is a case where you can have credits collected during a mission but no rewardInfo, add credits needs to be handled earlier
        logger.debug(`Mission ${missions!.Tag} did not have Reward Info `);
        return { MissionRewards: [] };
    }

    //TODO: check double reward merging
    const MissionRewards: IMissionReward[] = getRandomMissionDrops(rewardInfo, wagerTier);
    logger.debug("random mission drops:", MissionRewards);
    const inventoryChanges: IInventoryChanges = {};

    let missionCompletionCredits = 0;
    //inventory change is what the client has not rewarded itself, also the client needs to know the credit changes for display
    if (levelKeyName) {
        const fixedLevelRewards = getLevelKeyRewards(levelKeyName);
        //logger.debug(`fixedLevelRewards ${fixedLevelRewards}`);
        if (fixedLevelRewards.levelKeyRewards) {
            addFixedLevelRewards(fixedLevelRewards.levelKeyRewards, inventory, MissionRewards);
        }
        if (fixedLevelRewards.levelKeyRewards2) {
            for (const reward of fixedLevelRewards.levelKeyRewards2) {
                //quest stage completion credit rewards
                if (reward.rewardType == "RT_CREDITS") {
                    inventory.RegularCredits += reward.amount;
                    missionCompletionCredits += reward.amount;
                    continue;
                }
                MissionRewards.push({
                    StoreItem: reward.itemType,
                    ItemCount: reward.rewardType === "RT_RESOURCE" ? reward.amount : 1
                });
            }
        }
    }

    // ignoring tags not in ExportRegions, because it can just be garbage:
    // - https://onlyg.it/OpenWF/SpaceNinjaServer/issues/1013
    // - https://onlyg.it/OpenWF/SpaceNinjaServer/issues/1365
    if (missions && missions.Tag in ExportRegions) {
        const node = ExportRegions[missions.Tag];

        //node based credit rewards for mission completion
        if (node.missionIndex !== 28) {
            const levelCreditReward = getLevelCreditRewards(node);
            missionCompletionCredits += levelCreditReward;
            inventory.RegularCredits += levelCreditReward;
            logger.debug(`levelCreditReward ${levelCreditReward}`);
        }

        if (node.missionReward) {
            missionCompletionCredits += addFixedLevelRewards(node.missionReward, inventory, MissionRewards);
        }
    }

    if (rewardInfo.useVaultManifest) {
        MissionRewards.push({
            StoreItem: getRandomElement(corruptedMods),
            ItemCount: 1
        });
    }

    for (const reward of MissionRewards) {
        const inventoryChange = await handleStoreItemAcquisition(
            reward.StoreItem,
            inventory,
            reward.ItemCount,
            undefined,
            true
        );
        //TODO: combineInventoryChanges improve type safety, merging 2 of the same item?
        //TODO: check for the case when two of the same item are added, combineInventoryChanges should merge them, but the client also merges them
        //TODO: some conditional types to rule out binchanges?
        combineInventoryChanges(inventoryChanges, inventoryChange.InventoryChanges);
    }

    const credits = addCredits(inventory, {
        missionCompletionCredits,
        missionDropCredits: creditDrops ?? 0,
        rngRewardCredits: inventoryChanges.RegularCredits ?? 0
    });

    if (
        voidTearWave &&
        voidTearWave.Participants[0].QualifiesForReward &&
        !voidTearWave.Participants[0].HaveRewardResponse
    ) {
        const reward = await crackRelic(inventory, voidTearWave.Participants[0], inventoryChanges);
        MissionRewards.push({ StoreItem: reward.type, ItemCount: reward.itemCount });
    }

    if (strippedItems) {
        for (const si of strippedItems) {
            const droptables = ExportEnemies.droptables[si.DropTable] ?? [];
            if (si.DROP_MOD) {
                const modDroptable = droptables.find(x => x.type == "mod");
                if (modDroptable) {
                    for (let i = 0; i != si.DROP_MOD.length; ++i) {
                        const reward = getRandomReward(modDroptable.items)!;
                        logger.debug(`stripped droptable (mods pool) rolled`, reward);
                        await addItem(inventory, reward.type);
                        MissionRewards.push({
                            StoreItem: toStoreItem(reward.type),
                            ItemCount: 1,
                            FromEnemyCache: true // to show "identified"
                        });
                    }
                } else {
                    logger.error(`unknown droptable ${si.DropTable} for DROP_MOD`);
                }
            }
            if (si.DROP_BLUEPRINT) {
                const blueprintDroptable = droptables.find(x => x.type == "blueprint");
                if (blueprintDroptable) {
                    for (let i = 0; i != si.DROP_BLUEPRINT.length; ++i) {
                        const reward = getRandomReward(blueprintDroptable.items)!;
                        logger.debug(`stripped droptable (blueprints pool) rolled`, reward);
                        await addItem(inventory, reward.type);
                        MissionRewards.push({
                            StoreItem: toStoreItem(reward.type),
                            ItemCount: 1,
                            FromEnemyCache: true // to show "identified"
                        });
                    }
                } else {
                    logger.error(`unknown droptable ${si.DropTable} for DROP_BLUEPRINT`);
                }
            }
        }
    }

    if (inventory.Nemesis) {
        if (
            nemesis ||
            (inventory.Nemesis.Faction == "FC_INFESTATION" &&
                inventory.Nemesis.InfNodes.find(obj => obj.Node == rewardInfo.node))
        ) {
            inventoryChanges.Nemesis ??= {};
            const nodeIndex = inventory.Nemesis.InfNodes.findIndex(obj => obj.Node === rewardInfo.node);
            if (nodeIndex !== -1) inventory.Nemesis.InfNodes.splice(nodeIndex, 1);

            if (inventory.Nemesis.InfNodes.length <= 0) {
                if (inventory.Nemesis.Faction != "FC_INFESTATION") {
                    inventory.Nemesis.Rank = Math.min(inventory.Nemesis.Rank + 1, 4);
                    inventoryChanges.Nemesis.Rank = inventory.Nemesis.Rank;
                }
                inventory.Nemesis.InfNodes = getInfNodes(inventory.Nemesis.Faction, inventory.Nemesis.Rank);
            }

            if (inventory.Nemesis.Faction == "FC_INFESTATION") {
                inventoryChanges.Nemesis.HenchmenKilled ??= 0;
                inventoryChanges.Nemesis.MissionCount ??= 0;

                inventory.Nemesis.HenchmenKilled += 5;
                inventory.Nemesis.MissionCount += 1;

                inventoryChanges.Nemesis.HenchmenKilled += 5;
                inventoryChanges.Nemesis.MissionCount += 1;

                if (inventory.Nemesis.HenchmenKilled >= 100) {
                    inventory.Nemesis.InfNodes = [
                        {
                            Node: "CrewBattleNode559",
                            Influence: 1
                        }
                    ];
                    inventory.Nemesis.Weakened = true;
                    inventoryChanges.Nemesis.Weakened = true;
                }
            }

            inventoryChanges.Nemesis.InfNodes = inventory.Nemesis.InfNodes;
        }
    }
    return { inventoryChanges, MissionRewards, credits };
};

interface IMissionCredits {
    MissionCredits: number[];
    CreditBonus: number[];
    TotalCredits: number[];
    DailyMissionBonus?: boolean;
}

//creditBonus is not entirely accurate.
//TODO: consider ActiveBoosters
export const addCredits = (
    inventory: TInventoryDatabaseDocument,
    {
        missionDropCredits,
        missionCompletionCredits,
        rngRewardCredits
    }: { missionDropCredits: number; missionCompletionCredits: number; rngRewardCredits: number }
): IMissionCredits => {
    const hasDailyCreditBonus = true;
    const totalCredits = missionDropCredits + missionCompletionCredits + rngRewardCredits;

    const finalCredits: IMissionCredits = {
        MissionCredits: [missionDropCredits, missionDropCredits],
        CreditBonus: [missionCompletionCredits, missionCompletionCredits],
        TotalCredits: [totalCredits, totalCredits]
    };

    if (hasDailyCreditBonus) {
        inventory.RegularCredits += missionCompletionCredits;
        finalCredits.CreditBonus[1] *= 2;
        finalCredits.MissionCredits[1] *= 2;
        finalCredits.TotalCredits[1] *= 2;
    }

    if (!hasDailyCreditBonus) {
        return finalCredits;
    }
    return { ...finalCredits, DailyMissionBonus: true };
};

export const addFixedLevelRewards = (
    rewards: IMissionRewardExternal,
    inventory: TInventoryDatabaseDocument,
    MissionRewards: IMissionReward[]
): number => {
    let missionBonusCredits = 0;
    if (rewards.credits) {
        missionBonusCredits += rewards.credits;
        inventory.RegularCredits += rewards.credits;
    }
    if (rewards.items) {
        for (const item of rewards.items) {
            MissionRewards.push({
                StoreItem: item,
                ItemCount: 1
            });
        }
    }
    if (rewards.countedItems) {
        for (const item of rewards.countedItems) {
            MissionRewards.push({
                StoreItem: `/Lotus/StoreItems${item.ItemType.substring("Lotus/".length)}`,
                ItemCount: item.ItemCount
            });
        }
    }
    if (rewards.countedStoreItems) {
        for (const item of rewards.countedStoreItems) {
            MissionRewards.push(item);
        }
    }
    if (rewards.droptable) {
        if (rewards.droptable in ExportRewards) {
            logger.debug(`rolling ${rewards.droptable} for level key rewards`);
            const reward = getRandomRewardByChance(ExportRewards[rewards.droptable][0]);
            if (reward) {
                MissionRewards.push({
                    StoreItem: reward.type,
                    ItemCount: reward.itemCount
                });
            }
        } else {
            logger.error(`unknown droptable ${rewards.droptable}`);
        }
    }
    return missionBonusCredits;
};

function getLevelCreditRewards(node: IRegion): number {
    const minEnemyLevel = node.minEnemyLevel;

    return 1000 + (minEnemyLevel - 1) * 100;

    //TODO: get dark sektor fixed credit rewards and railjack bonus
}

function getRandomMissionDrops(RewardInfo: IRewardInfo, tierOverride: number | undefined): IMissionReward[] {
    const drops: IMissionReward[] = [];
    if (RewardInfo.node in ExportRegions) {
        const region = ExportRegions[RewardInfo.node];
        let rewardManifests: string[] =
            RewardInfo.periodicMissionTag == "EliteAlert" || RewardInfo.periodicMissionTag == "EliteAlertB"
                ? ["/Lotus/Types/Game/MissionDecks/EliteAlertMissionRewards/EliteAlertMissionRewards"]
                : region.rewardManifests;

        let rotations: number[] = [];
        if (RewardInfo.jobId) {
            if (RewardInfo.JobTier! >= 0) {
                const id = RewardInfo.jobId.split("_")[3];
                const syndicateInfo = getWorldState().SyndicateMissions.find(x => x._id.$oid == id);
                if (syndicateInfo) {
                    const jobInfo = syndicateInfo.Jobs![RewardInfo.JobTier!];
                    rewardManifests = [jobInfo.rewards];
                    rotations = [RewardInfo.JobStage!];
                }
            }
        } else if (RewardInfo.VaultsCracked) {
            // For Spy missions, e.g. 3 vaults cracked = A, B, C
            for (let i = 0; i != RewardInfo.VaultsCracked; ++i) {
                rotations.push(i);
            }
        } else {
            const rotationCount = RewardInfo.rewardQualifications?.length || 0;
            rotations = getRotations(rotationCount, tierOverride);
        }
        if (rewardManifests.length != 0) {
            logger.debug(`generating random mission rewards`, { rewardManifests, rotations });
        }
        rewardManifests
            .map(name => ExportRewards[name])
            .forEach(table => {
                for (const rotation of rotations) {
                    const rotationRewards = table[rotation];
                    const drop = getRandomRewardByChance(rotationRewards);
                    if (drop) {
                        drops.push({ StoreItem: drop.type, ItemCount: drop.itemCount });
                    }
                }
            });

        if (region.cacheRewardManifest && RewardInfo.EnemyCachesFound) {
            const deck = ExportRewards[region.cacheRewardManifest];
            for (let rotation = 0; rotation != RewardInfo.EnemyCachesFound; ++rotation) {
                const drop = getRandomRewardByChance(deck[rotation]);
                if (drop) {
                    drops.push({ StoreItem: drop.type, ItemCount: drop.itemCount, FromEnemyCache: true });
                }
            }
        }

        if (RewardInfo.nightmareMode) {
            const deck = ExportRewards["/Lotus/Types/Game/MissionDecks/NightmareModeRewards"];
            let rotation = 0;

            if (region.missionIndex === 3 && RewardInfo.rewardTier) {
                rotation = RewardInfo.rewardTier;
            } else if ([6, 7, 8, 10, 11].includes(region.systemIndex)) {
                rotation = 2;
            } else if ([4, 9, 12, 14, 15, 16, 17, 18].includes(region.systemIndex)) {
                rotation = 1;
            }

            const drop = getRandomRewardByChance(deck[rotation]);
            if (drop) {
                drops.push({ StoreItem: drop.type, ItemCount: drop.itemCount });
            }
        }
    }
    return drops;
}

const corruptedMods = [
    "/Lotus/StoreItems/Upgrades/Mods/Melee/DualStat/CorruptedHeavyDamageChargeSpeedMod", // Corrupt Charge
    "/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedCritDamagePistol", // Hollow Point
    "/Lotus/StoreItems/Upgrades/Mods/Melee/DualStat/CorruptedDamageSpeedMod", // Spoiled Strike
    "/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedDamageRecoilPistol", // Magnum Force
    "/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedMaxClipReloadSpeedPistol", // Tainted Clip
    "/Lotus/StoreItems/Upgrades/Mods/Rifle/DualStat/CorruptedCritRateFireRateRifle", // Critical Delay
    "/Lotus/StoreItems/Upgrades/Mods/Rifle/DualStat/CorruptedDamageRecoilRifle", // Heavy Caliber
    "/Lotus/StoreItems/Upgrades/Mods/Rifle/DualStat/CorruptedMaxClipReloadSpeedRifle", // Tainted Mag
    "/Lotus/StoreItems/Upgrades/Mods/Rifle/DualStat/CorruptedRecoilFireRateRifle", // Vile Precision
    "/Lotus/StoreItems/Upgrades/Mods/Warframe/DualStat/CorruptedDurationRangeWarframe", // Narrow Minded
    "/Lotus/StoreItems/Upgrades/Mods/Warframe/DualStat/CorruptedEfficiencyDurationWarframe", // Fleeting Expertise
    "/Lotus/StoreItems/Upgrades/Mods/Warframe/DualStat/CorruptedPowerEfficiencyWarframe", // Blind Rage
    "/Lotus/StoreItems/Upgrades/Mods/Warframe/DualStat/CorruptedRangePowerWarframe", // Overextended
    "/Lotus/StoreItems/Upgrades/Mods/Shotgun/DualStat/CorruptedAccuracyFireRateShotgun", // Tainted Shell
    "/Lotus/StoreItems/Upgrades/Mods/Shotgun/DualStat/CorruptedDamageAccuracyShotgun", // Vicious Spread
    "/Lotus/StoreItems/Upgrades/Mods/Shotgun/DualStat/CorruptedMaxClipReloadSpeedShotgun", // Burdened Magazine
    "/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedFireRateDamagePistol", // Anemic Agility
    "/Lotus/StoreItems/Upgrades/Mods/Rifle/DualStat/CorruptedFireRateDamageRifle", // Vile Acceleration
    "/Lotus/StoreItems/Upgrades/Mods/Shotgun/DualStat/CorruptedFireRateDamageShotgun", // Frail Momentum
    "/Lotus/StoreItems/Upgrades/Mods/Shotgun/DualStat/CorruptedCritChanceFireRateShotgun", // Critical Deceleration
    "/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedCritChanceFireRatePistol", // Creeping Bullseye
    "/Lotus/StoreItems/Upgrades/Mods/Warframe/DualStat/CorruptedPowerStrengthPowerDurationWarframe", // Transient Fortitude
    "/Lotus/StoreItems/Upgrades/Mods/Rifle/DualStat/CorruptedReloadSpeedMaxClipRifle", // Depleted Reload
    "/Lotus/StoreItems/Upgrades/Mods/Warframe/DualStat/FixedShieldAndShieldGatingDuration" // Catalyzing Shields
];

const libraryPersonalTargetToAvatar: Record<string, string> = {
    "/Lotus/Types/Game/Library/Targets/DragonframeQuestTarget":
        "/Lotus/Types/Enemies/Grineer/Desert/Avatars/RifleLancerAvatar",
    "/Lotus/Types/Game/Library/Targets/Research1Target":
        "/Lotus/Types/Enemies/Grineer/Desert/Avatars/RifleLancerAvatar",
    "/Lotus/Types/Game/Library/Targets/Research2Target":
        "/Lotus/Types/Enemies/Corpus/BipedRobot/AIWeek/LaserDiscBipedAvatar",
    "/Lotus/Types/Game/Library/Targets/Research3Target":
        "/Lotus/Types/Enemies/Grineer/Desert/Avatars/EvisceratorLancerAvatar",
    "/Lotus/Types/Game/Library/Targets/Research4Target": "/Lotus/Types/Enemies/Orokin/OrokinHealingAncientAvatar",
    "/Lotus/Types/Game/Library/Targets/Research5Target":
        "/Lotus/Types/Enemies/Corpus/Spaceman/AIWeek/ShotgunSpacemanAvatar",
    "/Lotus/Types/Game/Library/Targets/Research6Target": "/Lotus/Types/Enemies/Infested/AiWeek/Runners/RunnerAvatar",
    "/Lotus/Types/Game/Library/Targets/Research7Target":
        "/Lotus/Types/Enemies/Grineer/AIWeek/Avatars/GrineerMeleeStaffAvatar",
    "/Lotus/Types/Game/Library/Targets/Research8Target": "/Lotus/Types/Enemies/Orokin/OrokinHeavyFemaleAvatar",
    "/Lotus/Types/Game/Library/Targets/Research9Target":
        "/Lotus/Types/Enemies/Infested/AiWeek/Quadrupeds/QuadrupedAvatar",
    "/Lotus/Types/Game/Library/Targets/Research10Target":
        "/Lotus/Types/Enemies/Corpus/Spaceman/AIWeek/NullifySpacemanAvatar"
};
