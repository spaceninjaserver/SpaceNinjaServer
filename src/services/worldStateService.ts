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
    IWorldStateDocument
} from "@/src/types/worldStateTypes";
import { getRandomNodes, getCurrentRotation, getRandomRotation } from "@/src/helpers/worldstateHelpers";
import { ExportRegions, ExportNightwave } from "warframe-public-export-plus";
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
    validFissureMissionIndex,
    omniaNodes,
    endStates,
    modifierTypes,
    voidTiers,
    FortunaNarmerJobs,
    FortunaNormalJobs,
    liteSortiesMissionIndex,
    EntratiEndlessJobs,
    normalCircuitRotations,
    hardCircuitRotations,
    liteSortiesBosses
} from "@/src/constants/worldStateConstants";

export const createWorldState = () => {
    let ws = new WorldState() as IWorldStateDocument;
    ws = updateSyndicateMissions(ws);
    ws = updateVoidFissures(ws);
    ws = updateSorties(ws);
    ws = updateCircuit(ws);
    ws = updateNightWave(ws);
    ws = updateNodeOverrides(ws);
    return ws;
};

export const getWorldState = async () => {
    let ws = await WorldState.findOne();
    if (!ws) {
        ws = createWorldState();
    }
    return ws as IWorldStateDocument;
};

export const worldStateRunner = async () => {
    await getWorldState();
    setInterval(async () => {
        try {
            logger.info("Update worldState");
            let ws = await getWorldState();
            ws = updateSyndicateMissions(ws);
            ws = updateVoidFissures(ws);
            ws = updateSorties(ws);
            ws = updateCircuit(ws);
            ws = updateNightWave(ws);
            ws = updateNodeOverrides(ws);
            await ws.save();
        } catch (error) {
            logger.error("Failed to update worldState:", error);
        }
    }, unixTimesInMs.minute);
};

