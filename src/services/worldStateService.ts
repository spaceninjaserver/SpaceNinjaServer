import { WorldState } from "@/src/models/worldStateModel";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import {
    IActiveChallenge,
    IActiveMission,
    IJob,
    ILiteSortie,
    ISortie,
    ISyndicateMission,
    IVoidStorm,
    IWorldState
} from "@/src/types/worldStateTypes";
import { getRandomNumber, getRandomKey } from "@/src/helpers/general";
import { getRandomNodes, getCurrentRotation } from "@/src/helpers/worldstateHelpers";
import { ExportRailjack, ExportRegions, ExportNightwave } from "warframe-public-export-plus";
import { logger } from "@/src/utils/logger";
import {
    factionSyndicates,
    neutralJobsSyndicates,
    neutralSyndicates,
    restSyndicates,
    CertusNormalJobs,
    CertusNarmerJobs,
    EntratiNormalJobs,
    missionIndexToMissionTypes,
    validFisureMissionIndex,
    omniaNodes,
    liteSortiesBosses,
    endStates,
    modifierTypes,
    voidTiers,
    FortunaNarmerJobs,
    FortunaNormalJobs,
    liteSortiesMissionIndex,
    EntratiEndlessJobs,
    normalCircutRotations,
    hardCircutRotations
} from "@/src/constants/worldStateConstants";

export const createWorldState = async () => {
    const worldState = new WorldState();
    await worldState.save();
    await updateSyndicateMissions();
    await updateVoidFisures();
    await updateSorties();
    await updateCircuit();
    await updateNigthWave();
    await updateNodeOverrides();
    return worldState;
};

export const getWorldState = async () => {
    let ws = await WorldState.findOne();
    if (!ws) {
        ws = await createWorldState();
    }
    return ws.toJSON();
};

export const worldStateRunner = async () => {
    await getWorldState();
    setInterval(async () => {
        logger.info("Update worldState");
        await updateSyndicateMissions();
        await updateVoidFisures();
        await updateSorties();
        await updateCircuit();
        await updateNigthWave();
        await updateNodeOverrides();
    }, unixTimesInMs.minute);
};

