import type {
    IMissionReward as IMissionRewardExternal,
    IRegion,
    IReward,
    TMissionType
} from "warframe-public-export-plus";
import {
    ExportAnimals,
    ExportEnemies,
    ExportFusionBundles,
    ExportRegions,
    ExportRelics,
    ExportRewards
} from "warframe-public-export-plus";
import type { IMissionInventoryUpdateRequest, IRewardInfo } from "../types/requestTypes.ts";
import { logger } from "../utils/logger.ts";
import type { IRngResult } from "./rngService.ts";
import { SRng, generateRewardSeed, getRandomElement, getRandomInt, getRandomReward } from "./rngService.ts";
import type { IMission, TEquipmentKey } from "../types/inventoryTypes/inventoryTypes.ts";
import { equipmentKeys } from "../types/inventoryTypes/inventoryTypes.ts";
import {
    addBooster,
    addCalendarProgress,
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
    getDialogue,
    giveNemesisPetRecipe,
    giveNemesisWeaponRecipe,
    updateCurrency,
    updateEntratiVault,
    updateSyndicate
} from "./inventoryService.ts";
import { updateQuestKey } from "./questService.ts";
import { Types } from "mongoose";
import type { IAffiliationMods, IInventoryChanges } from "../types/purchaseTypes.ts";
import {
    fromStoreItem,
    getKey,
    getLevelKeyRewards,
    getMissionDeck,
    isStoreItem,
    toStoreItem
} from "./itemDataService.ts";
import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import { getEntriesUnsafe } from "../utils/ts-utils.ts";
import { handleStoreItemAcquisition } from "./purchaseService.ts";
import type { IMissionCredits, IMissionReward, INemesisTaxInfo, IRecoveredItemInfo } from "../types/missionTypes.ts";
import { crackRelic } from "../helpers/relicHelper.ts";
import type { IMessageCreationTemplate } from "./inboxService.ts";
import { createMessage } from "./inboxService.ts";
import kuriaMessage50 from "../../static/fixed_responses/kuriaMessages/fiftyPercent.json" with { type: "json" };
import kuriaMessage75 from "../../static/fixed_responses/kuriaMessages/seventyFivePercent.json" with { type: "json" };
import kuriaMessage100 from "../../static/fixed_responses/kuriaMessages/oneHundredPercent.json" with { type: "json" };
import {
    generateNemesisProfile,
    getInfestedLichItemRewards,
    getInfNodes,
    getKillTokenRewardCount,
    getNemesisManifest,
    getNemesisPasscode,
    getNemesisTaxInfo
} from "../helpers/nemesisHelpers.ts";
import { Loadout } from "../models/inventoryModels/loadoutModel.ts";
import {
    getInvasionByOid,
    getLiteSortie,
    getSortie,
    getWorldState,
    idToBountyCycle,
    idToDay,
    idToWeek,
    pushClassicBounties
} from "./worldStateService.ts";
import { config } from "./configService.ts";
import libraryDailyTasks from "../../static/fixed_responses/libraryDailyTasks.json" with { type: "json" };
import type { IGoal, ISyndicateJob, ISyndicateMissionInfo } from "../types/worldStateTypes.ts";
import { fromOid, toObjectId, toOid2, version_compare } from "../helpers/inventoryHelpers.ts";
import type { TAccountDocument } from "./loginService.ts";
import type { ITypeCount } from "../types/commonTypes.ts";
import type { IEquipmentClient } from "../types/equipmentTypes.ts";
import { Guild } from "../models/guildModel.ts";
import { handleGuildGoalProgress } from "./guildService.ts";
import { importLoadOutConfig } from "./importService.ts";
import gameToBuildVersion from "../constants/gameToBuildVersion.ts";
import { corpusDeathSquadInfo, grineerDeathSquadInfo } from "./invasionService.ts";