const updateSyndicateMissions = (ws: IWorldStateDocument) => {
    const currentDate = Date.now();
    const oneDayIntervalStart =
        Math.floor(currentDate / unixTimesInMs.day) * unixTimesInMs.day + 16 * unixTimesInMs.hour;
    const oneDayIntervalEnd = oneDayIntervalStart + unixTimesInMs.day;

    const neutralJobsIntervalStart = Math.floor(currentDate / (2.5 * unixTimesInMs.hour)) * (2.5 * unixTimesInMs.hour);
    const neutralJobsIntervalEnd = neutralJobsIntervalStart + 2.5 * unixTimesInMs.hour;

    const neutralSeed = Math.floor(Math.random() * 99999 + 1);

    try {
        const syndicateArray = ws.SyndicateMissions || [];

        const existingTags = syndicateArray.map(syndicate => syndicate.Tag);

        const createNewSyndicateEntry = (tag: string): ISyndicateMission => {
            switch (true) {
                case factionSyndicates.includes(tag):
                    return {
                        Tag: tag,
                        Seed: Math.floor(Math.random() * 99999 + 1),
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
                        Seed: Math.floor(Math.random() * 99999 + 1),
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
                                : Math.floor(Math.random() * 99999 + 1),
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

        return ws;
    } catch (error) {
        throw new Error(`Error while updating Syndicates ${error}`);
    }
};

const getJobs = (tag: string): IJob[] => {
    const rotation = getCurrentRotation();
    switch (tag) {
        case "CetusSyndicate":
            return [
                {
                    jobType: CertusNormalJobs[Math.floor(Math.random() * CertusNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierATable${rotation}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 5,
                    maxEnemyLevel: 15,
                    xpAmounts: [410, 410, 410]
                },
                {
                    jobType: CertusNormalJobs[Math.floor(Math.random() * CertusNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierBTable${rotation}Rewards`,
                    masteryReq: 1,
                    minEnemyLevel: 10,
                    maxEnemyLevel: 30,
                    xpAmounts: [750, 750, 750]
                },
                {
                    jobType: CertusNormalJobs[Math.floor(Math.random() * CertusNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierCTable${rotation}Rewards`,
                    masteryReq: 2,
                    minEnemyLevel: 20,
                    maxEnemyLevel: 40,
                    xpAmounts: [580, 580, 580, 850]
                },
                {
                    jobType: CertusNormalJobs[Math.floor(Math.random() * CertusNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierDTable${rotation}Rewards`,
                    masteryReq: 3,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 50,
                    xpAmounts: [580, 580, 580, 580, 1130]
                },
                {
                    jobType: CertusNormalJobs[Math.floor(Math.random() * CertusNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierETable${rotation}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 60,
                    xpAmounts: [710, 710, 710, 710, 1390]
                },
                {
                    jobType: CertusNormalJobs[Math.floor(Math.random() * CertusNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierETable${rotation}Rewards`,
                    masteryReq: 10,
                    minEnemyLevel: 100,
                    maxEnemyLevel: 100,
                    xpAmounts: [840, 840, 840, 840, 1660]
                },
                {
                    jobType: CertusNarmerJobs[Math.floor(Math.random() * CertusNarmerJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/NarmerTable${rotation}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 50,
                    maxEnemyLevel: 70,
                    xpAmounts: [820, 820, 820, 820, 1610]
                }
            ];

        case "SolarisSyndicate":
            return [
                {
                    jobType: FortunaNormalJobs[Math.floor(Math.random() * FortunaNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierATable${rotation}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 5,
                    maxEnemyLevel: 15,
                    xpAmounts: [410, 410, 410]
                },
                {
                    jobType: FortunaNormalJobs[Math.floor(Math.random() * FortunaNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierBTable${rotation}Rewards`,
                    masteryReq: 1,
                    minEnemyLevel: 10,
                    maxEnemyLevel: 30,
                    xpAmounts: [750, 750, 750]
                },
                {
                    jobType: FortunaNormalJobs[Math.floor(Math.random() * FortunaNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierCTable${rotation}Rewards`,
                    masteryReq: 2,
                    minEnemyLevel: 20,
                    maxEnemyLevel: 40,
                    xpAmounts: [580, 580, 580, 850]
                },
                {
                    jobType: FortunaNormalJobs[Math.floor(Math.random() * FortunaNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierDTable${rotation}Rewards`,
                    masteryReq: 3,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 50,
                    xpAmounts: [580, 580, 580, 580, 1130]
                },
                {
                    jobType: FortunaNormalJobs[Math.floor(Math.random() * FortunaNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierETable${rotation}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 60,
                    xpAmounts: [710, 710, 710, 710, 1390]
                },
                {
                    jobType: FortunaNormalJobs[Math.floor(Math.random() * FortunaNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierETable${rotation}Rewards`,
                    masteryReq: 10,
                    minEnemyLevel: 100,
                    maxEnemyLevel: 100,
                    xpAmounts: [840, 840, 840, 840, 1660]
                },
                {
                    jobType: FortunaNarmerJobs[Math.floor(Math.random() * FortunaNarmerJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusNarmerTable${rotation}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 50,
                    maxEnemyLevel: 70,
                    xpAmounts: [820, 820, 820, 820, 1610]
                }
            ];

        case "EntratiSyndicate":
            return [
                {
                    jobType: EntratiNormalJobs[Math.floor(Math.random() * EntratiNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierATable${getRandomRotation()}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 5,
                    maxEnemyLevel: 15,
                    xpAmounts: [5, 5, 5]
                },
                {
                    jobType: EntratiNormalJobs[Math.floor(Math.random() * EntratiNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierCTable${getRandomRotation()}Rewards`,
                    masteryReq: 1,
                    minEnemyLevel: 15,
                    maxEnemyLevel: 25,
                    xpAmounts: [9, 9, 9]
                },
                {
                    jobType: EntratiEndlessJobs[Math.floor(Math.random() * EntratiEndlessJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierBTable${getRandomRotation()}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 25,
                    maxEnemyLevel: 30,
                    endless: true,
                    xpAmounts: [14, 14, 14]
                },
                {
                    jobType: EntratiNormalJobs[Math.floor(Math.random() * EntratiNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierDTable${getRandomRotation()}Rewards`,
                    masteryReq: 2,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 40,
                    xpAmounts: [19, 19, 19, 29]
                },
                {
                    jobType: EntratiNormalJobs[Math.floor(Math.random() * EntratiNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierETable${getRandomRotation()}Rewards`,
                    masteryReq: 3,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 60,
                    xpAmounts: [21, 21, 21, 21, 41]
                },
                {
                    jobType: EntratiNormalJobs[Math.floor(Math.random() * EntratiNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierETable${getRandomRotation()}Rewards`,
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

        default:
            throw new Error(`Error while updating Syndicates: Unknown Jobs syndicate ${tag}`);
    }
};

const updateVoidFissures = (ws: IWorldStateDocument) => {
    const curDate = Date.now();
    try {
        const voidFissures = ws.ActiveMissions;
        const voidStorms = ws.VoidStorms;
        const voidFissuresByTier: { [key: string]: IActiveMission[] } = {
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

        if (voidFissures) {
            voidFissures.forEach(mission => {
                const tier = mission.Modifier;
                if (tier) {
                    if (!voidFissuresByTier[tier]) {
                        voidFissuresByTier[tier] = [];
                    }
                    voidFissuresByTier[tier].push(mission);
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
            if (voidFissuresByTier[voidTier].length < 3) {
                const nodeData = getRandomFissureNode(false, voidTier == "VoidT6");
                if (!nodeData.missionIndex) nodeData.missionIndex = 1;
                const node = {
                    Region: nodeData.systemIndex,
                    Seed: Math.floor(Math.random() * 99999 + 1),
                    Activation: curDate,
                    Expiry: curDate + Math.floor(Math.random() * unixTimesInMs.hour),
                    Node: nodeData.nodeKey,
                    MissionType: missionIndexToMissionTypes[nodeData.missionIndex],
                    Modifier: voidTier,
                    Hard: Math.random() < 0.1
                } as IActiveMission;
                voidFissures?.push(node);
            }

            if (voidStormsByTier[voidTier].length < 2) {
                const nodeData = getRandomFissureNode(true, voidTier == "VoidT6");
                const node = {
                    Activation: curDate,
                    Expiry: curDate + Math.floor(Math.random() * unixTimesInMs.hour),
                    Node: nodeData.nodeKey,
                    ActiveMissionTier: voidTier
                } as IVoidStorm;
                voidStorms?.push(node);
            }
        });
        return ws;
    } catch (error) {
        throw new Error(`Error while updating VoidFissures: ${error}`);
    }
};

const getRandomFissureNode = (isRailJack: boolean, isOmnia: boolean) => {
    const validNodes = Object.entries(ExportRegions)
        .map(([key, node]) => ({ ...node, nodeKey: key }))
        .filter(node => {
            if (node.missionIndex && node.missionName) {
                return (
                    validFissureMissionIndex.includes(node.missionIndex) &&
                    (!node.missionName.includes("Archwing") || !node.missionName.includes("Railjack"))
                );
            } else return false;
        });

    if (isRailJack) {
        const railJackNodes = Object.keys(ExportRegions).filter(key => key.includes("CrewBattleNode"));
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

const updateSorties = (ws: IWorldStateDocument) => {
    const currentDate = Date.now();
    const oneDayIntervalStart =
        Math.floor(currentDate / unixTimesInMs.day) * unixTimesInMs.day + 16 * unixTimesInMs.hour;
    const oneDayIntervalEnd = oneDayIntervalStart + unixTimesInMs.day;
    const oneWeekIntervalStart =
        Math.floor(currentDate / unixTimesInMs.week) * unixTimesInMs.week + 16 * unixTimesInMs.hour;
    const oneWeekIntervalEnd = oneWeekIntervalStart + unixTimesInMs.week;

    type node = {
        systemIndex: number;
        missionIndex: number;
        nodeKey: string;
    };

    const nodes = Object.entries(ExportRegions).map(([key, node]) => {
        return {
            systemIndex: node.systemIndex,
            missionIndex: node.missionIndex,
            nodeKey: key
        } as node;
    });

    try {
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
                Seed: Math.floor(Math.random() * 99999 + 1),
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
                Seed: Math.floor(Math.random() * 99999 + 1),
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

        return ws;
    } catch (error) {
        throw new Error(`Error while updating Sorties ${error}`);
    }
};

const updateCircuit = (ws: IWorldStateDocument) => {
    try {
        const curWeek = Math.floor(Date.now() / unixTimesInMs.week);
        const normalIndex = curWeek % normalCircuitRotations.length;
        const hardIndex = curWeek % hardCircuitRotations.length;
        ws.EndlessXpChoices = [
            { Category: "EXC_NORMAL", Choices: normalCircuitRotations[normalIndex] },
            { Category: "EXC_HARD", Choices: hardCircuitRotations[hardIndex] }
        ];
        return ws;
    } catch (error) {
        throw new Error(`Error while updating Circuit ${error}`);
    }
};

const updateNightWave = (ws: IWorldStateDocument) => {
    const currentDate = Date.now();
    const oneDayIntervalStart =
        Math.floor(currentDate / unixTimesInMs.day) * unixTimesInMs.day + 16 * unixTimesInMs.hour;
    const oneDayIntervalEnd = oneDayIntervalStart + unixTimesInMs.day;
    const oneWeekIntervalStart =
        Math.floor(currentDate / unixTimesInMs.week) * unixTimesInMs.week + 16 * unixTimesInMs.hour;
    const oneWeekIntervalEnd = oneWeekIntervalStart + unixTimesInMs.week;

    try {
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
        const filterChallenges = (prefix: string): string[] =>
            exportChallenges.filter(challenge => challenge.startsWith(prefix));

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
        return ws;
    } catch (error) {
        throw new Error(`Error while updating NightWave ${error}`);
    }
};

const updateNodeOverrides = (ws: IWorldStateDocument) => {
    try {
        const curWeek = Math.floor(Date.now() / unixTimesInMs.week);
        let overrides = ws.NodeOverrides;
        if (overrides == undefined || overrides.length < 1) {
            overrides = [
                { Node: "EuropaHUB", Hide: true },
                { Node: "ErisHUB", Hide: true },
                { Node: "VenusHUB", Hide: true },
                { Node: "SolNode802", Seed: curWeek }, // Elite sanctuary onslaught
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
        return ws;
    } catch (error) {
        throw new Error(`Error while updating NodeOverrides ${error}`);
    }
};