const updateSyndicateMissions = async (): Promise<IWorldState> => {
    const currentDate = Date.now();
    const oneDayIntervalStart =
        Math.floor(currentDate / unixTimesInMs.day) * unixTimesInMs.day + 16 * unixTimesInMs.hour;
    const oneDayIntervalEnd = oneDayIntervalStart + unixTimesInMs.day;

    const neutralJobsIntervalStart = Math.floor(currentDate / (2.5 * unixTimesInMs.hour)) * (2.5 * unixTimesInMs.hour);
    const neutralJobsIntervalEnd = neutralJobsIntervalStart + 2.5 * unixTimesInMs.hour;

    const neutralSeed = getRandomNumber(1, 99999);

    try {
        const ws = await WorldState.findOne();
        if (!ws) throw new Error("Missing worldState");

        const syndicateArray = ws.SyndicateMissions || [];

        const existingTags = syndicateArray.map(syndicate => syndicate.Tag);

        const createNewSyndicateEntry = (tag: string): ISyndicateMission => {
            switch (true) {
                case factionSyndicates.includes(tag):
                    return {
                        Tag: tag,
                        Seed: getRandomNumber(1, 99999),
                        Nodes: getRandomNodes(7),
                        Activation: oneDayIntervalStart,
                        Expiry: oneDayIntervalEnd
                    };
                case neutralJobsSyndicates.includes(tag):
                    return {
                        Tag: tag,
                        Seed: neutralSeed,
                        Nodes: [],
                        Activation: neutralJobsIntervalStart,
                        Expiry: neutralJobsIntervalEnd,
                        Jobs: getJobs(tag)
                    };
                case neutralSyndicates.includes(tag):
                    return {
                        Tag: tag,
                        Seed: neutralSeed,
                        Nodes: [],
                        Activation: neutralJobsIntervalStart,
                        Expiry: neutralJobsIntervalEnd
                    };
                case restSyndicates.includes(tag):
                    return {
                        Tag: tag,
                        Seed: getRandomNumber(1, 99999),
                        Nodes: [],
                        Activation: oneDayIntervalStart,
                        Expiry: oneDayIntervalEnd
                    };
                default:
                    throw new Error(`Unhandled syndicate tag: ${tag}`);
            }
        };

        [...factionSyndicates, ...neutralJobsSyndicates, ...neutralSyndicates, ...restSyndicates].forEach(tag => {
            if (!existingTags.includes(tag)) {
                syndicateArray.push(createNewSyndicateEntry(tag));
            } else {
                const syndicateIndex = existingTags.indexOf(tag);
                const shouldUpdate = currentDate >= syndicateArray[syndicateIndex].Expiry;

                if (shouldUpdate) {
                    syndicateArray[syndicateIndex] = {
                        ...syndicateArray[syndicateIndex],
                        Tag: tag,
                        Seed:
                            neutralJobsSyndicates.includes(tag) || neutralSyndicates.includes(tag)
                                ? neutralSeed
                                : getRandomNumber(1, 99999),
                        Nodes:
                            neutralJobsSyndicates.includes(tag) || neutralSyndicates.includes(tag)
                                ? []
                                : getRandomNodes(7),
                        Activation:
                            neutralJobsSyndicates.includes(tag) || neutralSyndicates.includes(tag)
                                ? neutralJobsIntervalStart
                                : oneDayIntervalStart,
                        Expiry:
                            neutralJobsSyndicates.includes(tag) || neutralSyndicates.includes(tag)
                                ? neutralJobsIntervalEnd
                                : oneDayIntervalEnd,
                        Jobs: neutralJobsSyndicates.includes(tag) ? getJobs(tag) : undefined
                    };
                }
            }
        });

        ws.SyndicateMissions = syndicateArray;

        await ws.save();
        return ws;
    } catch (error) {
        throw new Error(`Error while updating Syndicates ${error}`);
    }
};