const getRotations = (rewardInfo: IRewardInfo, tierOverride?: number): number[] => {
    // For Spy missions, e.g. 3 vaults cracked = A, B, C
    if (rewardInfo.VaultsCracked) {
        const rotations: number[] = [];
        for (let i = 0; i != rewardInfo.VaultsCracked; ++i) {
            rotations.push(Math.min(i, 2));
        }
        return rotations;
    }

    // For isleweaver, simply roll A & B. (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/3182)
    if (rewardInfo.T == 17 || rewardInfo.T == 19) {
        return [0, 1];
    }

    const region = ExportRegions[rewardInfo.node] as IRegion | undefined;
    const missionType: TMissionType | undefined = region?.missionType;

    // Disruption uses 'rewardTierOverrides' to tell us (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/2599)
    // Note that this may stick in lab conquest so we need to filter by mission type (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/2768)
    if (missionType == "MT_ARTIFACT") {
        return rewardInfo.rewardTierOverrides ?? [];
    }

    if (missionType == "MT_RESCUE" && rewardInfo.rewardTier !== undefined) {
        return [rewardInfo.rewardTier];
    }

    // 'rewardQualifications' may stick from previous missions for non-endless missions done after them
    // - via railjack (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/2586, https://onlyg.it/OpenWF/SpaceNinjaServer/issues/2612)
    // - via lab conquest (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/2768)
    switch (region?.missionName) {
        case "/Lotus/Language/Missions/MissionName_Railjack":
        case "/Lotus/Language/Missions/MissionName_RailjackVolatile":
        case "/Lotus/Language/Missions/MissionName_RailjackExterminate":
        case "/Lotus/Language/Missions/MissionName_RailjackAssassinate":
        case "/Lotus/Language/Missions/MissionName_Assassination":
        case "/Lotus/Language/Missions/MissionName_Exterminate":
            return [0];
    }

    const rotationCount = rewardInfo.rewardQualifications?.length || 0;

    // Empty or absent rewardQualifications should not give rewards when:
    // - Completing only 1 zone of (E)SO (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/1823)
    // - Aborting a railjack mission (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/1741)
    if (rotationCount == 0 && missionType != "MT_ENDLESS_EXTERMINATION" && missionType != "MT_RAILJACK") {
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
        if (inventoryUpdates.RewardInfo.periodicMissionTag && !inventory.alertsRepeatable) {
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
            let HenchmenKilledMultiplier = 1;
            switch (inventory.Nemesis.Faction) {
                case "FC_GRINEER":
                    HenchmenKilledMultiplier = inventory.nemesisHenchmenKillsMultiplierGrineer ?? 1;
                    break;
                case "FC_CORPUS":
                    HenchmenKilledMultiplier = inventory.nemesisHenchmenKillsMultiplierCorpus ?? 1;
                    break;
            }
            inventory.Nemesis.HenchmenKilled +=
                inventoryUpdates.RewardInfo.NemesisHenchmenKills * HenchmenKilledMultiplier;
        }
        if (inventoryUpdates.RewardInfo.NemesisHintProgress && inventory.Nemesis) {
            let HintProgressMultiplier = 1;
            switch (inventory.Nemesis.Faction) {
                case "FC_GRINEER":
                    HintProgressMultiplier = inventory.nemesisHintProgressMultiplierGrineer ?? 1;
                    break;
                case "FC_CORPUS":
                    HintProgressMultiplier = inventory.nemesisHintProgressMultiplierCorpus ?? 1;
                    break;
            }
            inventory.Nemesis.HintProgress += inventoryUpdates.RewardInfo.NemesisHintProgress * HintProgressMultiplier;
            if (inventory.Nemesis.Faction != "FC_INFESTATION" && inventory.Nemesis.Hints.length != 3) {
                const progressNeeded = [35, 60, 100][inventory.Nemesis.Hints.length];
                if (inventory.Nemesis.HintProgress >= progressNeeded) {
                    inventory.Nemesis.HintProgress -= progressNeeded;
                    const passcode = getNemesisPasscode(inventory.Nemesis);
                    inventory.Nemesis.Hints.push(passcode[inventory.Nemesis.Hints.length]);
                }
            }
        }
        if (inventoryUpdates.RewardInfo.jobId) {
            // e.g. for Profit-Taker Phase 1:
            // JobTier: -6,
            // jobId: '/Lotus/Types/Gameplay/Venus/Jobs/Heists/HeistProfitTakerBountyOne_-6_SolarisUnitedHub1_663a71c80000000000000025_EudicoHeists',
            // This is sent multiple times, with JobStage starting at 0 and incrementing each time, but only the final upload has GS_SUCCESS.

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [bounty, tier, hub, id, tag] = inventoryUpdates.RewardInfo.jobId.split("_");
            if (
                (tag == "EudicoHeists" && inventoryUpdates.MissionStatus == "GS_SUCCESS") ||
                (tag == "NokkoColony" && inventoryUpdates.RewardInfo.JobStage == 4)
            ) {
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
            logger.error(`Inventory update key ${key} has no value`);
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
                if (!(config.unfaithfulBugFixes?.ignore1999LastRegionPlayed && value === "1999MapName")) {
                    inventory.LastRegionPlayed = value;
                }
                break;
            case "RawUpgrades":
                addMods(inventory, value);
                break;
            case "MiscItems":
            case "BonusMiscItems":
                addMiscItems(inventory, value);
                break;
            case "Consumables":
                if (inventory.dontSubtractConsumables) {
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
                await addChallenges(
                    account,
                    inventory,
                    value,
                    inventoryUpdates.SeasonChallengeCompletions,
                    inventoryChanges
                );
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
                inventory.PlayerSkills.LPP_SPACE += value.LPP_SPACE ?? 0;
                inventory.PlayerSkills.LPP_DRIFTER += value.LPP_DRIFTER ?? 0;
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
                    // Really old builds (tested U7-U8) do not have the UpgradeFingerprint set for unranked mod drops
                    clientUpgrade.UpgradeFingerprint ??= "lvl=0|";
                    // U11 and below also don't initialize ItemCount since RawUpgrade doesn't exist in them
                    clientUpgrade.ItemCount ??= 1;
                    if (account.BuildLabel && version_compare(account.BuildLabel, gameToBuildVersion["18.18.0"]) < 0) {
                        // Acquired Mods have a different UpgradeFingerprint format in pre-U18.18.0 builds, this converts them to the format the database expects
                        clientUpgrade.UpgradeFingerprint = `{"lvl":${clientUpgrade.UpgradeFingerprint.substring(
                            clientUpgrade.UpgradeFingerprint.indexOf("=") + 1,
                            clientUpgrade.UpgradeFingerprint.lastIndexOf("|")
                        )}}`;
                    }
                    // Handle Fusion Core drops
                    const parsedFingerprint = JSON.parse(clientUpgrade.UpgradeFingerprint) as { lvl?: number };
                    if (parsedFingerprint.lvl) {
                        inventory.Upgrades.push({
                            ItemType: clientUpgrade.ItemType,
                            UpgradeFingerprint: clientUpgrade.UpgradeFingerprint
                        });
                    } else if (id == "") {
                        // U19 does not provide RawUpgrades and instead interleaves them with riven progress here
                        addMods(inventory, [
                            {
                                ItemType: clientUpgrade.ItemType,
                                ItemCount: clientUpgrade.ItemCount
                            }
                        ]);
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
                if (!inventory.syndicateMissionsRepeatable) {
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
                if (!inventory.noDeathMarks) {
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
                                    endDate: new Date(Date.now() + 86400_000) // TOVERIFY: This type of inbox message seems to automatically delete itself. We'll just delete it after 24 hours, but it's not clear if this is correct.
                                }
                            ]);
                        }
                    }
                    inventory.DeathMarks = value;
                }
                break;
            }
            case "KubrowPetEggs": {
                for (const egg of value) {
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
                inventory.DeathSquadable = false;
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
                // Unsure what to do with this
                break;
            }
            case "CurrentLoadOutIds": {
                if (value.LoadOuts) {
                    const loadout = await Loadout.findOne({ loadoutOwnerId: inventory.accountOwnerId });
                    if (loadout) {
                        for (const [loadoutId, loadoutConfig] of Object.entries(value.LoadOuts.NORMAL)) {
                            const loadoutConfigDatabase = importLoadOutConfig(loadoutConfig);
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
            case "GoalProgress": {
                for (const uploadProgress of value) {
                    const goal = getWorldState(account.BuildLabel).Goals.find(
                        x => x._id.$oid == uploadProgress._id.$oid
                    );
                    if (goal && goal.Personal) {
                        inventory.PersonalGoalProgress ??= [];
                        const goalProgress = inventory.PersonalGoalProgress.find(x => x.goalId.equals(goal._id.$oid));
                        if (!goalProgress) {
                            inventory.PersonalGoalProgress.push({
                                Best: uploadProgress.Best,
                                Count: uploadProgress.Count,
                                Tag: goal.Tag,
                                goalId: new Types.ObjectId(goal._id.$oid)
                            });
                        }

                        const currentNode = inventoryUpdates.RewardInfo!.node;
                        let currentMissionKey: string | undefined;
                        if (currentNode == goal.Node) {
                            currentMissionKey = goal.MissionKeyName;
                        } else if (goal.ConcurrentNodes && goal.ConcurrentMissionKeyNames) {
                            for (let i = 0; i < goal.ConcurrentNodes.length; i++) {
                                if (currentNode == goal.ConcurrentNodes[i]) {
                                    currentMissionKey = goal.ConcurrentMissionKeyNames[i];
                                    break;
                                }
                            }
                        }
                        const rewards = [];
                        let countBeforeUpload = goalProgress?.Count ?? 0;
                        let totalCount = countBeforeUpload + uploadProgress.Count;
                        if (goal.Best) {
                            countBeforeUpload = goalProgress?.Best ?? 0;
                            totalCount = uploadProgress.Best;
                        }

                        {
                            if (goal.InterimGoals && goal.InterimRewards) {
                                for (let i = 0; i < goal.InterimGoals.length; i++) {
                                    if (
                                        goal.InterimGoals[i] &&
                                        goal.InterimGoals[i] <= totalCount &&
                                        (!goalProgress || countBeforeUpload < goal.InterimGoals[i]) &&
                                        goal.InterimRewards[i]
                                    ) {
                                        rewards.push(goal.InterimRewards[i]);
                                        break;
                                    }
                                }
                            }
                            if (
                                goal.Goal &&
                                goal.Goal <= totalCount &&
                                (!goalProgress || countBeforeUpload < goal.Goal) &&
                                goal.Reward
                            ) {
                                rewards.push(goal.Reward);
                            }
                            if (
                                goal.BonusGoal &&
                                goal.BonusGoal <= totalCount &&
                                (!goalProgress || countBeforeUpload < goal.BonusGoal) &&
                                goal.BonusReward
                            ) {
                                rewards.push(goal.BonusReward);
                            }
                        }

                        const messages: IMessageCreationTemplate[] = [];
                        const infos: {
                            sndr: string;
                            msg: string;
                            sub: string;
                            icon: string;
                            arg?: string[];
                        }[] = [];

                        {
                            if (currentMissionKey && currentMissionKey in goalMessagesByKey) {
                                infos.push(goalMessagesByKey[currentMissionKey]);
                            } else if (goal.Tag in goalMessagesByTag) {
                                const combinedGoals = [...(goal.InterimGoals || []), goal.Goal, goal.BonusGoal];
                                combinedGoals.forEach((n, i) => {
                                    if (n !== undefined && n > countBeforeUpload && n <= totalCount) {
                                        infos.push(goalMessagesByTag[goal.Tag][i]);
                                    }
                                });
                            }
                        }

                        for (let i = 0; i < rewards.length; i++) {
                            if (infos[i]) {
                                const info = infos[i];
                                const reward = rewards[i];
                                const message: IMessageCreationTemplate = {
                                    sndr: info.sndr,
                                    msg: info.msg,
                                    sub: info.sub,
                                    icon: info.icon,
                                    highPriority: true
                                };
                                if (reward.items) {
                                    message.att = reward.items.map(x => (isStoreItem(x) ? fromStoreItem(x) : x));
                                }
                                if (reward.countedItems) {
                                    message.countedAtt = reward.countedItems;
                                }
                                if (reward.credits) {
                                    message.RegularCredits = reward.credits;
                                }
                                if (info.arg) {
                                    const args: Record<string, string | number> = {
                                        PLAYER_NAME: account.DisplayName,
                                        CREDIT_REWARD: reward.credits ?? 0
                                    };

                                    for (let j = 0; j < info.arg.length; j++) {
                                        const key = info.arg[j];
                                        const value = args[key];
                                        if (value) {
                                            message.arg ??= [];
                                            message.arg.push({
                                                Key: key,
                                                Tag: value
                                            });
                                        }
                                    }
                                }
                                messages.push(message);
                            }
                        }

                        if (messages.length > 0) await createMessage(inventory.accountOwnerId, messages);

                        if (goalProgress) {
                            goalProgress.Best = Math.max(goalProgress.Best!, uploadProgress.Best);
                            goalProgress.Count += uploadProgress.Count;
                        }
                    }
                    if (goal && goal.ClanGoal && inventory.GuildId) {
                        const guild = await Guild.findById(inventory.GuildId, "GoalProgress Tier VaultDecoRecipes");
                        if (guild) {
                            await handleGuildGoalProgress(guild, {
                                Count: uploadProgress.Count,
                                Tag: goal.Tag,
                                goalId: new Types.ObjectId(goal._id.$oid)
                            });
                        }
                    }
                }
                break;
            }
            case "InvasionProgress": {
                for (const clientProgress of value) {
                    if (inventory.finishInvasionsInOneMission) {
                        clientProgress.Delta *= 3;
                        clientProgress.AttackerScore *= 3;
                        clientProgress.DefenderScore *= 3;
                    }
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
                    const invasion = getInvasionByOid(clientProgress._id.$oid)!;
                    const factionSidedWith = clientProgress.AttackerScore ? invasion.Faction : invasion.DefenderFaction;
                    if (invasion.Faction != "FC_INFESTATION") {
                        const info = factionSidedWith != "FC_GRINEER" ? grineerDeathSquadInfo : corpusDeathSquadInfo;
                        if (!inventory[info.booleanKey] && !inventory.noDeathMarks) {
                            const numberKey = info.numberKey;
                            inventory[numberKey] ??= 0;
                            inventory[numberKey] += clientProgress.AttackerScore + clientProgress.DefenderScore;
                            if (inventory[numberKey] >= 5) {
                                inventory[numberKey] = 0;
                                const isRepeatMark = inventory[info.booleanKey] !== undefined;
                                inventory[info.booleanKey] = true;
                                await createMessage(inventory.accountOwnerId, [
                                    {
                                        sndr: info.inboxSender,
                                        msg: isRepeatMark ? info.inboxMessageRepeat : info.inboxMessage,
                                        sub: info.inboxTitle,
                                        icon: info.inboxIcon,
                                        highPriority: true
                                    }
                                ]);
                            }
                        }
                    }
                }
                break;
            }
            case "CalendarProgress": {
                addCalendarProgress(inventory, value);
                break;
            }
            case "duviriCaveOffers": {
                // Duviri cave offers (generated with the duviri seed) change after completing one of its game modes (not when aborting).
                if (inventoryUpdates.MissionStatus != "GS_QUIT") {
                    inventory.DuviriInfo!.Seed = generateRewardSeed();
                    inventory.DuviriInfo!.NumCompletions += 1;
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

                    const extraWeaponCheat = inventory.nemesisExtraWeapon ?? 0; // 0 means no extra weapon and token

                    if (value.killed) {
                        if (
                            value.weaponLoc &&
                            inventory.Nemesis.Faction != "FC_INFESTATION" // weaponLoc is "/Lotus/Language/Weapons/DerelictCernosName" for these for some reason
                        ) {
                            const weaponType = manifest.weapons[inventory.Nemesis.WeaponIdx];
                            giveNemesisWeaponRecipe(inventory, weaponType, value.nemesisName, value.weaponLoc, profile);
                            att.push(weaponType);
                            if (extraWeaponCheat >= 1) {
                                for (let i = 0; i < extraWeaponCheat; i++) {
                                    const randomIndex = Math.floor(Math.random() * manifest.weapons.length);
                                    const randomWeapon = manifest.weapons[randomIndex];
                                    giveNemesisWeaponRecipe(
                                        inventory,
                                        randomWeapon,
                                        value.nemesisName,
                                        undefined,
                                        profile
                                    );
                                    att.push(randomWeapon);
                                }
                            }
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
                                    ItemCount: getKillTokenRewardCount(inventory.Nemesis.fp) * (extraWeaponCheat + 1)
                                }
                            ];
                            addMiscItems(inventory, countedAtt);
                        }
                    }

                    await createMessage(inventory.accountOwnerId, [
                        {
                            sndr: value.killed ? "/Lotus/Language/Bosses/Ordis" : value.nemesisName,
                            msg: value.killed ? manifest.killMessageBody : manifest.convertMessageBody,
                            arg: [
                                {
                                    Key: "LICH_NAME",
                                    Tag: value.nemesisName
                                }
                            ],
                            att: att,
                            countedAtt: countedAtt,
                            attVisualOnly: true,
                            sub: value.killed ? manifest.killMessageSubject : manifest.convertMessageSubject,
                            icon: value.killed ? "/Lotus/Interface/Icons/Npcs/Ordis.png" : manifest.convertMessageIcon,
                            highPriority: true
                        }
                    ]);

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
    AffiliationMods: IAffiliationMods[];
    SyndicateXPItemReward?: number;
    ConquestCompletedMissionsCount?: number;
    NemesisTaxInfo?: INemesisTaxInfo;
    RecoveredItemInfo?: IRecoveredItemInfo;
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

const isEligibleForCreditReward = (rewardInfo: IRewardInfo, missions: IMission, node: IRegion): boolean => {
    // (E)SO should not give credits for only completing zone 1, in which case it has no rewardQualifications (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/1823)
    if (getRotations(rewardInfo).length == 0) {
        return missions.Tag == "SolNode720"; // Netracells don't use rewardQualifications but probably should give credits anyway
    }
    // The rest here might not be needed anymore, but just to be sure we don't give undue credits...
    return (
        node.missionType != "MT_JUNCTION" &&
        node.missionType != "MT_LANDSCAPE" &&
        missions.Tag != "SolNode761" && // the index
        missions.Tag != "SolNode762" && // the index
        missions.Tag != "SolNode763" && // the index
        missions.Tag != "CrewBattleNode556" // free flight
    );
};

//TODO: return type of partial missioninventoryupdate response
export const addMissionRewards = async (
    account: TAccountDocument,
    inventory: TInventoryDatabaseDocument,
    {
        wagerTier: wagerTier,
        Nemesis: nemesis,
        NemesisKillConvert: NemesisKillConvert,
        RewardInfo: rewardInfo,
        LevelKeyName: levelKeyName,
        Missions: missions,
        Alerts: alerts,
        RegularCredits: creditDrops,
        VoidTearParticipantsCurrWave: voidTearWave,
        StrippedItems: strippedItems,
        AffiliationChanges: AffiliationMods,
        InvasionProgress: invasionProgress,
        EndOfMatchUpload: endOfMatchUpload,
        GoalTag: goalTag,
        ChallengeInstanceStates: challengeInstanceStates
    }: IMissionInventoryUpdateRequest,
    firstCompletion: boolean
): Promise<AddMissionRewardsReturnType> => {
    AffiliationMods ??= [];

    if (!rewardInfo) {
        //TODO: if there is a case where you can have credits collected during a mission but no rewardInfo, add credits needs to be handled earlier
        if (missions?.Tag) {
            logger.debug(`Mission ${missions.Tag} did not have Reward Info `);
        }
        return { MissionRewards: [], AffiliationMods };
    }

    //TODO: check double reward merging
    const MissionRewards: IMissionReward[] = getRandomMissionDrops(
        account,
        inventory,
        rewardInfo,
        levelKeyName,
        missions,
        wagerTier,
        firstCompletion
    );
    logger.debug("random mission drops:", MissionRewards);
    const inventoryChanges: IInventoryChanges = {};
    const isSteelPath = missions?.Tier || alerts?.Tier;
    let SyndicateXPItemReward;
    let ConquestCompletedMissionsCount;

    let missionCompletionCredits = 0;

    if (rewardInfo.alertId) {
        const alert = getWorldState(account.BuildLabel).Alerts.find(x => x._id.$oid == rewardInfo.alertId);
        if (!alert) {
            logger.warn(`mission completed unknown alert`, { alertId: rewardInfo.alertId });
        } else {
            if (inventory.CompletedAlerts.includes(alert._id.$oid)) {
                logger.debug(`alert ${alert._id.$oid} already completed, skipping alert reward`);
            } else {
                if (!inventory.alertsRepeatable) {
                    inventory.CompletedAlerts.push(alert._id.$oid);
                }
                if (alert.MissionInfo.missionReward) {
                    if (alert.Tag && ["12MinWarEvent", "JadeShadows"].includes(alert.Tag) && isSteelPath) {
                        if (alert.MissionInfo.missionReward.countedItems) {
                            alert.MissionInfo.missionReward.countedItems.forEach(item => {
                                item.ItemCount *= 1.5;
                            });
                        }
                    }
                    missionCompletionCredits += addFixedLevelRewards(
                        alert.MissionInfo.missionReward,
                        MissionRewards,
                        rewardInfo
                    );
                }
            }
        }
    }

    //inventory change is what the client has not rewarded itself, also the client needs to know the credit changes for display

    if (invasionProgress) {
        for (const clientProgress of invasionProgress) {
            const dbProgress = inventory.QualifyingInvasions.find(x => x.invasionId.equals(clientProgress._id.$oid));
            if (dbProgress) {
                const run =
                    (clientProgress.AttackerScore > clientProgress.DefenderScore
                        ? dbProgress.AttackerScore
                        : dbProgress.DefenderScore) - 1;
                missionCompletionCredits += 1000 * Math.min(run, 10);
            }
        }
    }

    if (rewardInfo.goalId) {
        const goal = getWorldState(account.BuildLabel).Goals.find(x => x._id.$oid == rewardInfo.goalId);
        if (goal) {
            if (rewardInfo.node == goal.Node && goal.MissionKeyName) levelKeyName = goal.MissionKeyName;
            if (goal.ConcurrentNodes && goal.ConcurrentMissionKeyNames) {
                for (let i = 0; i < goal.ConcurrentNodes.length && i < goal.ConcurrentMissionKeyNames.length; i++) {
                    if (rewardInfo.node == goal.ConcurrentNodes[i]) {
                        levelKeyName = goal.ConcurrentMissionKeyNames[i];
                        break;
                    }
                }
            }
            if (rewardInfo.GoalProgressAmount && goal.Tag.startsWith("MechSurvival")) {
                MissionRewards.push({
                    StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/MechSurvivalEventCreds",
                    ItemCount: Math.trunc(rewardInfo.GoalProgressAmount / 10)
                });
            }
        }
    }

    if (goalTag && goalTag == "12MinWarEvent") {
        if (["SolNode250", "SolNode251", "SolNode252"].includes(rewardInfo.node)) {
            MissionRewards.push({
                StoreItem: "/Lotus/StoreItems/Types/Gameplay/Tau/Resources/TwelveResourceCurrencyItem",
                ItemCount: getRandomInt(8, 15) + (missions?.Tier ? 2 : 0)
            });
        }
    }

    if (levelKeyName) {
        const fixedLevelRewards = getLevelKeyRewards(levelKeyName, account.BuildLabel);
        //logger.debug(`fixedLevelRewards ${fixedLevelRewards}`);
        if (fixedLevelRewards.levelKeyRewards) {
            missionCompletionCredits += addFixedLevelRewards(
                fixedLevelRewards.levelKeyRewards,
                MissionRewards,
                rewardInfo
            );
        }
        if (fixedLevelRewards.levelKeyRewards2) {
            for (const reward of fixedLevelRewards.levelKeyRewards2) {
                //quest stage completion credit rewards
                if (reward.rewardType == "RT_CREDITS") {
                    missionCompletionCredits += reward.amount;
                    continue;
                }
                MissionRewards.push({
                    StoreItem: reward.itemType,
                    ItemCount: reward.rewardType === "RT_RESOURCE" ? reward.amount : 1
                });
            }
        }
        if (fixedLevelRewards.levelMission) {
            const levelCreditReward = getLevelCreditRewards(fixedLevelRewards.levelMission);
            if (levelCreditReward) {
                missionCompletionCredits += levelCreditReward;
                logger.debug(`levelCreditReward ${levelCreditReward}`);
            }
        }
    }

    // ignoring tags not in ExportRegions, because it can just be garbage:
    // - https://onlyg.it/OpenWF/SpaceNinjaServer/issues/1013
    // - https://onlyg.it/OpenWF/SpaceNinjaServer/issues/1365
    if (missions && missions.Tag in ExportRegions) {
        const node = ExportRegions[missions.Tag];

        //node based credit rewards for mission completion
        if (isEligibleForCreditReward(rewardInfo, missions, node)) {
            const levelCreditReward = getLevelCreditRewards(node);
            if (levelCreditReward) {
                missionCompletionCredits += levelCreditReward;
                logger.debug(`levelCreditReward ${levelCreditReward}`);
            }
        }

        if (node.missionReward) {
            missionCompletionCredits += addFixedLevelRewards(node.missionReward, MissionRewards, rewardInfo);
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

    if (voidTearWave && voidTearWave.Participants[0].QualifiesForReward) {
        if (!voidTearWave.Participants[0].HaveRewardResponse) {
            // non-endless fissure; giving reward now
            const reward = await crackRelic(inventory, voidTearWave.Participants[0], inventoryChanges);
            MissionRewards.push({ StoreItem: reward.type, ItemCount: reward.itemCount });
        } else if (inventory.MissionRelicRewards) {
            // endless fissure; already gave reward(s) but should still show in EOM screen
            for (const reward of inventory.MissionRelicRewards) {
                MissionRewards.push({
                    StoreItem: reward.ItemType,
                    ItemCount: reward.ItemCount
                });
            }
            inventory.MissionRelicRewards = undefined;
        }
    }

    let nodeControlledByNemesis = false;
    if (inventory.Nemesis) {
        nodeControlledByNemesis = inventory.Nemesis.InfNodes.some(obj => obj.Node == rewardInfo.node);

        if (nemesis || (inventory.Nemesis.Faction == "FC_INFESTATION" && nodeControlledByNemesis)) {
            inventoryChanges.Nemesis ??= {};
            const nodeIndex = inventory.Nemesis.InfNodes.findIndex(obj => obj.Node === rewardInfo.node);
            if (nodeIndex !== -1) inventory.Nemesis.InfNodes.splice(nodeIndex, 1);

            if (inventory.Nemesis.InfNodes.length <= 0) {
                const manifest = getNemesisManifest(inventory.Nemesis.manifest);
                if (inventory.Nemesis.Faction != "FC_INFESTATION") {
                    inventory.Nemesis.Rank = Math.min(inventory.Nemesis.Rank + 1, manifest.systemIndexes.length - 1);
                    inventoryChanges.Nemesis.Rank = inventory.Nemesis.Rank;
                }
                inventory.Nemesis.InfNodes = getInfNodes(manifest, inventory.Nemesis.Rank);
            }

            if (inventory.Nemesis.Faction == "FC_INFESTATION") {
                inventory.Nemesis.MissionCount += 1;
                let antivirusGain = 5;
                antivirusGain *= inventory.nemesisAntivirusGainMultiplier ?? 1;
                inventory.Nemesis.HenchmenKilled = Math.min(inventory.Nemesis.HenchmenKilled + antivirusGain, 95); // 5 progress per mission until 95

                inventoryChanges.Nemesis.MissionCount ??= 0;
                inventoryChanges.Nemesis.MissionCount += 1;
                inventoryChanges.Nemesis.HenchmenKilled ??= 0;
                inventoryChanges.Nemesis.HenchmenKilled = inventory.Nemesis.HenchmenKilled;
            }

            inventoryChanges.Nemesis.InfNodes = inventory.Nemesis.InfNodes;
        }
    }

    if (rewardInfo.JobStage != undefined && rewardInfo.jobId) {
        const result = getSyndicateJob(rewardInfo, account.BuildLabel);
        if (result) {
            const currentJob = result.currentJob;
            const syndicateTag = result.syndicateTag;
            if (syndicateTag === "EntratiSyndicate") {
                let medallionAmount = Math.floor(currentJob.xpAmounts[rewardInfo.JobStage] / (rewardInfo.Q ? 0.8 : 1));
                if (currentJob.endless) {
                    const index = rewardInfo.JobStage % currentJob.xpAmounts.length;
                    const excess = Math.floor(rewardInfo.JobStage / (currentJob.xpAmounts.length - 1));
                    medallionAmount = Math.floor(currentJob.xpAmounts[index] * (1 + 0.15000001 * excess));
                }
                if (!isNaN(medallionAmount)) {
                    MissionRewards.push({
                        StoreItem: "/Lotus/StoreItems/Types/Items/Deimos/EntratiFragmentUncommonB",
                        ItemCount: medallionAmount
                    });
                    SyndicateXPItemReward = medallionAmount;
                    logger.debug(
                        `Giving ${medallionAmount} medallions for the ${rewardInfo.JobStage} stage of the ${rewardInfo.JobTier} tier bounty`
                    );
                } else {
                    logger.warning(
                        `${currentJob.jobType} tried to give ${medallionAmount} medallions for the ${rewardInfo.JobStage} stage of the ${rewardInfo.JobTier} tier bounty`
                    );
                    logger.warning(`currentJob`, { currentJob: currentJob });
                }
            } else if (!currentJob.jobType!.startsWith("/Lotus/Types/Gameplay/NokkoColony/Jobs")) {
                const xpAmount =
                    rewardInfo.JobStage < currentJob.xpAmounts.length
                        ? currentJob.xpAmounts[rewardInfo.JobStage]
                        : currentJob.xpAmounts[0];
                if (rewardInfo.JobStage >= currentJob.xpAmounts.length) {
                    logger.debug(`xpAmount for stage ${rewardInfo.JobStage} is out of bounds, fallback to ${xpAmount}`);
                }
                addStanding(inventory, syndicateTag, Math.floor(xpAmount / (rewardInfo.Q ? 0.8 : 1)), AffiliationMods);
            }
        }
    }

    if (rewardInfo.missionType == "MT_DESCENT") {
        inventory.DescentRewards ??= [];
        const entry = inventory.DescentRewards.find(x => x.Category == (isSteelPath ? "DM_COH_HARD" : "DM_COH_NORMAL"));
        if (!entry) {
            throw new Error(`Missing DescentRewards entry`);
        }
        logger.debug(`completed ${rewardInfo.EncounterEnemyLevel} ${entry.Category} floor`);
        if (rewardInfo.EncounterEnemyLevel && rewardInfo.EncounterEnemyLevel > entry.FloorClaimed) {
            entry.FloorClaimed = rewardInfo.EncounterEnemyLevel;
            const reward = entry.PendingRewards.find(x => x.FloorCheckpoint == rewardInfo.EncounterEnemyLevel);
            if (reward) {
                logger.debug(`giving ${entry.Category} floor ${rewardInfo.EncounterEnemyLevel} reward`, {
                    reward: reward.Rewards
                });
                MissionRewards.push(...reward.Rewards);
            }
        }
    }

    if (rewardInfo.challengeMissionId) {
        const [syndicateTag, tierStr, chemistryBuddyStr] = rewardInfo.challengeMissionId.split("_");
        const tier = Number(tierStr);
        const chemistryBuddy = Number(chemistryBuddyStr);
        if (syndicateTag === "ZarimanSyndicate") {
            let medallionAmount = tier + 1;
            if (isSteelPath) medallionAmount = Math.round(medallionAmount * 1.5);
            MissionRewards.push({
                StoreItem: "/Lotus/StoreItems/Types/Gameplay/Zariman/Resources/ZarimanDogTagBounty",
                ItemCount: medallionAmount
            });
            SyndicateXPItemReward = medallionAmount;
            logger.debug(`Giving ${medallionAmount} medallions for the ${tier} tier bounty`);
        } else {
            let standingAmount = (tier + 1) * 1000;
            if (tier > 5) standingAmount = 7500; // InfestedLichBounty
            if (isSteelPath) standingAmount *= 1.5;
            addStanding(inventory, syndicateTag, standingAmount, AffiliationMods);
        }
        if (syndicateTag == "HexSyndicate" && tier < 6) {
            const buddy = chemistryBuddies[chemistryBuddy];
            const dialogue = getDialogue(inventory, buddy);
            if (Date.now() >= dialogue.BountyChemExpiry.getTime()) {
                logger.debug(`Giving 20 chemistry for ${buddy}`);
                const tomorrowAt0Utc = inventory.noKimCooldowns
                    ? Date.now()
                    : (Math.trunc(Date.now() / 86400_000) + 1) * 86400_000;
                dialogue.Chemistry += 20;
                dialogue.BountyChemExpiry = new Date(tomorrowAt0Utc);
            } else {
                logger.debug(`Already got today's chemistry for ${buddy}`);
            }
        }
        if (isSteelPath) {
            MissionRewards.push({
                StoreItem: "/Lotus/StoreItems/Types/Items/MiscItems/SteelEssence",
                ItemCount: 1
            });
        }
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

    inventory.RegularCredits += missionCompletionCredits;

    const credits = await addCredits(account, inventory, {
        missionCompletionCredits,
        missionDropCredits: creditDrops ?? 0,
        rngRewardCredits: inventoryChanges.RegularCredits ?? 0
    });

    const NemesisTaxInfo: INemesisTaxInfo | undefined = nodeControlledByNemesis
        ? getNemesisTaxInfo(inventory.Nemesis!)
        : undefined;
    if (NemesisTaxInfo) {
        const taxedCredits = Math.round(credits.TotalCredits[0] * NemesisTaxInfo.TaxRate);
        NemesisTaxInfo.TaxedCredits = taxedCredits;
        inventory.RegularCredits -= taxedCredits;
        inventoryChanges.RegularCredits ??= 0;
        inventoryChanges.RegularCredits -= taxedCredits;
        credits.TotalCredits[1] -= taxedCredits;
        inventory.NemesisTaxedCredits ??= 0;
        inventory.NemesisTaxedCredits += taxedCredits;
    }

    const RecoveredItemInfo: IRecoveredItemInfo | undefined = NemesisKillConvert
        ? { RecoveredMiscItems: [] }
        : undefined;
    if (RecoveredItemInfo) {
        if (inventory.NemesisTaxedCredits) {
            RecoveredItemInfo.RecoveredCredits = inventory.NemesisTaxedCredits;
            inventory.RegularCredits += inventory.NemesisTaxedCredits;
            inventoryChanges.RegularCredits ??= 0;
            inventoryChanges.RegularCredits += inventory.NemesisTaxedCredits;
            credits.TotalCredits[0] += inventory.NemesisTaxedCredits;
            credits.TotalCredits[1] += inventory.NemesisTaxedCredits;
            credits.CreditsBonus[0] += inventory.NemesisTaxedCredits;
            credits.CreditsBonus[1] += inventory.NemesisTaxedCredits;
            inventory.NemesisTaxedCredits = undefined;
        }
    }

    if (strippedItems) {
        if (endOfMatchUpload) {
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
                // e.g. H-09 Apex Turret Sumdali
                if (si.DROP_MISC_ITEM) {
                    const resourceDroptable = droptables.find(x => x.type == "resource");
                    if (resourceDroptable) {
                        for (let i = 0; i != si.DROP_MISC_ITEM.length; ++i) {
                            const reward = getRandomReward(resourceDroptable.items)!;
                            logger.debug(`stripped droptable (resources pool) rolled`, reward);
                            if (Object.keys(await addItem(inventory, reward.type)).length == 0) {
                                logger.debug(`item already owned, skipping`);
                            } else {
                                MissionRewards.push({
                                    StoreItem: toStoreItem(reward.type),
                                    ItemCount: 1,
                                    FromEnemyCache: true // to show "identified"
                                });
                            }
                        }
                    } else {
                        logger.error(`unknown droptable ${si.DropTable} for DROP_MISC_ITEM`);
                    }
                }

                if (si.DropTable == "/Lotus/Types/DropTables/ContainerDropTables/VoidVaultMissionRewardsDropTable") {
                    // Consume netracells search pulse; only when the container reward was picked up. Discussed in https://onlyg.it/OpenWF/SpaceNinjaServer/issues/2673
                    updateEntratiVault(inventory);
                    inventory.EntratiVaultCountLastPeriod! += 1;
                }
            }
        } else {
            logger.debug(`ignoring StrippedItems in intermediate inventory update, deferring until extraction`);
        }
    }

    if (challengeInstanceStates) {
        inventory.ChallengeInstanceStates ??= [];
        for (const challenge of challengeInstanceStates) {
            const inventoryState = inventory.ChallengeInstanceStates.find(
                c => toOid2(c._id, account.BuildLabel) == challenge.id
            );
            if (inventoryState) {
                inventoryState.Progress = challenge.Progress;
                inventoryState.IsRewardCollected = challenge.IsRewardCollected;
            } else {
                inventory.ChallengeInstanceStates.push({
                    params: challenge.params,
                    Progress: challenge.Progress,
                    IsRewardCollected: challenge.IsRewardCollected,
                    _id: toObjectId(fromOid(challenge.id))
                });
            }
        }
    }

    return {
        inventoryChanges,
        MissionRewards,
        credits,
        AffiliationMods,
        SyndicateXPItemReward,
        ConquestCompletedMissionsCount,
        NemesisTaxInfo,
        RecoveredItemInfo
    };
};

export const addCredits = async (
    account: TAccountDocument,
    inventory: TInventoryDatabaseDocument,
    {
        missionDropCredits,
        missionCompletionCredits,
        rngRewardCredits
    }: { missionDropCredits: number; missionCompletionCredits: number; rngRewardCredits: number }
): Promise<IMissionCredits> => {
    const finalCredits: IMissionCredits = {
        MissionCredits: [missionDropCredits, missionDropCredits],
        CreditsBonus: [missionCompletionCredits, missionCompletionCredits],
        TotalCredits: [0, 0]
    };

    const today = Math.trunc(Date.now() / 86400000) * 86400;
    if (account.DailyFirstWinDate != today) {
        account.DailyFirstWinDate = today;
        await account.save();

        logger.debug(`daily first win, doubling missionCompletionCredits (${missionCompletionCredits})`);

        finalCredits.DailyMissionBonus = true;
        inventory.RegularCredits += missionCompletionCredits;
        finalCredits.CreditsBonus[1] *= 2;
    }

    const totalCredits = finalCredits.MissionCredits[1] + finalCredits.CreditsBonus[1] + rngRewardCredits;
    finalCredits.TotalCredits = [totalCredits, totalCredits];

    if (config.worldState?.creditBoost) {
        inventory.RegularCredits += finalCredits.TotalCredits[1];
        finalCredits.TotalCredits[1] += finalCredits.TotalCredits[1];
    }
    const now = Math.trunc(Date.now() / 1000); // TOVERIFY: Should we maybe subtract mission time as to apply credit boosters that expired during mission?
    if ((inventory.Boosters.find(x => x.ItemType == "/Lotus/Types/Boosters/CreditBooster")?.ExpiryDate ?? 0) > now) {
        inventory.RegularCredits += finalCredits.TotalCredits[1];
        finalCredits.TotalCredits[1] += finalCredits.TotalCredits[1];
    }
    if ((inventory.Boosters.find(x => x.ItemType == "/Lotus/Types/Boosters/CreditBlessing")?.ExpiryDate ?? 0) > now) {
        inventory.RegularCredits += finalCredits.TotalCredits[1] * 0.25;
        finalCredits.TotalCredits[1] += finalCredits.TotalCredits[1] * 0.25;
    }

    return finalCredits;
};

export const addFixedLevelRewards = (
    rewards: IMissionRewardExternal,
    MissionRewards: IMissionReward[],
    rewardInfo?: IRewardInfo
): number => {
    let missionBonusCredits = 0;
    if (rewards.credits) {
        missionBonusCredits += rewards.credits;
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
                StoreItem: toStoreItem(item.ItemType),
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
        const metaDroptable = getMissionDeck(rewards.droptable);
        if (metaDroptable) {
            const rotations: number[] = rewardInfo ? getRotations(rewardInfo) : [0];
            logger.debug(`rolling ${rewards.droptable} for level key rewards`, { rotations });
            for (const tier of rotations) {
                const reward = getRandomRewardByChance(metaDroptable[tier]);
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

function getLevelCreditRewards(node: Partial<IRegion>): number | undefined {
    if (node.minEnemyLevel) return 1000 + (node.minEnemyLevel - 1) * 100;
    return undefined;

    //TODO: get dark sektor fixed credit rewards and railjack bonus
}

function getRandomMissionDrops(
    account: TAccountDocument,
    inventory: TInventoryDatabaseDocument,
    RewardInfo: IRewardInfo,
    levelKeyName: string | undefined,
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
        } else if (RewardInfo.invasionId && region.missionType == "MT_ASSASSINATION") {
            // Invasion assassination has Phorid has the boss who should drop Nyx parts
            // TODO: Check that the invasion faction is indeed FC_INFESTATION once the Invasions in worldState are more dynamic
            rewardManifests = ["/Lotus/Types/Game/MissionDecks/BossMissionRewards/NyxRewards"];
        } else if (RewardInfo.sortieId) {
            // Sortie mission types differ from the underlying node and hence also don't give rewards from the underlying nodes.
            // Assassinations in non-lite sorties are an exception to this.
            if (region.missionType == "MT_ASSASSINATION") {
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
        } else if (RewardInfo.T == 17) {
            if (mission?.Tier == 1) {
                logger.warn(`non-steel path duviri murmur tier used on steel path?!`);
            }
            if (config.worldState?.eightClaw) {
                drops.push({
                    StoreItem: "/Lotus/StoreItems/Types/Gameplay/DuviriMITW/Resources/DuviriMurmurItemEvent",
                    ItemCount: 10
                });
            }
            drops.push({
                StoreItem: "/Lotus/StoreItems/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem",
                ItemCount: 10
            });
            rewardManifests = ["/Lotus/Types/Game/MissionDecks/DuviriEncounterRewards/DuviriMurmurFinalChestRewards"];
        } else if (RewardInfo.T == 19) {
            if (config.worldState?.eightClaw) {
                drops.push({
                    StoreItem: "/Lotus/StoreItems/Types/Gameplay/DuviriMITW/Resources/DuviriMurmurItemEvent",
                    ItemCount: 15
                });
            }
            drops.push({
                StoreItem: "/Lotus/StoreItems/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem",
                ItemCount: 15
            });
            rewardManifests = [
                "/Lotus/Types/Game/MissionDecks/DuviriEncounterRewards/DuviriMurmurFinalSteelChestRewards"
            ];
        } else if (
            RewardInfo.T == 70 ||
            RewardInfo.T == 6 // https://onlyg.it/OpenWF/SpaceNinjaServer/issues/2526
        ) {
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
        if (RewardInfo.jobId && RewardInfo.JobStage! >= 0) {
            const result = getSyndicateJob(RewardInfo, account.BuildLabel);

            if (result) {
                const currentJob = result.currentJob;
                const jobType = currentJob.jobType!;
                if (currentJob.rewards != "") rewardManifests = [currentJob.rewards];
                if (currentJob.xpAmounts.length > 1) {
                    const curentStage = RewardInfo.JobStage! + 1;
                    const totalStage = currentJob.xpAmounts.length;
                    let tableIndex = 1; // Stage 2, Stage 3 of 4, and Stage 3 of 5

                    if (curentStage == 1) {
                        tableIndex = 0;
                    } else if (curentStage == totalStage) {
                        tableIndex = 3;
                    } else if (totalStage == 5 && curentStage == 4) {
                        tableIndex = 2;
                    }

                    if (jobType.startsWith("/Lotus/Types/Gameplay/NokkoColony/Jobs/NokkoJob")) {
                        if (RewardInfo.JobStage === currentJob.xpAmounts.length - 1) {
                            rotations = [0, 1, 2];
                        } else {
                            rewardManifests = [];
                        }
                    } else {
                        rotations = [tableIndex];
                    }
                } else {
                    rotations = [0];
                }
                if (jobType == "/Lotus/Types/Gameplay/Eidolon/Jobs/NewbieJob") {
                    rotations = [3];
                    if (RewardInfo.Q) rotations.push(3);
                } else if (
                    RewardInfo.Q &&
                    (RewardInfo.JobStage === currentJob.xpAmounts.length - 1 || jobType.endsWith("VaultBounty")) &&
                    !jobType.startsWith("/Lotus/Types/Gameplay/NokkoColony/Jobs/NokkoJob") &&
                    !jobType.startsWith("/Lotus/Types/Gameplay/Venus/Jobs/Heists/") &&
                    !currentJob.endless
                ) {
                    rotations.push(ExportRewards[currentJob.rewards].length - 1);
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
        // Disabling this warning because the inventory reward seed is only what is used when matchmaking is set to solo.
        /*if (RewardInfo.rewardSeed) {
            if (RewardInfo.rewardSeed != inventory.RewardSeed) {
                logger.warn(`RewardSeed mismatch:`, { client: RewardInfo.rewardSeed, database: inventory.RewardSeed });
            }
        }*/
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

        // Railjack Abandoned Cache Rewards, Rotation A (Mandatory Objectives)
        if (RewardInfo.POICompletions) {
            if (region.cacheRewardManifest) {
                const deck = ExportRewards[region.cacheRewardManifest];
                for (let cache = 0; cache != RewardInfo.POICompletions; ++cache) {
                    const drop = getRandomRewardByChance(deck[0]);
                    if (drop) {
                        drops.push({ StoreItem: drop.type, ItemCount: drop.itemCount, FromEnemyCache: true });
                    }
                }
            } else {
                logger.error(`POI completed, but there was no cache reward manifest at ${RewardInfo.node}`);
            }
        }

        // Railjack Abandoned Cache Rewards, Rotation B (Optional Objectives)
        if (RewardInfo.LootDungeonCompletions) {
            if (region.cacheRewardManifest) {
                const deck = ExportRewards[region.cacheRewardManifest];
                for (let cache = 0; cache != RewardInfo.LootDungeonCompletions; ++cache) {
                    const drop = getRandomRewardByChance(deck[1]);
                    if (drop) {
                        drops.push({ StoreItem: drop.type, ItemCount: drop.itemCount, FromEnemyCache: true });
                    }
                }
            } else {
                logger.error(`Loot dungeon completed, but there was no cache reward manifest at ${RewardInfo.node}`);
            }
        }

        if (region.cacheRewardManifest && RewardInfo.EnemyCachesFound && !RewardInfo.goalId) {
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

            if (region.missionType == "MT_RESCUE" && RewardInfo.rewardTier) {
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

    if (RewardInfo.EnemyCachesFound) {
        if (RewardInfo.goalId) {
            const goal = getWorldState(account.BuildLabel).Goals.find(x => x._id.$oid == RewardInfo.goalId);
            if (goal) {
                let currentMissionKey: string | undefined;
                if (RewardInfo.node == goal.Node) {
                    currentMissionKey = goal.MissionKeyName;
                } else if (goal.ConcurrentNodes && goal.ConcurrentMissionKeyNames) {
                    for (let i = 0; i < goal.ConcurrentNodes.length; i++) {
                        if (RewardInfo.node == goal.ConcurrentNodes[i]) {
                            currentMissionKey = goal.ConcurrentMissionKeyNames[i];
                            break;
                        }
                    }
                }
                if (currentMissionKey) {
                    const keyMeta = getKey(currentMissionKey);
                    if (!keyMeta) {
                        logger.error(`unknown levelKey ${currentMissionKey} while proccesing EnemyCachesFound`);
                    } else if (keyMeta.cacheRewardManifest) {
                        const deck = getMissionDeck(keyMeta.cacheRewardManifest);
                        if (!deck) {
                            logger.error(
                                `unknown droptable ${keyMeta.cacheRewardManifest} while proccesing EnemyCachesFound`
                            );
                        } else {
                            for (let rotation = 0; rotation != RewardInfo.EnemyCachesFound; ++rotation) {
                                const drop = getRandomRewardByChance(deck[rotation]);
                                if (drop) {
                                    drops.push({
                                        StoreItem: drop.type,
                                        ItemCount: drop.itemCount,
                                        FromEnemyCache: true
                                    });
                                }
                            }
                        }
                    }
                }
            }
        } else if (RewardInfo.alertId) {
            const alert = getWorldState(account.BuildLabel).Alerts.find(x => x._id.$oid == RewardInfo.alertId);
            if (alert && alert.MissionInfo.enemyCacheOverride) {
                const deck = ExportRewards[alert.MissionInfo.enemyCacheOverride];
                for (let rotation = 0; rotation != RewardInfo.EnemyCachesFound; ++rotation) {
                    const drop = getRandomRewardByChance(deck[rotation]);
                    if (drop) {
                        drops.push({
                            StoreItem: drop.type,
                            ItemCount: drop.itemCount,
                            FromEnemyCache: true
                        });
                    }
                }
            }
        } else if (levelKeyName) {
            const keyMeta = getKey(levelKeyName);
            if (!keyMeta) {
                logger.error(`unknown levelKey ${levelKeyName} while proccesing EnemyCachesFound`);
            } else if (keyMeta.cacheRewardManifest) {
                const deck = getMissionDeck(keyMeta.cacheRewardManifest);
                if (!deck) {
                    logger.error(`unknown droptable ${keyMeta.cacheRewardManifest} while proccesing EnemyCachesFound`);
                } else {
                    for (let rotation = 0; rotation != RewardInfo.EnemyCachesFound; ++rotation) {
                        const drop = getRandomRewardByChance(deck[rotation]);
                        if (drop) {
                            drops.push({
                                StoreItem: drop.type,
                                ItemCount: drop.itemCount,
                                FromEnemyCache: true
                            });
                        }
                    }
                }
            }
        }
    }

    if (inventory.missionsCanGiveAllRelics) {
        for (const drop of drops) {
            const itemType = fromStoreItem(drop.StoreItem);
            if (itemType in ExportRelics) {
                const relic = ExportRelics[itemType];
                const replacement = getRandomElement(
                    Object.entries(ExportRelics).filter(
                        arr => arr[1].era == relic.era && arr[1].quality == relic.quality
                    )
                )!;
                logger.debug(`replacing ${relic.era} ${relic.category} with ${replacement[1].category}`);
                drop.StoreItem = toStoreItem(replacement[0]);
            }
        }
    }

    return drops;
}

export const handleConservation = (
    inventory: TInventoryDatabaseDocument,
    missionReport: IMissionInventoryUpdateRequest,
    AffiliationMods: IAffiliationMods[]
): void => {
    if (missionReport.CapturedAnimals) {
        for (const capturedAnimal of missionReport.CapturedAnimals) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            const meta = ExportAnimals[capturedAnimal.AnimalType]?.conservation;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (meta) {
                if (capturedAnimal.NumTags) {
                    addMiscItems(inventory, [
                        {
                            ItemType: meta.itemReward,
                            ItemCount: capturedAnimal.NumTags * capturedAnimal.Count
                        }
                    ]);
                }
                if (capturedAnimal.NumExtraRewards) {
                    if (meta.woundedAnimalReward) {
                        addMiscItems(inventory, [
                            {
                                ItemType: meta.woundedAnimalReward,
                                ItemCount: capturedAnimal.NumExtraRewards * capturedAnimal.Count
                            }
                        ]);
                    } else {
                        logger.warn(
                            `client attempted to claim unknown extra rewards for conservation of ${capturedAnimal.AnimalType}`
                        );
                    }
                }
                if (meta.standingReward) {
                    addStanding(
                        inventory,
                        missionReport.Missions!.Tag == "SolNode129" ? "SolarisSyndicate" : "CetusSyndicate",
                        [2, 1.5, 1][capturedAnimal.CaptureRating] * meta.standingReward * capturedAnimal.Count,
                        AffiliationMods
                    );
                }
            } else {
                logger.warn(`ignoring conservation of unknown AnimalType: ${capturedAnimal.AnimalType}`);
            }
        }
    }
};

const getSyndicateJob = (
    rewardInfo: IRewardInfo,
    buildLabel?: string
): { currentJob: ISyndicateJob; syndicateTag: string } | undefined => {
    if (!rewardInfo.jobId) return;

    const parts = rewardInfo.jobId.split("_");
    const jobType = parts[0];
    const syndicateMissionId = parts.find(p => p.length === 24);
    let syndicateTag = parts.find(p => p.endsWith("Syndicate"));

    const isGoalJob = [
        "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/InfestedPlainsBounty",
        "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/GhoulAlertBounty"
    ].some(prefix => jobType.startsWith(prefix));

    let syndicateEntry: ISyndicateMissionInfo | IGoal | undefined;
    if (isGoalJob) {
        syndicateEntry = getWorldState(buildLabel).Goals.find(g => g._id.$oid === syndicateMissionId);
        if (syndicateEntry) syndicateTag = syndicateEntry.JobAffiliationTag!;
    } else if (syndicateMissionId) {
        const syndicateMissions: ISyndicateMissionInfo[] = [];
        pushClassicBounties(syndicateMissions, idToBountyCycle(syndicateMissionId), buildLabel);
        syndicateEntry = syndicateMissions.find(m => m._id.$oid == syndicateMissionId);
        if (syndicateEntry) syndicateTag = syndicateEntry.Tag;
    }

    if (jobType.endsWith("Hunts/AllTeralystsHunt") && rewardInfo.JobStage == 2) {
        return {
            currentJob: {
                jobType,
                rewards: "",
                minEnemyLevel: 20,
                maxEnemyLevel: 40,
                xpAmounts: [5000]
            },
            syndicateTag: "CetusSyndicate"
        };
    } else if (jobType.endsWith("Hunts/TeralystHunt")) {
        return {
            currentJob: {
                jobType,
                rewards: "",
                minEnemyLevel: 20,
                maxEnemyLevel: 40,
                xpAmounts: [1000]
            },
            syndicateTag: "CetusSyndicate"
        };
    } else if (jobType.endsWith("Jobs/NewbieJob")) {
        return {
            currentJob: {
                jobType,
                rewards: "/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierATableARewards",
                minEnemyLevel: 3,
                maxEnemyLevel: 5,
                xpAmounts: [200]
            },
            syndicateTag: "CetusSyndicate"
        };
    }

    if (!syndicateTag) return;

    if (syndicateTag == "SolarisSyndicate") {
        if (jobType.startsWith("/Lotus/Types/Gameplay/NokkoColony/Jobs/NokkoJob")) {
            return {
                currentJob: {
                    jobType,
                    rewards: jobType
                        .replace("SteelPath", "Steel")
                        .replace(
                            "/Lotus/Types/Gameplay/NokkoColony/Jobs/NokkoJob",
                            "/Lotus/Types/Game/MissionDecks/NokkoColonyRewards/NokkoColonyRewards"
                        ),
                    masteryReq: 0,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 40,
                    xpAmounts: [0, 0, 0, 0, 0]
                },
                syndicateTag
            };
        } else if (jobType == "/Lotus/Types/Gameplay/Venus/Jobs/Heists/ExploiterHunt") {
            return {
                currentJob: {
                    jobType,
                    rewards: "",
                    masteryReq: 0,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 60,
                    xpAmounts: [1000]
                },
                syndicateTag
            };
        }

        const tierMap: Record<string, string> = { One: "A", Two: "B", Three: "C", Four: "D" };
        for (const [key, tier] of Object.entries(tierMap)) {
            if (key == "One" && rewardInfo.JobStage != 2) continue;
            if (!jobType.endsWith(`Heists/HeistProfitTakerBounty${key}`)) continue;

            return {
                currentJob: {
                    jobType,
                    rewards: `/Lotus/Types/Game/MissionDecks/HeistJobMissionRewards/HeistTier${tier}TableARewards`,
                    masteryReq: 0,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 60,
                    xpAmounts: [1000]
                },
                syndicateTag
            };
        }
    }

    if (!syndicateEntry?.Jobs) return;

    let currentJob: ISyndicateJob | undefined =
        rewardInfo.JobTier !== undefined && !isGoalJob
            ? syndicateEntry.Jobs[rewardInfo.JobTier]
            : syndicateEntry.Jobs.find(j => j.jobType == jobType);

    if (syndicateTag == "EntratiSyndicate") {
        if (jobType.includes("DeimosEndless")) {
            const endlessJob = syndicateEntry.Jobs.find(j => j.endless);
            if (endlessJob) {
                currentJob = endlessJob;
                const excess = Math.floor(rewardInfo.JobStage! / (currentJob.xpAmounts.length - 1));
                const rotationIndex = [0, 0, 1, 2][excess % 4];
                const dropTable = [
                    "/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierBTableARewards",
                    "/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierBTableBRewards",
                    "/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierBTableCRewards"
                ];
                currentJob.rewards = dropTable[rotationIndex];
            }
        } else if (jobType.endsWith("VaultBounty")) {
            const chamberTag = [...parts].reverse().find(p => p.startsWith("Chamber"));
            const vault = syndicateEntry.Jobs.find(j => j.locationTag == chamberTag);
            if (vault) {
                currentJob = vault;
                currentJob.jobType = jobType;
                currentJob.rewards = currentJob.rewards.replace("/Lotus/Types/Game/MissionDecks/", "/Supplementals/");
                currentJob.xpAmounts = [currentJob.xpAmounts.reduce((sum, a) => sum + a, 0)];
            }
        }
    }

    if (!currentJob) return;

    return { currentJob, syndicateTag };
};

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

const chemistryBuddies: readonly string[] = [
    "/Lotus/Types/Gameplay/1999Wf/Dialogue/JabirDialogue_rom.dialogue",
    "/Lotus/Types/Gameplay/1999Wf/Dialogue/AoiDialogue_rom.dialogue",
    "/Lotus/Types/Gameplay/1999Wf/Dialogue/ArthurDialogue_rom.dialogue",
    "/Lotus/Types/Gameplay/1999Wf/Dialogue/EleanorDialogue_rom.dialogue",
    "/Lotus/Types/Gameplay/1999Wf/Dialogue/LettieDialogue_rom.dialogue",
    "/Lotus/Types/Gameplay/1999Wf/Dialogue/QuincyDialogue_rom.dialogue"
];

/*const node_excluded_buddies: Record<string, string> = {
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
};*/

const goalMessagesByKey: Record<string, { sndr: string; msg: string; sub: string; icon: string; arg?: string[] }> = {
    "/Lotus/Types/Keys/GalleonRobberyAlert": {
        sndr: "/Lotus/Language/Bosses/BossCouncilorVayHek",
        msg: "/Lotus/Language/Messages/GalleonRobbery2025RewardMsgA",
        sub: "/Lotus/Language/Messages/GalleonRobbery2025MissionTitleA",
        icon: "/Lotus/Interface/Icons/Npcs/VayHekPortrait.png"
    },
    "/Lotus/Types/Keys/GalleonRobberyAlertB": {
        sndr: "/Lotus/Language/Bosses/BossCouncilorVayHek",
        msg: "/Lotus/Language/Messages/GalleonRobbery2025RewardMsgB",
        sub: "/Lotus/Language/Messages/GalleonRobbery2025MissionTitleB",
        icon: "/Lotus/Interface/Icons/Npcs/VayHekPortrait.png"
    },
    "/Lotus/Types/Keys/GalleonRobberyAlertC": {
        sndr: "/Lotus/Language/Bosses/BossCouncilorVayHek",
        msg: "/Lotus/Language/Messages/GalleonRobbery2025RewardMsgC",
        sub: "/Lotus/Language/Messages/GalleonRobbery2025MissionTitleC",
        icon: "/Lotus/Interface/Icons/Npcs/VayHekPortrait.png"
    },
    "/Lotus/Types/Keys/TacAlertKeyWaterFightA": {
        sndr: "/Lotus/Language/Bosses/BossKelaDeThaym",
        msg: "/Lotus/Language/Inbox/WaterFightRewardMsgA",
        sub: "/Lotus/Language/Inbox/WaterFightRewardSubjectA",
        icon: "/Lotus/Interface/Icons/Npcs/Grineer/KelaDeThaym.png"
    },
    "/Lotus/Types/Keys/TacAlertKeyWaterFightB": {
        sndr: "/Lotus/Language/Bosses/BossKelaDeThaym",
        msg: "/Lotus/Language/Inbox/WaterFightRewardMsgB",
        sub: "/Lotus/Language/Inbox/WaterFightRewardSubjectB",
        icon: "/Lotus/Interface/Icons/Npcs/Grineer/KelaDeThaym.png"
    },
    "/Lotus/Types/Keys/TacAlertKeyWaterFightC": {
        sndr: "/Lotus/Language/Bosses/BossKelaDeThaym",
        msg: "/Lotus/Language/Inbox/WaterFightRewardMsgC",
        sub: "/Lotus/Language/Inbox/WaterFightRewardSubjectC",
        icon: "/Lotus/Interface/Icons/Npcs/Grineer/KelaDeThaym.png"
    },
    "/Lotus/Types/Keys/TacAlertKeyWaterFightD": {
        sndr: "/Lotus/Language/Bosses/BossKelaDeThaym",
        msg: "/Lotus/Language/Inbox/WaterFightRewardMsgD",
        sub: "/Lotus/Language/Inbox/WaterFightRewardSubjectD",
        icon: "/Lotus/Interface/Icons/Npcs/Grineer/KelaDeThaym.png"
    },
    "/Lotus/Types/Keys/WolfTacAlertA": {
        sndr: "/Lotus/Language/Bosses/NoraNight",
        msg: "/Lotus/Language/Inbox/WolfTacAlertBody",
        sub: "/Lotus/Language/Inbox/WolfTacAlertTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Seasonal/NoraNight.png"
    },
    "/Lotus/Types/Keys/WolfTacAlertxB": {
        sndr: "/Lotus/Language/Bosses/NoraNight",
        msg: "/Lotus/Language/Inbox/WolfTacAlertHardBody",
        sub: "/Lotus/Language/Inbox/WolfTacAlertHardTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Seasonal/NoraNight.png"
    },
    "/Lotus/Types/Keys/WolfTacAlertReduxA": {
        sndr: "/Lotus/Language/Bosses/NoraNight",
        msg: "/Lotus/Language/Inbox/WolfTacAlertBody",
        sub: "/Lotus/Language/Inbox/WolfTacAlertTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Seasonal/NoraNight.png"
    },
    "/Lotus/Types/Keys/WolfTacAlertReduxB": {
        sndr: "/Lotus/Language/Bosses/NoraNight",
        msg: "/Lotus/Language/Inbox/WolfTacAlertBody",
        sub: "/Lotus/Language/Inbox/WolfTacAlertTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Seasonal/NoraNight.png"
    },
    "/Lotus/Types/Keys/WolfTacAlertReduxD": {
        sndr: "/Lotus/Language/Bosses/NoraNight",
        msg: "/Lotus/Language/Inbox/WolfTacAlertBody",
        sub: "/Lotus/Language/Inbox/WolfTacAlertTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Seasonal/NoraNight.png"
    },
    "/Lotus/Types/Keys/WolfTacAlertReduxC": {
        sndr: "/Lotus/Language/Bosses/NoraNight",
        msg: "/Lotus/Language/Inbox/WolfTacAlertBody",
        sub: "/Lotus/Language/Inbox/WolfTacAlertTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Seasonal/NoraNight.png"
    },
    "/Lotus/Types/Keys/LanternEndlessEventKeyA": {
        sndr: "/Lotus/Language/Bosses/Lotus",
        msg: "/Lotus/Language/G1Quests/GenericEventRewardMsgDesc",
        sub: "/Lotus/Language/G1Quests/GenericTacAlertRewardMsgTitle",
        icon: "/Lotus/Interface/Icons/Npcs/LotusVamp_d.png"
    },
    "/Lotus/Types/Keys/LanternEndlessEventKeyB": {
        sndr: "/Lotus/Language/Bosses/Lotus",
        msg: "/Lotus/Language/G1Quests/GenericEventRewardMsgDesc",
        sub: "/Lotus/Language/G1Quests/GenericTacAlertRewardMsgTitle",
        icon: "/Lotus/Interface/Icons/Npcs/LotusVamp_d.png"
    },
    "/Lotus/Types/Keys/LanternEndlessEventKeyD": {
        sndr: "/Lotus/Language/Bosses/Lotus",
        msg: "/Lotus/Language/G1Quests/GenericEventRewardMsgDesc",
        sub: "/Lotus/Language/G1Quests/GenericTacAlertRewardMsgTitle",
        icon: "/Lotus/Interface/Icons/Npcs/LotusVamp_d.png"
    },
    "/Lotus/Types/Keys/LanternEndlessEventKeyC": {
        sndr: "/Lotus/Language/Bosses/Lotus",
        msg: "/Lotus/Language/G1Quests/GenericEventRewardMsgDesc",
        sub: "/Lotus/Language/G1Quests/GenericTacAlertRewardMsgTitle",
        icon: "/Lotus/Interface/Icons/Npcs/LotusVamp_d.png"
    },
    "/Lotus/Types/Keys/TacAlertKeyHalloween": {
        sndr: "/Lotus/Language/Bosses/Lotus",
        msg: "/Lotus/Language/G1Quests/TacAlertHalloweenRewardsBonusBody",
        sub: "/Lotus/Language/G1Quests/TacAlertHalloweenRewardsBonusTitle",
        icon: "/Lotus/Interface/Icons/Npcs/LotusVamp_d.png"
    },
    "/Lotus/Types/Keys/TacAlertKeyHalloweenBonus": {
        sndr: "/Lotus/Language/Bosses/Lotus",
        msg: "/Lotus/Language/G1Quests/TacAlertHalloweenRewardsBody",
        sub: "/Lotus/Language/G1Quests/TacAlertHalloweenRewardsTitle",
        icon: "/Lotus/Interface/Icons/Npcs/LotusVamp_d.png"
    },
    "/Lotus/Types/Keys/TacAlertKeyHalloweenTimeAttack": {
        sndr: "/Lotus/Language/Bosses/Lotus",
        msg: "/Lotus/Language/G1Quests/TacAlertHalloweenRewardsBody",
        sub: "/Lotus/Language/G1Quests/TacAlertHalloweenRewardsTitle",
        icon: "/Lotus/Interface/Icons/Npcs/LotusVamp_d.png"
    },
    "/Lotus/Types/Keys/TacAlertKeyProxyRebellionOne": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/G1Quests/RazorbackArmadaRewardBody",
        sub: "/Lotus/Language/G1Quests/GenericTacAlertSmallRewardMsgTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["CREDIT_REWARD"]
    },
    "/Lotus/Types/Keys/TacAlertKeyProxyRebellionTwo": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/G1Quests/RazorbackArmadaRewardBody",
        sub: "/Lotus/Language/G1Quests/GenericTacAlertSmallRewardMsgTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["CREDIT_REWARD"]
    },
    "/Lotus/Types/Keys/TacAlertKeyProxyRebellionThree": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/G1Quests/RazorbackArmadaRewardBody",
        sub: "/Lotus/Language/G1Quests/GenericTacAlertSmallRewardMsgTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["CREDIT_REWARD"]
    },
    "/Lotus/Types/Keys/TacAlertKeyProxyRebellionFour": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/G1Quests/GenericTacAlertBadgeRewardMsgDesc",
        sub: "/Lotus/Language/G1Quests/GenericTacAlertBadgeRewardMsgTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png"
    },
    "/Lotus/Types/Keys/TacAlertKeyProjectNightwatchEasy": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/G1Quests/ProjectNightwatchRewardMsgA",
        sub: "/Lotus/Language/G1Quests/ProjectNightwatchTacAlertMissionOneTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["CREDIT_REWARD"]
    },
    "/Lotus/Types/Keys/TacAlertKeyProjectNightwatch": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/G1Quests/ProjectNightwatchTacAlertMissionRewardBody",
        sub: "/Lotus/Language/G1Quests/ProjectNightwatchTacAlertMissionTwoTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png"
    },
    "/Lotus/Types/Keys/TacAlertKeyProjectNightwatchHard": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/G1Quests/ProjectNightwatchTacAlertMissionRewardBody",
        sub: "/Lotus/Language/G1Quests/ProjectNightwatchTacAlertMissionThreeTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png"
    },
    "/Lotus/Types/Keys/TacAlertKeyProjectNightwatchBonus": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/G1Quests/ProjectNightwatchTacAlertMissionRewardBody",
        sub: "/Lotus/Language/G1Quests/ProjectNightwatchTacAlertMissionFourTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png"
    },
    "/Lotus/Types/Keys/MechSurvivalCorpusShip": {
        sndr: "/Lotus/Language/Bosses/DeimosFather",
        msg: "/Lotus/Language/Inbox/MechEvent2020Tier1CompleteDesc",
        sub: "/Lotus/Language/Inbox/MechEvent2020Tier1CompleteTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Entrati/Father.png"
    },
    "/Lotus/Types/Keys/MechSurvivalGrineerGalleon": {
        sndr: "/Lotus/Language/Bosses/DeimosFather",
        msg: "/Lotus/Language/Inbox/MechEvent2020Tier2CompleteDesc",
        sub: "/Lotus/Language/Inbox/MechEvent2020Tier2CompleteTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Entrati/Father.png"
    },
    "/Lotus/Types/Keys/MechSurvivalGasCity": {
        sndr: "/Lotus/Language/Bosses/DeimosFather",
        msg: "/Lotus/Language/Inbox/MechEvent2020Tier3CompleteDesc",
        sub: "/Lotus/Language/Inbox/MechEvent2020Tier3CompleteTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Entrati/Father.png"
    },
    "/Lotus/Types/Keys/MechSurvivalCorpusShipEndurance": {
        sndr: "/Lotus/Language/Bosses/DeimosFather",
        msg: "/Lotus/Language/Inbox/MechEvent2020Tier3CompleteDesc",
        sub: "/Lotus/Language/Inbox/MechEvent2020Tier3CompleteTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Entrati/Father.png"
    },
    "/Lotus/Types/Keys/MechSurvivalGrineerGalleonEndurance": {
        sndr: "/Lotus/Language/Bosses/DeimosFather",
        msg: "/Lotus/Language/Inbox/MechEvent2020Tier3CompleteDesc",
        sub: "/Lotus/Language/Inbox/MechEvent2020Tier3CompleteTitle",
        icon: "/Lotus/Interface/Icons/Npcs/Entrati/Father.png"
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2019E": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2024RewardMsgB",
        sub: "/Lotus/Language/Messages/Anniversary2024MissionTitleB",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2020F": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2024RewardMsgC",
        sub: "/Lotus/Language/Messages/Anniversary2024MissionTitleB",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2024ChallengeModeA": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2024RewardMsgD",
        sub: "/Lotus/Language/Messages/Anniversary2024MissionTitleD",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2017C": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2019RewardMsgC",
        sub: "/Lotus/Language/Messages/Anniversary2019MissionTitleC",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2020H": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2020RewardMsgH",
        sub: "/Lotus/Language/Messages/Anniversary2020MissionTitleH",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2022J": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2022RewardMsgJ",
        sub: "/Lotus/Language/Messages/Anniversary2022MissionTitleJ",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2025D": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2025RewardMsgB",
        sub: "/Lotus/Language/Messages/Anniversary2025MissionTitleB",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2025ChallengeModeA": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2025RewardMsgC",
        sub: "/Lotus/Language/Messages/Anniversary2025MissionTitleC",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2020G": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2020RewardMsgG",
        sub: "/Lotus/Language/Messages/Anniversary2020MissionTitleG",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2017B": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2019RewardMsgB",
        sub: "/Lotus/Language/Messages/Anniversary2019MissionTitleB",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2017A": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2019RewardMsgA",
        sub: "/Lotus/Language/Messages/Anniversary2019MissionTitleA",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2023K": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2025RewardMsgG",
        sub: "/Lotus/Language/Messages/Anniversary2025MissionTitleG",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2025ChallengeModeB": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2025RewardMsgD",
        sub: "/Lotus/Language/Messages/Anniversary2025MissionTitleD",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2025A": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2025RewardMsgA",
        sub: "/Lotus/Language/Messages/Anniversary2025MissionTitleA",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2018D": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2024RewardMsgG",
        sub: "/Lotus/Language/Messages/Anniversary2024MissionTitleG",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2025C": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2024RewardMsgF",
        sub: "/Lotus/Language/Messages/Anniversary2024MissionTitleF",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2024L": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2024RewardMsgA",
        sub: "/Lotus/Language/Messages/Anniversary2024MissionTitleA",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2024ChallengeModeB": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2024RewardMsgE",
        sub: "/Lotus/Language/Messages/Anniversary2024MissionTitleE",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2021I": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2024RewardMsgH",
        sub: "/Lotus/Language/Messages/Anniversary2024MissionTitleH",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    },
    "/Lotus/Types/Keys/TacAlertKeyAnniversary2025B": {
        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
        msg: "/Lotus/Language/Messages/Anniversary2025RewardMsgE",
        sub: "/Lotus/Language/Messages/Anniversary2025MissionTitleE",
        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
        arg: ["PLAYER_NAME"]
    }
};

const goalMessagesByTag: Record<string, { sndr: string; msg: string; sub: string; icon: string; arg?: string[] }[]> = {
    HeatFissure: [
        {
            sndr: "/Lotus/Language/Npcs/Eudico",
            msg: "/Lotus/Language/Messages/OrbHeistEventRewardAInboxMessageBody",
            sub: "/Lotus/Language/Messages/OrbHeistEventRewardAInboxMessageTitle",
            icon: "/Lotus/Interface/Icons/Npcs/Eudico.png"
        },
        {
            sndr: "/Lotus/Language/Npcs/Eudico",
            msg: "/Lotus/Language/Messages/OrbHeistEventRewardBInboxMessageBody",
            sub: "/Lotus/Language/Messages/OrbHeistEventRewardBInboxMessageTitle",
            icon: "/Lotus/Interface/Icons/Npcs/Eudico.png"
        },
        {
            sndr: "/Lotus/Language/Npcs/Eudico",
            msg: "/Lotus/Language/Messages/OrbHeistEventRewardCInboxMessageBody",
            sub: "/Lotus/Language/Messages/OrbHeistEventRewardCInboxMessageTitle",
            icon: "/Lotus/Interface/Icons/Npcs/Eudico.png"
        },
        {
            sndr: "/Lotus/Language/Npcs/Eudico",
            msg: "/Lotus/Language/Messages/OrbHeistEventRewardDInboxMessageBody",
            sub: "/Lotus/Language/Messages/OrbHeistEventRewardDInboxMessageTitle",
            icon: "/Lotus/Interface/Icons/Npcs/Eudico.png"
        },
        {
            sndr: "/Lotus/Language/Npcs/Eudico",
            msg: "/Lotus/Language/Messages/OrbHeistEventRewardEInboxMessageBody",
            sub: "/Lotus/Language/Messages/OrbHeistEventRewardEInboxMessageTitle",
            icon: "/Lotus/Interface/Icons/Npcs/Eudico.png"
        }
    ]
};
