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
import { equipmentKeys, IMission, ITypeCount, TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import {
    addBooster,
    addChallenges,
    addConsumables,
    addCrewShipAmmo,
    addCrewShipRawSalvage,
    addEmailItem,
    addFocusXpIncreases,
    addFusionPoints,
    addFusionTreasures,
    addItem,
    addLevelKeys,
    addLoreFragmentScans,
    addMiscItems,
    addMissionComplete,
    addMods,
    addRecipes,
    addShipDecorations,
    addSkin,
    addStanding,
    applyClientEquipmentUpdates,
    combineInventoryChanges,
    generateRewardSeed,
    getCalendarProgress,
    getDialogue,
    giveNemesisPetRecipe,
    giveNemesisWeaponRecipe,
    updateCurrency,
    updateSyndicate
} from "@/src/services/inventoryService";
import { updateQuestKey } from "@/src/services/questService";
import { Types } from "mongoose";
import { IAffiliationMods, IInventoryChanges } from "@/src/types/purchaseTypes";
import { fromStoreItem, getLevelKeyRewards, toStoreItem } from "@/src/services/itemDataService";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { getEntriesUnsafe } from "@/src/utils/ts-utils";
import { IEquipmentClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { handleStoreItemAcquisition } from "./purchaseService";
import { IMissionCredits, IMissionReward } from "../types/missionTypes";
import { crackRelic } from "@/src/helpers/relicHelper";
import { createMessage } from "./inboxService";
import kuriaMessage50 from "@/static/fixed_responses/kuriaMessages/fiftyPercent.json";
import kuriaMessage75 from "@/static/fixed_responses/kuriaMessages/seventyFivePercent.json";
import kuriaMessage100 from "@/static/fixed_responses/kuriaMessages/oneHundredPercent.json";
import conservationAnimals from "@/static/fixed_responses/conservationAnimals.json";
import {
    generateNemesisProfile,
    getInfestedLichItemRewards,
    getInfNodes,
    getKillTokenRewardCount,
    getNemesisManifest,
    getNemesisPasscode
} from "@/src/helpers/nemesisHelpers";
import { Loadout } from "../models/inventoryModels/loadoutModel";
import { ILoadoutConfigDatabase } from "../types/saveLoadoutTypes";
import {
    getLiteSortie,
    getSortie,
    getWorldState,
    idToBountyCycle,
    idToDay,
    idToWeek,
    pushClassicBounties
} from "./worldStateService";
import { config } from "./configService";
import libraryDailyTasks from "@/static/fixed_responses/libraryDailyTasks.json";
import { ISyndicateMissionInfo } from "../types/worldStateTypes";
import { fromOid } from "../helpers/inventoryHelpers";
import { TAccountDocument } from "./loginService";

const getRotations = (rewardInfo: IRewardInfo, tierOverride?: number): number[] => {
    // For Spy missions, e.g. 3 vaults cracked = A, B, C
    if (rewardInfo.VaultsCracked) {
        const rotations: number[] = [];
        for (let i = 0; i != rewardInfo.VaultsCracked; ++i) {
            rotations.push(i);
        }
        return rotations;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const missionIndex: number | undefined = ExportRegions[rewardInfo.node]?.missionIndex;

    // For Rescue missions
    if (missionIndex == 3 && rewardInfo.rewardTier) {
        return [rewardInfo.rewardTier];
    }

    const rotationCount = rewardInfo.rewardQualifications?.length || 0;

    // Empty or absent rewardQualifications should not give rewards when:
    // - Completing only 1 zone of (E)SO (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/1823)
    // - Aborting a railjack mission (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/1741)
    if (rotationCount == 0 && missionIndex != 30 && missionIndex != 32) {
        return [0];
    }

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
    account: TAccountDocument,
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
        if (inventoryUpdates.RewardInfo.NemesisHenchmenKills && inventory.Nemesis) {
            inventory.Nemesis.HenchmenKilled += inventoryUpdates.RewardInfo.NemesisHenchmenKills;
        }
        if (inventoryUpdates.RewardInfo.NemesisHintProgress && inventory.Nemesis) {
            inventory.Nemesis.HintProgress += inventoryUpdates.RewardInfo.NemesisHintProgress;
            if (inventory.Nemesis.Faction != "FC_INFESTATION" && inventory.Nemesis.Hints.length != 3) {
                const progressNeeded = [35, 60, 100][inventory.Nemesis.Hints.length];
                if (inventory.Nemesis.HintProgress >= progressNeeded) {
                    inventory.Nemesis.HintProgress -= progressNeeded;
                    const passcode = getNemesisPasscode(inventory.Nemesis);
                    inventory.Nemesis.Hints.push(passcode[inventory.Nemesis.Hints.length]);
                }
            }
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
                if (config.dontSubtractConsumables) {
                    addConsumables(
                        inventory,
                        value.filter(x => x.ItemCount > 0)
                    );
                } else {
                    addConsumables(inventory, value);
                }
                break;
            case "Recipes":
                addRecipes(inventory, value);
                break;
            case "ChallengeProgress":
                addChallenges(account, inventory, value, inventoryUpdates.SeasonChallengeCompletions);
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
                let fusionPointsDelta = 0;
                for (const fusionBundle of value) {
                    fusionPointsDelta += addFusionPoints(
                        inventory,
                        ExportFusionBundles[fusionBundle.ItemType].fusionPoints * fusionBundle.ItemCount
                    );
                }
                inventoryChanges.FusionPoints = fusionPointsDelta;
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
                    if (inventory.LibraryPersonalTarget) {
                        const taskAvatar = libraryPersonalTargetToAvatar[inventory.LibraryPersonalTarget];
                        const taskAvatars = libraryDailyTasks.find(x => x.indexOf(taskAvatar) != -1)!;
                        if (taskAvatars.indexOf(scan.EnemyType) != -1) {
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
                                inventory.LibraryPersonalTarget = undefined;
                            }
                            logger.debug(`synthesis of ${scan.EnemyType} added to personal target progress`);
                            synthesisIgnored = false;
                        }
                    }
                    if (
                        inventory.LibraryActiveDailyTaskInfo &&
                        inventory.LibraryActiveDailyTaskInfo.EnemyTypes.indexOf(scan.EnemyType) != -1
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
                    const id = fromOid(clientUpgrade.ItemId);
                    if (id == "") {
                        // U19 does not provide RawUpgrades and instead interleaves them with riven progress here
                        addMods(inventory, [clientUpgrade]);
                    } else {
                        const upgrade = inventory.Upgrades.id(id)!;
                        upgrade.UpgradeFingerprint = clientUpgrade.UpgradeFingerprint; // primitive way to copy over the riven challenge progress
                    }
                });
                break;
            case "WeaponSkins":
                for (const item of value) {
                    addSkin(inventory, item.ItemType);
                }
                break;
            case "Boosters":
                value.forEach(booster => {
                    addBooster(booster.ItemType, booster.ExpiryDate, inventory);
                });
                break;
            case "SyndicateId": {
                if (!config.syndicateMissionsRepeatable) {
                    inventory.CompletedSyndicates.push(value);
                }
                break;
            }
            case "SortieId": {
                if (inventory.CompletedSorties.indexOf(value) == -1) {
                    inventory.CompletedSorties.push(value);
                }
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
            case "KubrowPetEggs": {
                for (const egg of value) {
                    inventory.KubrowPetEggs ??= [];
                    inventory.KubrowPetEggs.push({
                        ItemType: egg.ItemType,
                        _id: new Types.ObjectId()
                    });
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
            case "BrandedSuits": {
                inventory.BrandedSuits ??= [];
                if (!inventory.BrandedSuits.find(x => x.equals(value.$oid))) {
                    inventory.BrandedSuits.push(new Types.ObjectId(value.$oid));

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
                inventory.Harvestable = false;
                break;
            }
            case "UnlockWeapons": {
                inventory.LockedWeaponGroup = undefined;
                break;
            }
            case "IncHarvester": {
                inventory.Harvestable = true;
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
            case "InvasionProgress": {
                for (const clientProgress of value) {
                    const dbProgress = inventory.QualifyingInvasions.find(x =>
                        x.invasionId.equals(clientProgress._id.$oid)
                    );
                    if (dbProgress) {
                        dbProgress.Delta += clientProgress.Delta;
                        dbProgress.AttackerScore += clientProgress.AttackerScore;
                        dbProgress.DefenderScore += clientProgress.DefenderScore;
                    } else {
                        inventory.QualifyingInvasions.push({
                            invasionId: new Types.ObjectId(clientProgress._id.$oid),
                            Delta: clientProgress.Delta,
                            AttackerScore: clientProgress.AttackerScore,
                            DefenderScore: clientProgress.DefenderScore
                        });
                    }
                }
                break;
            }
            case "CalendarProgress": {
                const calendarProgress = getCalendarProgress(inventory);
                for (const progress of value) {
                    const challengeName = progress.challenge.substring(progress.challenge.lastIndexOf("/") + 1);
                    calendarProgress.SeasonProgress.LastCompletedChallengeDayIdx++;
                    calendarProgress.SeasonProgress.ActivatedChallenges.push(challengeName);
                }
                break;
            }
            case "duviriCaveOffers": {
                // Duviri cave offers (generated with the duviri seed) change after completing one of its game modes (not when aborting).
                if (inventoryUpdates.MissionStatus != "GS_QUIT") {
                    inventory.DuviriInfo!.Seed = generateRewardSeed();
                }
                break;
            }
            case "NemesisKillConvert":
                if (inventory.Nemesis) {
                    inventory.NemesisHistory ??= [];
                    inventory.NemesisHistory.push({
                        // Copy over all 'base' values
                        fp: inventory.Nemesis.fp,
                        d: inventory.Nemesis.d,
                        manifest: inventory.Nemesis.manifest,
                        KillingSuit: inventory.Nemesis.KillingSuit,
                        killingDamageType: inventory.Nemesis.killingDamageType,
                        ShoulderHelmet: inventory.Nemesis.ShoulderHelmet,
                        WeaponIdx: inventory.Nemesis.WeaponIdx,
                        AgentIdx: inventory.Nemesis.AgentIdx,
                        BirthNode: inventory.Nemesis.BirthNode,
                        Faction: inventory.Nemesis.Faction,
                        Rank: inventory.Nemesis.Rank,
                        Traded: inventory.Nemesis.Traded,
                        PrevOwners: inventory.Nemesis.PrevOwners,
                        SecondInCommand: false,
                        Weakened: inventory.Nemesis.Weakened,
                        // And set killed flag
                        k: value.killed
                    });

                    const manifest = getNemesisManifest(inventory.Nemesis.manifest);
                    const profile = generateNemesisProfile(
                        inventory.Nemesis.fp,
                        manifest,
                        inventory.Nemesis.KillingSuit
                    );
                    const att: string[] = [];
                    let countedAtt: ITypeCount[] | undefined;

                    if (value.killed) {
                        if (
                            value.weaponLoc &&
                            inventory.Nemesis.Faction != "FC_INFESTATION" // weaponLoc is "/Lotus/Language/Weapons/DerelictCernosName" for these for some reason
                        ) {
                            const weaponType = manifest.weapons[inventory.Nemesis.WeaponIdx];
                            giveNemesisWeaponRecipe(inventory, weaponType, value.nemesisName, value.weaponLoc, profile);
                            att.push(weaponType);
                        }
                        //if (value.petLoc) {
                        if (profile.petHead) {
                            giveNemesisPetRecipe(inventory, value.nemesisName, profile);
                            att.push(
                                {
                                    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadA":
                                        "/Lotus/Types/Recipes/ZanukaPet/ZanukaPetCompleteHeadABlueprint",
                                    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadB":
                                        "/Lotus/Types/Recipes/ZanukaPet/ZanukaPetCompleteHeadBBlueprint",
                                    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadC":
                                        "/Lotus/Types/Recipes/ZanukaPet/ZanukaPetCompleteHeadCBlueprint"
                                }[profile.petHead]
                            );
                        }
                    }

                    // "Players will receive a Lich's Ephemera regardless of whether they Vanquish or Convert them."
                    if (profile.ephemera) {
                        addSkin(inventory, profile.ephemera);
                        att.push(profile.ephemera);
                    }

                    const skinRewardStoreItem = value.killed ? manifest.firstKillReward : manifest.firstConvertReward;
                    if (Object.keys(addSkin(inventory, fromStoreItem(skinRewardStoreItem))).length != 0) {
                        att.push(skinRewardStoreItem);
                    }

                    if (inventory.Nemesis.Faction == "FC_INFESTATION") {
                        const [rotARewardStoreItem, rotBRewardStoreItem] = getInfestedLichItemRewards(
                            inventory.Nemesis.fp
                        );
                        const rotAReward = fromStoreItem(rotARewardStoreItem);
                        const rotBReward = fromStoreItem(rotBRewardStoreItem);
                        await addItem(inventory, rotAReward);
                        await addItem(inventory, rotBReward);
                        att.push(rotAReward);
                        att.push(rotBReward);

                        if (value.killed) {
                            countedAtt = [
                                {
                                    ItemType: "/Lotus/Types/Items/MiscItems/CodaWeaponBucks",
                                    ItemCount: getKillTokenRewardCount(inventory.Nemesis.fp)
                                }
                            ];
                            addMiscItems(inventory, countedAtt);
                        }
                    }

                    if (value.killed) {
                        await createMessage(inventory.accountOwnerId, [
                            {
                                sndr: "/Lotus/Language/Bosses/Ordis",
                                msg: manifest.messageBody,
                                arg: [
                                    {
                                        Key: "LICH_NAME",
                                        Tag: value.nemesisName
                                    }
                                ],
                                att: att,
                                countedAtt: countedAtt,
                                attVisualOnly: true,
                                sub: manifest.messageTitle,
                                icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
                                highPriority: true
                            }
                        ]);
                    }

                    inventory.Nemesis = undefined;
                }
                break;
            default:
                if (equipmentKeys.includes(key as TEquipmentKey)) {
                    applyClientEquipmentUpdates(inventory, value as IEquipmentClient[], key as TEquipmentKey);
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
    ConquestCompletedMissionsCount?: number;
}

interface IConquestReward {
    at: number;
    pool: IRngResult[];
}

const labConquestRewards: IConquestReward[] = [
    {
        at: 5,
        pool: ExportRewards[
            "/Lotus/Types/Game/MissionDecks/EntratiLabConquestRewards/EntratiLabConquestSilverRewards"
        ][0] as IRngResult[]
    },
    {
        at: 10,
        pool: ExportRewards[
            "/Lotus/Types/Game/MissionDecks/EntratiLabConquestRewards/EntratiLabConquestSilverRewards"
        ][0] as IRngResult[]
    },
    {
        at: 15,
        pool: [
            {
                type: "/Lotus/StoreItems/Types/Gameplay/EntratiLab/Resources/EntratiLanthornBundle",
                itemCount: 3,
                probability: 1
            }
        ]
    },
    {
        at: 20,
        pool: ExportRewards[
            "/Lotus/Types/Game/MissionDecks/EntratiLabConquestRewards/EntratiLabConquestGoldRewards"
        ][0] as IRngResult[]
    },
    {
        at: 28,
        pool: [
            {
                type: "/Lotus/StoreItems/Types/Items/MiscItems/DistillPoints",
                itemCount: 20,
                probability: 1
            }
        ]
    },
    {
        at: 31,
        pool: ExportRewards[
            "/Lotus/Types/Game/MissionDecks/EntratiLabConquestRewards/EntratiLabConquestGoldRewards"
        ][0] as IRngResult[]
    },
    {
        at: 34,
        pool: ExportRewards[
            "/Lotus/Types/Game/MissionDecks/EntratiLabConquestRewards/EntratiLabConquestArcaneRewards"
        ][0] as IRngResult[]
    },
    {
        at: 37,
        pool: [
            {
                type: "/Lotus/StoreItems/Types/Items/MiscItems/DistillPoints",
                itemCount: 50,
                probability: 1
            }
        ]
    }
];

const hexConquestRewards: IConquestReward[] = [
    {
        at: 5,
        pool: ExportRewards[
            "/Lotus/Types/Game/MissionDecks/1999ConquestRewards/1999ConquestSilverRewards"
        ][0] as IRngResult[]
    },
    {
        at: 10,
        pool: ExportRewards[
            "/Lotus/Types/Game/MissionDecks/1999ConquestRewards/1999ConquestSilverRewards"
        ][0] as IRngResult[]
    },
    {
        at: 15,
        pool: [
            {
                type: "/Lotus/StoreItems/Types/BoosterPacks/1999StickersPackEchoesArchimedea",
                itemCount: 1,
                probability: 1
            }
        ]
    },
    {
        at: 20,
        pool: ExportRewards[
            "/Lotus/Types/Game/MissionDecks/1999ConquestRewards/1999ConquestGoldRewards"
        ][0] as IRngResult[]
    },
    {
        at: 28,
        pool: [
            {
                type: "/Lotus/StoreItems/Types/Items/MiscItems/1999ConquestBucks",
                itemCount: 6,
                probability: 1
            }
        ]
    },
    {
        at: 31,
        pool: ExportRewards[
            "/Lotus/Types/Game/MissionDecks/1999ConquestRewards/1999ConquestGoldRewards"
        ][0] as IRngResult[]
    },
    {
        at: 34,
        pool: ExportRewards[
            "/Lotus/Types/Game/MissionDecks/1999ConquestRewards/1999ConquestArcaneRewards"
        ][0] as IRngResult[]
    },
    {
        at: 37,
        pool: [
            {
                type: "/Lotus/StoreItems/Types/Items/MiscItems/1999ConquestBucks",
                itemCount: 9,
                probability: 1
            }
        ]
    }
];

const droptableAliases: Record<string, string> = {
    "/Lotus/Types/DropTables/ManInTheWall/MITWGruzzlingArcanesDropTable":
        "/Lotus/Types/DropTables/EntratiLabDropTables/DoppelgangerDropTable",
    "/Lotus/Types/DropTables/WF1999DropTables/LasrianTankSteelPathDropTable":
        "/Lotus/Types/DropTables/WF1999DropTables/LasrianTankHardModeDropTable"
};

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
    }: IMissionInventoryUpdateRequest,
    firstCompletion: boolean
): Promise<AddMissionRewardsReturnType> => {
    if (!rewardInfo) {
        //TODO: if there is a case where you can have credits collected during a mission but no rewardInfo, add credits needs to be handled earlier
        logger.debug(`Mission ${missions!.Tag} did not have Reward Info `);
        return { MissionRewards: [] };
    }

    //TODO: check double reward merging
    const MissionRewards: IMissionReward[] = getRandomMissionDrops(
        inventory,
        rewardInfo,
        missions,
        wagerTier,
        firstCompletion
    );
    logger.debug("random mission drops:", MissionRewards);
    const inventoryChanges: IInventoryChanges = {};
    const AffiliationMods: IAffiliationMods[] = [];
    let SyndicateXPItemReward;
    let ConquestCompletedMissionsCount;

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
                    missionCompletionCredits += reward.amount; // will be added to inventory in addCredits
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
            missions.Tag != "CrewBattleNode556" && // free flight
            getRotations(rewardInfo).length > 0 // (E)SO should not give credits for only completing zone 1, in which case it has no rewardQualifications (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/1823)
        ) {
            const levelCreditReward = getLevelCreditRewards(node);
            missionCompletionCredits += levelCreditReward;
            inventory.RegularCredits += levelCreditReward;
            logger.debug(`levelCreditReward ${levelCreditReward}`);
        }

        if (node.missionReward) {
            missionCompletionCredits += addFixedLevelRewards(node.missionReward, inventory, MissionRewards, rewardInfo);
        }

        if (rewardInfo.sortieTag == "Mission1") {
            missionCompletionCredits += 20_000;
        } else if (rewardInfo.sortieTag == "Mission2") {
            missionCompletionCredits += 30_000;
        } else if (rewardInfo.sortieTag == "Final") {
            missionCompletionCredits += 50_000;
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
            StoreItem: getRandomElement(corruptedMods)!,
            ItemCount: 1
        });
    }

    if (rewardInfo.periodicMissionTag == "EliteAlert" || rewardInfo.periodicMissionTag == "EliteAlertB") {
        missionCompletionCredits += 50_000;
        MissionRewards.push({
            StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/Elitium",
            ItemCount: 1
        });
    }

    if (rewardInfo.ConquestCompleted !== undefined) {
        let score = 1;
        if (rewardInfo.ConquestHardModeActive === 1) score += 3;

        if (rewardInfo.ConquestPersonalModifiersActive !== undefined)
            score += rewardInfo.ConquestPersonalModifiersActive;
        if (rewardInfo.ConquestEquipmentSuggestionsFulfilled !== undefined)
            score += rewardInfo.ConquestEquipmentSuggestionsFulfilled;

        score *= rewardInfo.ConquestCompleted + 1;

        if (rewardInfo.ConquestCompleted == 2 && rewardInfo.ConquestHardModeActive === 1) score += 1;

        logger.debug(`completed conquest mission ${rewardInfo.ConquestCompleted + 1} for a score of ${score}`);

        const conquestType = rewardInfo.ConquestType;
        const conquestNode =
            conquestType == "HexConquest" ? "EchoesHexConquestHardModeUnlocked" : "EntratiLabConquestHardModeUnlocked";
        if (score >= 25 && inventory.NodeIntrosCompleted.indexOf(conquestNode) == -1)
            inventory.NodeIntrosCompleted.push(conquestNode);

        if (conquestType == "HexConquest") {
            inventory.EchoesHexConquestCacheScoreMission ??= 0;
            if (score > inventory.EchoesHexConquestCacheScoreMission) {
                for (const reward of hexConquestRewards) {
                    if (score >= reward.at && inventory.EchoesHexConquestCacheScoreMission < reward.at) {
                        const rolled = getRandomReward(reward.pool)!;
                        logger.debug(`rolled hex conquest reward for reaching ${reward.at} points`, rolled);
                        MissionRewards.push({
                            StoreItem: rolled.type,
                            ItemCount: rolled.itemCount
                        });
                    }
                }
                inventory.EchoesHexConquestCacheScoreMission = score;
            }
        } else {
            inventory.EntratiLabConquestCacheScoreMission ??= 0;
            if (score > inventory.EntratiLabConquestCacheScoreMission) {
                for (const reward of labConquestRewards) {
                    if (score >= reward.at && inventory.EntratiLabConquestCacheScoreMission < reward.at) {
                        const rolled = getRandomReward(reward.pool)!;
                        logger.debug(`rolled lab conquest reward for reaching ${reward.at} points`, rolled);
                        MissionRewards.push({
                            StoreItem: rolled.type,
                            ItemCount: rolled.itemCount
                        });
                    }
                }
                inventory.EntratiLabConquestCacheScoreMission = score;
            }
        }

        ConquestCompletedMissionsCount = rewardInfo.ConquestCompleted == 2 ? 0 : rewardInfo.ConquestCompleted + 1;
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
            if (si.DropTable in droptableAliases) {
                logger.debug(`rewriting ${si.DropTable} to ${droptableAliases[si.DropTable]}`);
                si.DropTable = droptableAliases[si.DropTable];
            }
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
                inventory.Nemesis.InfNodes = getInfNodes(
                    getNemesisManifest(inventory.Nemesis.manifest),
                    inventory.Nemesis.Rank
                );
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
        const [jobType, unkIndex, hubNode, syndicateMissionId, locationTag] = rewardInfo.jobId.split("_");
        const syndicateMissions: ISyndicateMissionInfo[] = [];
        pushClassicBounties(syndicateMissions, idToBountyCycle(syndicateMissionId));
        const syndicateEntry = syndicateMissions.find(m => m._id.$oid === syndicateMissionId);
        if (syndicateEntry && syndicateEntry.Jobs) {
            let currentJob = syndicateEntry.Jobs[rewardInfo.JobTier!];
            if (syndicateEntry.Tag === "EntratiSyndicate") {
                const vault = syndicateEntry.Jobs.find(j => j.locationTag === locationTag);
                if (vault) currentJob = vault;
                let medallionAmount = Math.floor(currentJob.xpAmounts[rewardInfo.JobStage] / (rewardInfo.Q ? 0.8 : 1));

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
                        addStanding(
                            inventory,
                            syndicateEntry.Tag,
                            Math.floor(currentJob.xpAmounts[rewardInfo.JobStage] / (rewardInfo.Q ? 0.8 : 1))
                        )
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
        const [syndicateTag, tierStr, chemistryStr] = rewardInfo.challengeMissionId.split("_");
        const tier = Number(tierStr);
        const chemistry = Number(chemistryStr);
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
        if (syndicateTag == "HexSyndicate" && chemistry && tier < 6) {
            const seed = getWorldState().SyndicateMissions.find(x => x.Tag == "HexSyndicate")!.Seed;
            const { nodes, buddies } = getHexBounties(seed);
            const buddy = buddies[tier];
            logger.debug(`Hex seed is ${seed}, giving chemistry for ${buddy}`);
            if (missions?.Tag != nodes[tier]) {
                logger.warn(
                    `Uh-oh, tier ${tier} bounty should've been on ${nodes[tier]} but you were just on ${missions?.Tag}`
                );
            }
            const tomorrowAt0Utc = config.noKimCooldowns
                ? Date.now()
                : (Math.trunc(Date.now() / 86400_000) + 1) * 86400_000;
            const dialogue = getDialogue(inventory, buddy);
            dialogue.Chemistry += chemistry;
            dialogue.BountyChemExpiry = new Date(tomorrowAt0Utc);
        }
        if (isSteelPath) {
            await addItem(inventory, "/Lotus/Types/Items/MiscItems/SteelEssence", 1);
            MissionRewards.push({
                StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/SteelEssence",
                ItemCount: 1
            });
        }
    }

    return {
        inventoryChanges,
        MissionRewards,
        credits,
        AffiliationMods,
        SyndicateXPItemReward,
        ConquestCompletedMissionsCount
    };
};

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

function getRandomMissionDrops(
    inventory: TInventoryDatabaseDocument,
    RewardInfo: IRewardInfo,
    mission: IMission | undefined,
    tierOverride: number | undefined,
    firstCompletion: boolean
): IMissionReward[] {
    const drops: IMissionReward[] = [];
    if (RewardInfo.sortieTag == "Final" && firstCompletion) {
        const arr = RewardInfo.sortieId!.split("_");
        let sortieId = arr[1];
        if (sortieId == "Lite") {
            sortieId = arr[2];

            const boss = getLiteSortie(idToWeek(sortieId)).Boss;
            let crystalType = {
                SORTIE_BOSS_AMAR: "/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalAmar",
                SORTIE_BOSS_NIRA: "/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalNira",
                SORTIE_BOSS_BOREAL: "/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalBoreal"
            }[boss];
            const attenTag = {
                SORTIE_BOSS_AMAR: "NarmerSortieAmarCrystalRewards",
                SORTIE_BOSS_NIRA: "NarmerSortieNiraCrystalRewards",
                SORTIE_BOSS_BOREAL: "NarmerSortieBorealCrystalRewards"
            }[boss];
            const attenIndex = inventory.SortieRewardAttenuation?.findIndex(x => x.Tag == attenTag) ?? -1;
            const mythicProbability =
                0.2 + (inventory.SortieRewardAttenuation?.find(x => x.Tag == attenTag)?.Atten ?? 0);
            if (Math.random() < mythicProbability) {
                crystalType += "Mythic";
                if (attenIndex != -1) {
                    inventory.SortieRewardAttenuation!.splice(attenIndex, 1);
                }
            } else {
                if (attenIndex == -1) {
                    inventory.SortieRewardAttenuation ??= [];
                    inventory.SortieRewardAttenuation.push({
                        Tag: attenTag,
                        Atten: 0.2
                    });
                } else {
                    inventory.SortieRewardAttenuation![attenIndex].Atten += 0.2;
                }
            }

            drops.push({ StoreItem: crystalType, ItemCount: 1 });

            const drop = getRandomRewardByChance(
                ExportRewards["/Lotus/Types/Game/MissionDecks/ArchonSortieRewards"][0]
            )!;
            drops.push({ StoreItem: drop.type, ItemCount: drop.itemCount });
            inventory.LastLiteSortieReward = [
                {
                    SortieId: new Types.ObjectId(sortieId),
                    StoreItem: drop.type,
                    Manifest: "/Lotus/Types/Game/MissionDecks/ArchonSortieRewards"
                }
            ];
        } else {
            const drop = getRandomRewardByChance(ExportRewards["/Lotus/Types/Game/MissionDecks/SortieRewards"][0])!;
            drops.push({ StoreItem: drop.type, ItemCount: drop.itemCount });
            inventory.LastSortieReward = [
                {
                    SortieId: new Types.ObjectId(sortieId),
                    StoreItem: drop.type,
                    Manifest: "/Lotus/Types/Game/MissionDecks/SortieRewards"
                }
            ];
        }
    }
    if (RewardInfo.periodicMissionTag?.startsWith("HardDaily")) {
        drops.push({
            StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/SteelEssence",
            ItemCount: 5
        });
    }
    if (RewardInfo.node in ExportRegions) {
        const region = ExportRegions[RewardInfo.node];
        let rewardManifests: string[];
        if (RewardInfo.periodicMissionTag == "EliteAlert" || RewardInfo.periodicMissionTag == "EliteAlertB") {
            rewardManifests = ["/Lotus/Types/Game/MissionDecks/EliteAlertMissionRewards/EliteAlertMissionRewards"];
        } else if (RewardInfo.invasionId && region.missionIndex == 0) {
            // Invasion assassination has Phorid has the boss who should drop Nyx parts
            // TODO: Check that the invasion faction is indeed FC_INFESTATION once the Invasions in worldState are more dynamic
            rewardManifests = ["/Lotus/Types/Game/MissionDecks/BossMissionRewards/NyxRewards"];
        } else if (RewardInfo.sortieId) {
            // Sortie mission types differ from the underlying node and hence also don't give rewards from the underlying nodes.
            // Assassinations in non-lite sorties are an exception to this.
            if (region.missionIndex == 0) {
                const arr = RewardInfo.sortieId.split("_");
                let giveNodeReward = false;
                if (arr[1] != "Lite") {
                    const sortie = getSortie(idToDay(arr[1]));
                    giveNodeReward = sortie.Variants.find(x => x.node == arr[0])!.missionType == "MT_ASSASSINATION";
                }
                rewardManifests = giveNodeReward ? region.rewardManifests : [];
            } else {
                rewardManifests = [];
            }
        } else if (RewardInfo.T == 13) {
            // Undercroft extra/side portal (normal mode), gives 1 Pathos Clamp + Duviri Arcane.
            drops.push({
                StoreItem: "/Lotus/StoreItems/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem",
                ItemCount: 1
            });
            rewardManifests = [
                "/Lotus/Types/Game/MissionDecks/DuviriEncounterRewards/DuviriStaticUndercroftResourceRewards"
            ];
        } else if (RewardInfo.T == 14) {
            // Undercroft extra/side portal (steel path), gives 3 Pathos Clamps + Eidolon Arcane.
            drops.push({
                StoreItem: "/Lotus/StoreItems/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem",
                ItemCount: 3
            });
            rewardManifests = [
                "/Lotus/Types/Game/MissionDecks/DuviriEncounterRewards/DuviriSteelPathStaticUndercroftResourceRewards"
            ];
        } else if (RewardInfo.T == 15) {
            rewardManifests = [
                mission?.Tier == 1
                    ? "/Lotus/Types/Game/MissionDecks/DuviriEncounterRewards/DuviriKullervoSteelPathRNGRewards"
                    : "/Lotus/Types/Game/MissionDecks/DuviriEncounterRewards/DuviriKullervoNormalRNGRewards"
            ];
        } else if (RewardInfo.T == 70) {
            // Orowyrm chest, gives 10 Pathos Clamps, or 15 on Steel Path.
            drops.push({
                StoreItem: "/Lotus/StoreItems/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem",
                ItemCount: mission?.Tier == 1 ? 15 : 10
            });
            rewardManifests = [];
        } else {
            rewardManifests = region.rewardManifests;
        }

        let rotations: number[] = [];
        if (RewardInfo.jobId) {
            if (RewardInfo.JobStage! >= 0) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [jobType, unkIndex, hubNode, syndicateMissionId, locationTag] = RewardInfo.jobId.split("_");
                let isEndlessJob = false;
                if (syndicateMissionId) {
                    const syndicateMissions: ISyndicateMissionInfo[] = [];
                    pushClassicBounties(syndicateMissions, idToBountyCycle(syndicateMissionId));
                    const syndicateEntry = syndicateMissions.find(m => m._id.$oid === syndicateMissionId);
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
                        if (job.xpAmounts.length > 1) {
                            rotations = [RewardInfo.JobStage! % (job.xpAmounts.length - 1)];
                        } else {
                            rotations = [0];
                        }
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
                    "/Lotus/Types/Game/MissionDecks/ZarimanJobMissionRewards/TierCTableARewards", // [sic]
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
            if (RewardInfo.node == "SolNode238") {
                // The Circuit
                const category = mission?.Tier == 1 ? "EXC_HARD" : "EXC_NORMAL";
                const progress = inventory.EndlessXP?.find(x => x.Category == category);
                if (progress) {
                    // https://wiki.warframe.com/w/The%20Circuit#Tiers_and_Weekly_Rewards
                    const roundsCompleted = RewardInfo.rewardQualifications?.length || 0;
                    if (roundsCompleted >= 1) {
                        progress.Earn += 100;
                    }
                    if (roundsCompleted >= 2) {
                        progress.Earn += 110;
                    }
                    if (roundsCompleted >= 3) {
                        progress.Earn += 125;
                    }
                    if (roundsCompleted >= 4) {
                        progress.Earn += 145;
                        if (progress.BonusAvailable && progress.BonusAvailable.getTime() <= Date.now()) {
                            progress.Earn += 50;
                            progress.BonusAvailable = new Date(Date.now() + 24 * 3600_000); // TOVERIFY
                        }
                    }
                    if (roundsCompleted >= 5) {
                        progress.Earn += (roundsCompleted - 4) * 170;
                    }
                }
                tierOverride = 0;
            }
            rotations = getRotations(RewardInfo, tierOverride);
        }
        if (rewardManifests.length != 0) {
            logger.debug(`generating random mission rewards`, { rewardManifests, rotations });
        }
        if (RewardInfo.rewardSeed) {
            if (RewardInfo.rewardSeed != inventory.RewardSeed) {
                logger.warn(`RewardSeed mismatch:`, { client: RewardInfo.rewardSeed, database: inventory.RewardSeed });
            }
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
                                "/Lotus/Types/Game/MissionDecks/PurgatoryMissionRewards/PurgatoryBlueTokenRewards",
                                "/Lotus/Types/Game/MissionDecks/PurgatoryMissionRewards/PurgatoryGoldTokenRewards",
                                "/Lotus/Types/Game/MissionDecks/PurgatoryMissionRewards/PurgatoryBlackTokenRewards"
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

        if (RewardInfo.periodicMissionTag?.startsWith("KuvaMission")) {
            const drop = getRandomRewardByChance(
                ExportRewards[
                    RewardInfo.periodicMissionTag == "KuvaMission6" || RewardInfo.periodicMissionTag == "KuvaMission12"
                        ? "/Lotus/Types/Game/MissionDecks/KuvaMissionRewards/KuvaSiphonFloodRewards"
                        : "/Lotus/Types/Game/MissionDecks/KuvaMissionRewards/KuvaSiphonRewards"
                ][0]
            )!;
            drops.push({ StoreItem: drop.type, ItemCount: drop.itemCount });
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

const node_excluded_buddies: Record<string, string> = {
    SolNode856: "/Lotus/Types/Gameplay/1999Wf/Dialogue/ArthurDialogue_rom.dialogue",
    SolNode852: "/Lotus/Types/Gameplay/1999Wf/Dialogue/LettieDialogue_rom.dialogue",
    SolNode851: "/Lotus/Types/Gameplay/1999Wf/Dialogue/JabirDialogue_rom.dialogue",
    SolNode850: "/Lotus/Types/Gameplay/1999Wf/Dialogue/EleanorDialogue_rom.dialogue",
    SolNode853: "/Lotus/Types/Gameplay/1999Wf/Dialogue/AoiDialogue_rom.dialogue",
    SolNode854: "/Lotus/Types/Gameplay/1999Wf/Dialogue/QuincyDialogue_rom.dialogue"
};

const getHexBounties = (seed: number): { nodes: string[]; buddies: string[] } => {
    // We're gonna shuffle these arrays, so they're not truly 'const'.
    const nodes: string[] = [
        "SolNode850",
        "SolNode851",
        "SolNode852",
        "SolNode853",
        "SolNode854",
        "SolNode856",
        "SolNode858"
    ];
    const excludable_nodes: string[] = ["SolNode851", "SolNode852", "SolNode853", "SolNode854"];
    const buddies: string[] = [
        "/Lotus/Types/Gameplay/1999Wf/Dialogue/JabirDialogue_rom.dialogue",
        "/Lotus/Types/Gameplay/1999Wf/Dialogue/AoiDialogue_rom.dialogue",
        "/Lotus/Types/Gameplay/1999Wf/Dialogue/ArthurDialogue_rom.dialogue",
        "/Lotus/Types/Gameplay/1999Wf/Dialogue/EleanorDialogue_rom.dialogue",
        "/Lotus/Types/Gameplay/1999Wf/Dialogue/LettieDialogue_rom.dialogue",
        "/Lotus/Types/Gameplay/1999Wf/Dialogue/QuincyDialogue_rom.dialogue"
    ];

    const rng = new SRng(seed);
    rng.shuffleArray(nodes);
    rng.shuffleArray(excludable_nodes);
    while (nodes.length > buddies.length) {
        nodes.splice(
            nodes.findIndex(x => x == excludable_nodes[0]),
            1
        );
        excludable_nodes.splice(0, 1);
    }
    rng.shuffleArray(buddies);
    for (let i = 0; i != 6; ++i) {
        if (buddies[i] == node_excluded_buddies[nodes[i]]) {
            const swapIdx = (i + 1) % buddies.length;
            const tmp = buddies[swapIdx];
            buddies[swapIdx] = buddies[i];
            buddies[i] = tmp;
        }
    }
    return { nodes, buddies };
};
