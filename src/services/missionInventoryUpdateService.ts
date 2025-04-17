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
import { IRngResult, SRng, getRandomElement, getRandomReward } from "@/src/services/rngService";
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
    addLoreFragmentScans,
    addMiscItems,
    addMissionComplete,
    addMods,
    addRecipes,
    addShipDecorations,
    addStanding,
    combineInventoryChanges,
    generateRewardSeed,
    updateCurrency,
    updateSyndicate
} from "@/src/services/inventoryService";
import { updateQuestKey } from "@/src/services/questService";
import { Types } from "mongoose";
import { IAffiliationMods, IInventoryChanges } from "@/src/types/purchaseTypes";
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
import { config } from "./configService";

const getRotations = (rewardInfo: IRewardInfo, tierOverride?: number): number[] => {
    // For Spy missions, e.g. 3 vaults cracked = A, B, C
    if (rewardInfo.VaultsCracked) {
        const rotations: number[] = [];
        for (let i = 0; i != rewardInfo.VaultsCracked; ++i) {
            rotations.push(i);
        }
        return rotations;
    }

    // For Rescue missions
    if (rewardInfo.node in ExportRegions && ExportRegions[rewardInfo.node].missionIndex == 3 && rewardInfo.rewardTier) {
        return [rewardInfo.rewardTier];
    }

    const rotationCount = rewardInfo.rewardQualifications?.length || 0;
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

const getRandomRewardByChance = (pool: IReward[], rng?: SRng): IRngResult | undefined => {
    if (rng) {
        const res = rng.randomReward(pool as IRngResult[]);
        rng.randomFloat(); // something related to rewards multiplier
        return res;
    }
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
                    if (bounty == "/Lotus/Types/Gameplay/Venus/Jobs/Heists/HeistProfitTakerBountyThree") {
                        await createMessage(inventory.accountOwnerId, [
                            {
                                sub: "/Lotus/Language/SolarisHeists/HeavyCatalystInboxTitle",
                                sndr: "/Lotus/Language/Bosses/Ordis",
                                msg: "/Lotus/Language/SolarisHeists/HeavyCatalystInboxMessage",
                                icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
                                att: ["/Lotus/Types/Restoratives/HeavyWeaponSummon"],
                                highPriority: true
                            }
                        ]);
                        await addItem(inventory, "/Lotus/Types/Items/MiscItems/HeavyWeaponCatalyst", 1);
                    }
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
                addLoreFragmentScans(inventory, value);
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
                if (!config.noDeathMarks) {
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
                }
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
    AffiliationMods?: IAffiliationMods[];
    SyndicateXPItemReward?: number;
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

    if (rewardInfo.rewardSeed) {
        // We're using a reward seed, so give the client a new one in the response. On live, missionInventoryUpdate seems to always provide a fresh one in the response.
        inventory.RewardSeed = generateRewardSeed();
    }

    //TODO: check double reward merging
    const MissionRewards: IMissionReward[] = getRandomMissionDrops(rewardInfo, wagerTier);
    logger.debug("random mission drops:", MissionRewards);
    const inventoryChanges: IInventoryChanges = {};
    const AffiliationMods: IAffiliationMods[] = [];
    let SyndicateXPItemReward;

    if (rewardInfo.sortieTag == "Final") {
        inventory.LastSortieReward = [
            {
                SortieId: new Types.ObjectId(rewardInfo.sortieId!.split("_")[1]),
                StoreItem: MissionRewards[0].StoreItem,
                Manifest: "/Lotus/Types/Game/MissionDecks/SortieRewards"
            }
        ];
    }

    let missionCompletionCredits = 0;
    //inventory change is what the client has not rewarded itself, also the client needs to know the credit changes for display
    if (levelKeyName) {
        const fixedLevelRewards = getLevelKeyRewards(levelKeyName);
        //logger.debug(`fixedLevelRewards ${fixedLevelRewards}`);
        if (fixedLevelRewards.levelKeyRewards) {
            addFixedLevelRewards(fixedLevelRewards.levelKeyRewards, inventory, MissionRewards, rewardInfo);
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
        if (
            node.missionIndex != 23 && // junction
            node.missionIndex != 28 && // open world
            missions.Tag != "SolNode761" && // the index
            missions.Tag != "SolNode762" && // the index
            missions.Tag != "SolNode763" && // the index
            missions.Tag != "CrewBattleNode556" // free flight
        ) {
            const levelCreditReward = getLevelCreditRewards(node);
            missionCompletionCredits += levelCreditReward;
            inventory.RegularCredits += levelCreditReward;
            logger.debug(`levelCreditReward ${levelCreditReward}`);
        }

        if (node.missionReward) {
            missionCompletionCredits += addFixedLevelRewards(node.missionReward, inventory, MissionRewards, rewardInfo);
        }

        if (missions.Tag == "PlutoToErisJunction") {
            await createMessage(inventory.accountOwnerId, [
                {
                    sndr: "/Lotus/Language/G1Quests/GolemQuestJordasName",
                    msg: "/Lotus/Language/G1Quests/GolemQuestIntroBody",
                    att: ["/Lotus/Types/Keys/GolemQuest/GolemQuestKeyChainItem"],
                    sub: "/Lotus/Language/G1Quests/GolemQuestIntroTitle",
                    icon: "/Lotus/Interface/Icons/Npcs/JordasPortrait.png",
                    highPriority: true
                }
            ]);
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
                inventory.Nemesis.MissionCount += 1;

                inventoryChanges.Nemesis.MissionCount ??= 0;
                inventoryChanges.Nemesis.MissionCount += 1;
            }

            inventoryChanges.Nemesis.InfNodes = inventory.Nemesis.InfNodes;
        }
    }

    if (rewardInfo.JobStage != undefined && rewardInfo.jobId) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [jobType, unkIndex, hubNode, syndicateId, locationTag] = rewardInfo.jobId.split("_");
        const worldState = getWorldState();
        let syndicateEntry = worldState.SyndicateMissions.find(m => m._id.$oid === syndicateId);
        if (!syndicateEntry) syndicateEntry = worldState.SyndicateMissions.find(m => m.Tag === syndicateId); // Sometimes syndicateId can be tag
        if (syndicateEntry && syndicateEntry.Jobs) {
            let currentJob = syndicateEntry.Jobs[rewardInfo.JobTier!];
            if (syndicateEntry.Tag === "EntratiSyndicate") {
                const vault = syndicateEntry.Jobs.find(j => j.locationTag === locationTag);
                if (vault) currentJob = vault;
                let medallionAmount = currentJob.xpAmounts[rewardInfo.JobStage];

                if (
                    ["DeimosEndlessAreaDefenseBounty", "DeimosEndlessExcavateBounty", "DeimosEndlessPurifyBounty"].some(
                        ending => jobType.endsWith(ending)
                    )
                ) {
                    const endlessJob = syndicateEntry.Jobs.find(j => j.endless);
                    if (endlessJob) {
                        const index = rewardInfo.JobStage % endlessJob.xpAmounts.length;
                        const excess = Math.floor(rewardInfo.JobStage / (endlessJob.xpAmounts.length - 1));
                        medallionAmount = Math.floor(endlessJob.xpAmounts[index] * (1 + 0.15000001 * excess));
                    }
                }
                await addItem(inventory, "/Lotus/Types/Items/Deimos/EntratiFragmentUncommonB", medallionAmount);
                MissionRewards.push({
                    StoreItem: "/Lotus/StoreItems/Types/Items/Deimos/EntratiFragmentUncommonB",
                    ItemCount: medallionAmount
                });
                SyndicateXPItemReward = medallionAmount;
            } else {
                if (rewardInfo.JobTier! >= 0) {
                    AffiliationMods.push(
                        addStanding(inventory, syndicateEntry.Tag, currentJob.xpAmounts[rewardInfo.JobStage])
                    );
                } else {
                    if (jobType.endsWith("Heists/HeistProfitTakerBountyOne") && rewardInfo.JobStage === 2) {
                        AffiliationMods.push(addStanding(inventory, syndicateEntry.Tag, 1000));
                    }
                    if (jobType.endsWith("Hunts/AllTeralystsHunt") && rewardInfo.JobStage === 2) {
                        AffiliationMods.push(addStanding(inventory, syndicateEntry.Tag, 5000));
                    }
                    if (
                        [
                            "Hunts/TeralystHunt",
                            "Heists/HeistProfitTakerBountyTwo",
                            "Heists/HeistProfitTakerBountyThree",
                            "Heists/HeistProfitTakerBountyFour",
                            "Heists/HeistExploiterBountyOne"
                        ].some(ending => jobType.endsWith(ending))
                    ) {
                        AffiliationMods.push(addStanding(inventory, syndicateEntry.Tag, 1000));
                    }
                }
            }
        }
    }

    if (rewardInfo.challengeMissionId) {
        const [syndicateTag, tierStr] = rewardInfo.challengeMissionId.split("_"); // TODO: third part in HexSyndicate jobs - Chemistry points
        const tier = Number(tierStr);
        const isSteelPath = missions?.Tier;
        if (syndicateTag === "ZarimanSyndicate") {
            let medallionAmount = tier + 1;
            if (isSteelPath) medallionAmount = Math.round(medallionAmount * 1.5);
            await addItem(inventory, "/Lotus/Types/Gameplay/Zariman/Resources/ZarimanDogTagBounty", medallionAmount);
            MissionRewards.push({
                StoreItem: "/Lotus/StoreItems/Types/Gameplay/Zariman/Resources/ZarimanDogTagBounty",
                ItemCount: medallionAmount
            });
            SyndicateXPItemReward = medallionAmount;
        } else {
            let standingAmount = (tier + 1) * 1000;
            if (tier > 5) standingAmount = 7500; // InfestedLichBounty
            if (isSteelPath) standingAmount *= 1.5;
            AffiliationMods.push(addStanding(inventory, syndicateTag, standingAmount));
        }
        if (isSteelPath) {
            await addItem(inventory, "/Lotus/Types/Items/MiscItems/SteelEssence", 1);
            MissionRewards.push({
                StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/SteelEssence",
                ItemCount: 1
            });
        }
    }

    return { inventoryChanges, MissionRewards, credits, AffiliationMods, SyndicateXPItemReward };
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
    MissionRewards: IMissionReward[],
    rewardInfo?: IRewardInfo
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
            const rotations: number[] = rewardInfo ? getRotations(rewardInfo) : [0];
            logger.debug(`rolling ${rewards.droptable} for level key rewards`, { rotations });
            for (const tier of rotations) {
                const reward = getRandomRewardByChance(ExportRewards[rewards.droptable][tier]);
                if (reward) {
                    MissionRewards.push({
                        StoreItem: reward.type,
                        ItemCount: reward.itemCount
                    });
                }
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
    if (RewardInfo.sortieTag == "Final") {
        const drop = getRandomRewardByChance(ExportRewards["/Lotus/Types/Game/MissionDecks/SortieRewards"][0])!;
        drops.push({ StoreItem: drop.type, ItemCount: drop.itemCount });
    }
    if (RewardInfo.periodicMissionTag?.startsWith("HardDaily")) {
        drops.push({
            StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/SteelEssence",
            ItemCount: 5
        });
    }
    if (RewardInfo.node in ExportRegions) {
        const region = ExportRegions[RewardInfo.node];
        let rewardManifests: string[] =
            RewardInfo.periodicMissionTag == "EliteAlert" || RewardInfo.periodicMissionTag == "EliteAlertB"
                ? ["/Lotus/Types/Game/MissionDecks/EliteAlertMissionRewards/EliteAlertMissionRewards"]
                : region.rewardManifests;

        let rotations: number[] = [];
        if (RewardInfo.jobId) {
            if (RewardInfo.JobStage! >= 0) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [jobType, unkIndex, hubNode, syndicateId, locationTag] = RewardInfo.jobId.split("_");
                let isEndlessJob = false;
                if (syndicateId) {
                    const worldState = getWorldState();
                    let syndicateEntry = worldState.SyndicateMissions.find(m => m._id.$oid === syndicateId);
                    if (!syndicateEntry) syndicateEntry = worldState.SyndicateMissions.find(m => m.Tag === syndicateId);

                    if (syndicateEntry && syndicateEntry.Jobs) {
                        let job = syndicateEntry.Jobs[RewardInfo.JobTier!];

                        if (syndicateEntry.Tag === "EntratiSyndicate") {
                            const vault = syndicateEntry.Jobs.find(j => j.locationTag === locationTag);
                            if (vault && locationTag) job = vault;
                            // if (
                            //     [
                            //         "DeimosRuinsExterminateBounty",
                            //         "DeimosRuinsEscortBounty",
                            //         "DeimosRuinsMistBounty",
                            //         "DeimosRuinsPurifyBounty",
                            //         "DeimosRuinsSacBounty"
                            //     ].some(ending => jobType.endsWith(ending))
                            // ) {
                            //     job.rewards = "TODO"; // Droptable for Arcana Isolation Vault
                            // }
                            if (
                                [
                                    "DeimosEndlessAreaDefenseBounty",
                                    "DeimosEndlessExcavateBounty",
                                    "DeimosEndlessPurifyBounty"
                                ].some(ending => jobType.endsWith(ending))
                            ) {
                                const endlessJob = syndicateEntry.Jobs.find(j => j.endless);
                                if (endlessJob) {
                                    isEndlessJob = true;
                                    job = endlessJob;
                                    const excess = Math.floor(RewardInfo.JobStage! / (job.xpAmounts.length - 1));

                                    const rotationIndexes = [0, 0, 1, 2];
                                    const rotationIndex = rotationIndexes[excess % rotationIndexes.length];
                                    const dropTable = [
                                        "/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierBTableARewards",
                                        "/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierBTableBRewards",
                                        "/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierBTableCRewards"
                                    ];
                                    job.rewards = dropTable[rotationIndex];
                                }
                            }
                        } else if (syndicateEntry.Tag === "SolarisSyndicate") {
                            if (jobType.endsWith("Heists/HeistProfitTakerBountyOne") && RewardInfo.JobStage == 2) {
                                job = {
                                    rewards:
                                        "/Lotus/Types/Game/MissionDecks/HeistJobMissionRewards/HeistTierATableARewards",
                                    masteryReq: 0,
                                    minEnemyLevel: 40,
                                    maxEnemyLevel: 60,
                                    xpAmounts: [1000]
                                };
                                RewardInfo.Q = false; // Just in case
                            } else {
                                const tierMap = {
                                    Two: "B",
                                    Three: "C",
                                    Four: "D"
                                };

                                for (const [key, tier] of Object.entries(tierMap)) {
                                    if (jobType.endsWith(`Heists/HeistProfitTakerBounty${key}`)) {
                                        job = {
                                            rewards: `/Lotus/Types/Game/MissionDecks/HeistJobMissionRewards/HeistTier${tier}TableARewards`,
                                            masteryReq: 0,
                                            minEnemyLevel: 40,
                                            maxEnemyLevel: 60,
                                            xpAmounts: [1000]
                                        };
                                        RewardInfo.Q = false; // Just in case
                                        break;
                                    }
                                }
                            }
                        }
                        rewardManifests = [job.rewards];
                        rotations = [RewardInfo.JobStage! % (job.xpAmounts.length - 1)];
                        if (
                            RewardInfo.Q &&
                            (RewardInfo.JobStage === job.xpAmounts.length - 1 || job.isVault) &&
                            !isEndlessJob
                        ) {
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (ExportRewards[job.rewards]) {
                                rewardManifests.push(job.rewards);
                                rotations.push(ExportRewards[job.rewards].length - 1);
                            }
                        }
                    }
                }
            }
        } else if (RewardInfo.challengeMissionId) {
            const rewardTables: Record<string, string[]> = {
                EntratiLabSyndicate: [
                    "/Lotus/Types/Game/MissionDecks/EntratiLabJobMissionReward/TierATableRewards",
                    "/Lotus/Types/Game/MissionDecks/EntratiLabJobMissionReward/TierBTableRewards",
                    "/Lotus/Types/Game/MissionDecks/EntratiLabJobMissionReward/TierCTableRewards",
                    "/Lotus/Types/Game/MissionDecks/EntratiLabJobMissionReward/TierDTableRewards",
                    "/Lotus/Types/Game/MissionDecks/EntratiLabJobMissionReward/TierETableRewards"
                ],
                ZarimanSyndicate: [
                    "/Lotus/Types/Game/MissionDecks/ZarimanJobMissionRewards/TierATableRewards",
                    "/Lotus/Types/Game/MissionDecks/ZarimanJobMissionRewards/TierBTableRewards",
                    "/Lotus/Types/Game/MissionDecks/ZarimanJobMissionRewards/TierCTableRewards",
                    "/Lotus/Types/Game/MissionDecks/ZarimanJobMissionRewards/TierDTableRewards",
                    "/Lotus/Types/Game/MissionDecks/ZarimanJobMissionRewards/TierETableRewards"
                ],
                HexSyndicate: [
                    "/Lotus/Types/Game/MissionDecks/1999MissionRewards/TierABountyRewards",
                    "/Lotus/Types/Game/MissionDecks/1999MissionRewards/TierBBountyRewards",
                    "/Lotus/Types/Game/MissionDecks/1999MissionRewards/TierCBountyRewards",
                    "/Lotus/Types/Game/MissionDecks/1999MissionRewards/TierDBountyRewards",
                    "/Lotus/Types/Game/MissionDecks/1999MissionRewards/TierEBountyRewards",
                    "/Lotus/Types/Game/MissionDecks/1999MissionRewards/TierFBountyRewards",
                    "/Lotus/Types/Game/MissionDecks/1999MissionRewards/InfestedLichBountyRewards"
                ]
            };

            const [syndicateTag, tierStr] = RewardInfo.challengeMissionId.split("_");
            const tier = Number(tierStr);

            const rewardTable = rewardTables[syndicateTag][tier];

            if (rewardTable) {
                rewardManifests = [rewardTable];
                rotations = [0];
            } else {
                logger.error(`Unknown syndicate or tier: ${RewardInfo.challengeMissionId}`);
            }
        } else {
            rotations = getRotations(RewardInfo, tierOverride);
        }
        if (rewardManifests.length != 0) {
            logger.debug(`generating random mission rewards`, { rewardManifests, rotations });
        }
        const rng = new SRng(BigInt(RewardInfo.rewardSeed ?? generateRewardSeed()) ^ 0xffffffffffffffffn);
        rewardManifests.forEach(name => {
            const table = ExportRewards[name];
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!table) {
                logger.error(`unknown droptable: ${name}`);
                return;
            }
            for (const rotation of rotations) {
                const rotationRewards = table[rotation];
                const drop = getRandomRewardByChance(rotationRewards, rng);
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

        if (RewardInfo.PurgatoryRewardQualifications) {
            for (const encodedQualification of RewardInfo.PurgatoryRewardQualifications) {
                const qualification = parseInt(encodedQualification) - 1;
                if (qualification < 0 || qualification > 8) {
                    logger.error(`unexpected purgatory reward qualification: ${qualification}`);
                } else {
                    const drop = getRandomRewardByChance(
                        ExportRewards[
                            [
                                "/Lotus/Types/Game/MissionDecks/PurgatoryMissionRewards/PurgatoryBlackTokenRewards",
                                "/Lotus/Types/Game/MissionDecks/PurgatoryMissionRewards/PurgatoryGoldTokenRewards",
                                "/Lotus/Types/Game/MissionDecks/PurgatoryMissionRewards/PurgatoryBlueTokenRewards"
                            ][Math.trunc(qualification / 3)]
                        ][qualification % 3]
                    );
                    if (drop) {
                        drops.push({
                            StoreItem: drop.type,
                            ItemCount: drop.itemCount,
                            FromEnemyCache: true // to show "identified"
                        });
                    }
                }
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