const getJobs = (tag: string) => {
    const rotration = getCurrentRotation();
    switch (tag) {
        case "CetusSyndicate":
            const CertusJobs: IJob[] = [
                {
                    jobType: CertusNormalJobs[Math.floor(Math.random() * CertusNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierATable${rotration}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 5,
                    maxEnemyLevel: 15,
                    xpAmounts: [410, 410, 410]
                },
                {
                    jobType: CertusNormalJobs[Math.floor(Math.random() * CertusNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierBTable${rotration}Rewards`,
                    masteryReq: 1,
                    minEnemyLevel: 10,
                    maxEnemyLevel: 30,
                    xpAmounts: [750, 750, 750]
                },
                {
                    jobType: CertusNormalJobs[Math.floor(Math.random() * CertusNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierCTable${rotration}Rewards`,
                    masteryReq: 2,
                    minEnemyLevel: 20,
                    maxEnemyLevel: 40,
                    xpAmounts: [580, 580, 580, 850]
                },
                {
                    jobType: CertusNormalJobs[Math.floor(Math.random() * CertusNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierDTable${rotration}Rewards`,
                    masteryReq: 3,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 50,
                    xpAmounts: [580, 580, 580, 580, 1130]
                },
                {
                    jobType: CertusNormalJobs[Math.floor(Math.random() * CertusNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierETable${rotration}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 60,
                    xpAmounts: [710, 710, 710, 710, 1390]
                },
                {
                    jobType: CertusNormalJobs[Math.floor(Math.random() * CertusNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierETable${rotration}Rewards`,
                    masteryReq: 10,
                    minEnemyLevel: 100,
                    maxEnemyLevel: 100,
                    xpAmounts: [840, 840, 840, 840, 1660]
                },
                {
                    jobType: CertusNarmerJobs[Math.floor(Math.random() * CertusNarmerJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/NarmerTable${rotration}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 50,
                    maxEnemyLevel: 70,
                    xpAmounts: [820, 820, 820, 820, 1610]
                }
            ];
            return CertusJobs;

        case "SolarisSyndicate":
            const FortunaJobs: IJob[] = [
                {
                    jobType: FortunaNormalJobs[Math.floor(Math.random() * FortunaNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierATable${rotration}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 5,
                    maxEnemyLevel: 15,
                    xpAmounts: [410, 410, 410]
                },
                {
                    jobType: FortunaNormalJobs[Math.floor(Math.random() * FortunaNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierBTable${rotration}Rewards`,
                    masteryReq: 1,
                    minEnemyLevel: 10,
                    maxEnemyLevel: 30,
                    xpAmounts: [750, 750, 750]
                },
                {
                    jobType: FortunaNormalJobs[Math.floor(Math.random() * FortunaNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierCTable${rotration}Rewards`,
                    masteryReq: 2,
                    minEnemyLevel: 20,
                    maxEnemyLevel: 40,
                    xpAmounts: [580, 580, 580, 850]
                },
                {
                    jobType: FortunaNormalJobs[Math.floor(Math.random() * FortunaNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierDTable${rotration}Rewards`,
                    masteryReq: 3,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 50,
                    xpAmounts: [580, 580, 580, 580, 1130]
                },
                {
                    jobType: FortunaNormalJobs[Math.floor(Math.random() * FortunaNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierETable${rotration}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 60,
                    xpAmounts: [710, 710, 710, 710, 1390]
                },
                {
                    jobType: FortunaNormalJobs[Math.floor(Math.random() * FortunaNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierETable${rotration}Rewards`,
                    masteryReq: 10,
                    minEnemyLevel: 100,
                    maxEnemyLevel: 100,
                    xpAmounts: [840, 840, 840, 840, 1660]
                },
                {
                    jobType: FortunaNarmerJobs[Math.floor(Math.random() * FortunaNarmerJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusNarmerTable${rotration}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 50,
                    maxEnemyLevel: 70,
                    xpAmounts: [820, 820, 820, 820, 1610]
                }
            ];
            return FortunaJobs;

        case "EntratiSyndicate":
            const EntratiJobs: IJob[] = [
                {
                    jobType: EntratiNormalJobs[Math.floor(Math.random() * EntratiNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierATable${getRandomKey(["A", "B", "C"])}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 5,
                    maxEnemyLevel: 15,
                    xpAmounts: [5, 5, 5]
                },
                {
                    jobType: EntratiNormalJobs[Math.floor(Math.random() * EntratiNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierCTable${getRandomKey(["A", "B", "C"])}Rewards`,
                    masteryReq: 1,
                    minEnemyLevel: 15,
                    maxEnemyLevel: 25,
                    xpAmounts: [9, 9, 9]
                },
                {
                    jobType: EntratiEndlessJobs[Math.floor(Math.random() * EntratiEndlessJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierBTable${getRandomKey(["A", "B", "C"])}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 25,
                    maxEnemyLevel: 30,
                    endless: true,
                    xpAmounts: [14, 14, 14]
                },
                {
                    jobType: EntratiNormalJobs[Math.floor(Math.random() * EntratiNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierDTable${getRandomKey(["A", "B", "C"])}Rewards`,
                    masteryReq: 2,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 40,
                    xpAmounts: [19, 19, 19, 29]
                },
                {
                    jobType: EntratiNormalJobs[Math.floor(Math.random() * EntratiNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierETable${getRandomKey(["A", "B", "C"])}Rewards`,
                    masteryReq: 3,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 60,
                    xpAmounts: [21, 21, 21, 21, 41]
                },
                {
                    jobType: EntratiNormalJobs[Math.floor(Math.random() * EntratiNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierETable${getRandomKey(["A", "B", "C"])}Rewards`,
                    masteryReq: 10,
                    minEnemyLevel: 100,
                    maxEnemyLevel: 100,
                    xpAmounts: [25, 25, 25, 25, 50]
                },
                {
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/VaultBountyTierATable${getCurrentRotation()}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 40,
                    xpAmounts: [2, 2, 2, 4],
                    locationTag: "ChamberB",
                    isVault: true
                },
                {
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/VaultBountyTierBTable${getCurrentRotation()}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 50,
                    xpAmounts: [4, 4, 4, 5],
                    locationTag: "ChamberA",
                    isVault: true
                },
                {
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/VaultBountyTierCTable${getCurrentRotation()}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 50,
                    maxEnemyLevel: 60,
                    xpAmounts: [5, 5, 5, 7],
                    locationTag: "ChamberC",
                    isVault: true
                }
            ];
            return EntratiJobs;

        default:
            throw new Error(`Error while updating Syndicates: Unknown Jobs syndicate ${tag}`);
    }
};

const updateVoidFisures = async () => {
    const curDate = Date.now();
    try {
        const ws = await WorldState.findOne();
        if (!ws) throw new Error("Missing worldState");
        const voidFisures = ws.ActiveMissions;
        const voidStorms = ws.VoidStorms;
        const voidFisuresByTier: { [key: string]: IActiveMission[] } = {
            VoidT1: [],
            VoidT2: [],
            VoidT3: [],
            VoidT4: [],
            VoidT5: [],
            VoidT6: []
        };
        const voidStormsByTier: { [key: string]: IVoidStorm[] } = {
            VoidT1: [],
            VoidT2: [],
            VoidT3: [],
            VoidT4: [],
            VoidT5: [],
            VoidT6: []
        };

        if (voidFisures) {
            voidFisures.forEach(mission => {
                const tier = mission.Modifier;
                if (tier) {
                    if (!voidFisuresByTier[tier]) {
                        voidFisuresByTier[tier] = [];
                    }
                    voidFisuresByTier[tier].push(mission);
                }
            });
        }

        if (voidStorms) {
            voidStorms.forEach(mission => {
                const tier = mission.ActiveMissionTier;
                if (tier) {
                    if (!voidStormsByTier[tier]) {
                        voidStormsByTier[tier] = [];
                    }
                    voidStormsByTier[tier].push(mission);
                }
            });
        }

        voidTiers.forEach(voidTier => {
            if (voidFisuresByTier[voidTier].length < 3) {
                const nodeData = getRandomFisureNode(false, voidTier == "VoidT6");
                logger.debug(voidTier);
                if (!nodeData.missionIndex) nodeData.missionIndex = 1;
                const node = {
                    Region: nodeData.systemIndex,
                    Seed: getRandomNumber(1, 99999),
                    Activation: curDate,
                    Expiry: curDate + Math.floor(Math.random() * unixTimesInMs.hour),
                    Node: nodeData.nodeKey,
                    MissionType: missionIndexToMissionTypes[nodeData.missionIndex],
                    Modifier: voidTier,
                    Hard: Math.random() < 0.1
                } as IActiveMission;
                voidFisures?.push(node);
            }

            if (voidStormsByTier[voidTier].length < 2) {
                const nodeData = getRandomFisureNode(true, voidTier == "VoidT6");
                logger.debug(voidTier);
                const node = {
                    Activation: curDate,
                    Expiry: curDate + Math.floor(Math.random() * unixTimesInMs.hour),
                    Node: nodeData.nodeKey,
                    ActiveMissionTier: voidTier
                } as IVoidStorm;
                voidStorms?.push(node);
            }
        });
        await ws.save();
        return ws;
    } catch (error) {
        throw new Error(`Error while updating VoidFisures: ${error}`);
    }
};

const getRandomFisureNode = (isRailJack: boolean, isOmnia: boolean) => {
    const validNodes = Object.entries(ExportRegions)
        .map(([key, node]) => ({ ...node, nodeKey: key }))
        .filter(node => validFisureMissionIndex.includes(node.missionIndex) && !node.missionName.includes("Archwing"));

    if (isRailJack) {
        const railJackNodes = Object.keys(ExportRailjack.nodes);
        const randomKey = railJackNodes[Math.floor(Math.random() * railJackNodes.length)];
        return { nodeKey: randomKey };
    }

    if (isOmnia) {
        const validOmniaNodes = validNodes.filter(node => omniaNodes.includes(node.nodeKey));
        const randomNode = validOmniaNodes[Math.floor(Math.random() * validOmniaNodes.length)];
        return {
            nodeKey: randomNode.nodeKey,
            systemIndex: randomNode.systemIndex,
            missionIndex: randomNode.missionIndex
        };
    }

    const randomNode = validNodes[Math.floor(Math.random() * validNodes.length)];
    return {
        nodeKey: randomNode.nodeKey,
        systemIndex: randomNode.systemIndex,
        missionIndex: randomNode.missionIndex
    };
};

const updateSorties = async () => {
    const currentDate = Date.now();
    const oneDayIntervalStart =
        Math.floor(currentDate / unixTimesInMs.day) * unixTimesInMs.day + 16 * unixTimesInMs.hour;
    const oneDayIntervalEnd = oneDayIntervalStart + unixTimesInMs.day;
    const oneWeekIntervalStart =
        Math.floor(currentDate / (unixTimesInMs.day * 7)) * unixTimesInMs.day * 7 + 16 * unixTimesInMs.hour;
    const oneWeekIntervalEnd = oneWeekIntervalStart + unixTimesInMs.day * 7;
    const nodes = Object.entries(ExportRegions).map(([key, node]) => {
        return {
            systemIndex: node.systemIndex,
            missionIndex: node.missionIndex,
            nodeKey: key
        };
    });

    try {
        const ws = await WorldState.findOne();
        if (!ws) throw new Error("Missing worldState");
        const liteSorties: ILiteSortie[] = ws?.LiteSorties;
        const sorties: ISortie[] = ws?.Sorties;

        [...liteSorties, ...sorties].forEach((sortie, index, array) => {
            if (currentDate >= sortie.Expiry) array.splice(index, 1);
        });

        if (liteSorties.length < 1) {
            const liteSortiesBoss = liteSortiesBosses[Math.floor(Math.random() * liteSortiesBosses.length)];

            const liteSortiesSystemIndex = nodes.filter(node => {
                switch (liteSortiesBoss) {
                    case "SORTIE_BOSS_AMAR":
                        return node.systemIndex === 3;
                    case "SORTIE_BOSS_NIRA":
                        return node.systemIndex === 4;
                    case "SORTIE_BOSS_PAAZUL":
                        return node.systemIndex === 0;
                    default:
                        throw new Error(`Unknown liteSortiesBoss: ${liteSortiesBoss}`);
                }
            });

            const filteredLiteSortiesNodes = liteSortiesMissionIndex.map(missionIndexArray =>
                liteSortiesSystemIndex.filter(node => missionIndexArray.includes(node.missionIndex))
            );

            const selectedLiteSortiesNodes = filteredLiteSortiesNodes.map(
                filteredNodes => filteredNodes[Math.floor(Math.random() * filteredNodes.length)]
            );

            const sortie = {
                Activation: oneWeekIntervalStart,
                Expiry: oneWeekIntervalEnd,
                Reward: "/Lotus/Types/Game/MissionDecks/ArchonSortieRewards",
                Seed: getRandomNumber(1, 99999),
                Boss: liteSortiesBoss,
                Missions: selectedLiteSortiesNodes.map(node => ({
                    missionType: missionIndexToMissionTypes[node.missionIndex],
                    node: node.nodeKey
                }))
            };

            liteSorties.push(sortie);
        }

        if (sorties.length < 1) {
            const randomState = endStates[Math.floor(Math.random() * endStates.length)];
            const selectedSortieNodes = Array.from({ length: 3 }, () => {
                const randomIndex = Math.floor(Math.random() * randomState.regions.length);
                const filteredNodes = nodes.filter(
                    node =>
                        randomState.regions[randomIndex].systemIndex === node.systemIndex &&
                        randomState.regions[randomIndex].missionIndex.includes(node.missionIndex)
                );
                return filteredNodes[Math.floor(Math.random() * filteredNodes.length)];
            });

            const sortie: ISortie = {
                Activation: oneDayIntervalStart,
                Expiry: oneDayIntervalEnd,
                ExtraDrops: [],
                Reward: "/Lotus/Types/Game/MissionDecks/SortieRewards",
                Seed: getRandomNumber(1, 99999),
                Boss: randomState.bossName,
                Variants: selectedSortieNodes.map(node => ({
                    missionType: missionIndexToMissionTypes[node.missionIndex],
                    modifierType: modifierTypes[Math.floor(Math.random() * modifierTypes.length)],
                    node: node.nodeKey,
                    tileset: "CorpusShipTileset" // needs more info about tilesets used in nodes
                })),
                Twitter: true
            };
            sorties.push(sortie);
        }

        await ws.save();
        return ws;
    } catch (error) {
        throw new Error(`Error while updating Sorties ${error}`);
    }
};

const updateCircuit = async () => {
    try {
        const ws = await WorldState.findOne();
        if (!ws) throw new Error("Missing worldState");
        const curWeek = Math.floor(Date.now() / (7 * unixTimesInMs.day));
        const normalIndex = curWeek % 11;
        const hardIndex = curWeek % 7;
        ws.EndlessXpChoices = [
            { Category: "EXC_NORMAL", Choices: normalCircutRotations[normalIndex] },
            { Category: "EXC_HARD", Choices: hardCircutRotations[hardIndex] }
        ];
        await ws.save();
        return ws;
    } catch (error) {
        throw new Error(`Error while updating Circuit ${error}`);
    }
};

const updateNigthWave = async () => {
    const currentDate = Date.now();
    const oneDayIntervalStart =
        Math.floor(currentDate / unixTimesInMs.day) * unixTimesInMs.day + 16 * unixTimesInMs.hour;
    const oneDayIntervalEnd = oneDayIntervalStart + unixTimesInMs.day;
    const oneWeekIntervalStart =
        Math.floor(currentDate / (unixTimesInMs.day * 7)) * unixTimesInMs.day * 7 + 16 * unixTimesInMs.hour;
    const oneWeekIntervalEnd = oneWeekIntervalStart + unixTimesInMs.day * 7;
    try {
        const ws = await WorldState.findOne();
        if (!ws) throw new Error("Missing worldState");
        let season = ws.SeasonInfo;
        if (!season)
            season = {
                Activation: 1715796000000,
                Expiry: 9999999999999,
                AffiliationTag: "RadioLegionIntermission10Syndicate",
                Season: 12,
                Phase: 0,
                Params: "",
                ActiveChallenges: [],
                UsedChallenges: []
            };
        const activeChallenges = season.ActiveChallenges.filter(challenge => currentDate < challenge.Expiry);
        const usedChallenges = season.UsedChallenges;

        const exportChallenges = Object.keys(ExportNightwave.challenges);
        const filterChallenges = (prefix: string) => exportChallenges.filter(challenge => challenge.startsWith(prefix));

        const dailyChallenges = filterChallenges("/Lotus/Types/Challenges/Seasons/Daily/");
        const weeklyChallenges = filterChallenges("/Lotus/Types/Challenges/Seasons/Weekly/");
        const weeklyHardChallenges = filterChallenges("/Lotus/Types/Challenges/Seasons/WeeklyHard/");

        let dailyCount = 0,
            weeklyCount = 0,
            weeklyHardCount = 0;

        activeChallenges.forEach(challenge => {
            if (challenge.Challenge.startsWith("/Lotus/Types/Challenges/Seasons/Daily/")) dailyCount++;
            else if (challenge.Challenge.startsWith("/Lotus/Types/Challenges/Seasons/Weekly/")) weeklyCount++;
            else if (challenge.Challenge.startsWith("/Lotus/Types/Challenges/Seasons/WeeklyHard/")) weeklyHardCount++;
        });

        const addChallenges = (
            count: number,
            limit: number,
            intervalStart: number,
            intervalEnd: number,
            challengesArray: string[],
            isDaily = false
        ) => {
            while (count < limit) {
                challengesArray = challengesArray.filter(challenge => !usedChallenges.includes(challenge));
                const uniqueName = challengesArray[Math.floor(Math.random() * challengesArray.length)];
                const challenge: IActiveChallenge = {
                    Activation: intervalStart,
                    Expiry: intervalEnd,
                    Challenge: uniqueName
                };
                if (isDaily) {
                    challenge.Daily = true;
                } else {
                    usedChallenges.push(uniqueName);
                }
                activeChallenges.push(challenge);
                count++;
            }
        };

        addChallenges(dailyCount, 3, oneDayIntervalStart, oneDayIntervalEnd, dailyChallenges, true);
        addChallenges(weeklyCount, 5, oneWeekIntervalStart, oneWeekIntervalEnd, weeklyChallenges);
        addChallenges(weeklyHardCount, 2, oneWeekIntervalStart, oneWeekIntervalEnd, weeklyHardChallenges);

        season = {
            Activation: season.Activation || 1715796000000,
            Expiry: season.Expiry || 9999999999999,
            AffiliationTag: season.AffiliationTag || "RadioLegionIntermission10Syndicate",
            Season: season.Season || 12,
            Phase: season.Phase || 0,
            Params: season.Params || "",
            ActiveChallenges: activeChallenges,
            UsedChallenges: usedChallenges
        };

        ws.SeasonInfo = season;
        await ws.save();
        return ws;
    } catch (error) {
        throw new Error(`Error while updating NigthWave ${error}`);
    }
};

const updateNodeOverrides = async () => {
    try {
        const ws = await WorldState.findOne();
        if (!ws) throw new Error("Missing worldState");
        const curWeek = Math.floor(Date.now() / (7 * unixTimesInMs.day));
        let overrides = ws.NodeOverrides;
        if (overrides == undefined || overrides.length < 1) {
            overrides = [
                { Node: "EuropaHUB", Hide: true },
                { Node: "ErisHUB", Hide: true },
                { Node: "VenusHUB", Hide: true },
                { Node: "SolNode802", Seed: curWeek }, // Elite santuary onnslaught
                {
                    Node: "EarthHUB",
                    Hide: false,
                    LevelOverride: "/Lotus/Levels/Proc/Hub/RelayStationHubTwoB"
                },
                {
                    Node: "MercuryHUB",
                    Hide: true,
                    LevelOverride: "/Lotus/Levels/Proc/Hub/RelayStationHubHydroid"
                }
            ];
        } else {
            const solNodeIndex = overrides.findIndex(node => node.Node === "SolNode802");

            if (solNodeIndex !== -1) {
                if (overrides[solNodeIndex].Seed !== curWeek) overrides[solNodeIndex].Seed = curWeek;
            } else {
                overrides.push({ Node: "SolNode802", Seed: curWeek });
            }
        }
        ws.NodeOverrides = overrides;
        await ws.save();
        return ws;
    } catch (error) {
        throw new Error(`Error while updating NodeOverrides ${error}`);
    }
};
