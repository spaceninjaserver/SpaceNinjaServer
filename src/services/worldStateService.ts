import { WorldState } from "@/src/models/worldStateModel";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import {
    IActiveMission,
    ILiteSortie,
    ISortie,
    ISyndicateMission,
    IVoidStorm,
    IWorldState
} from "@/src/types/worldStateTypes";
import { getRandomNumber, getRandomKey } from "@/src/helpers/general";
import { getRandomNodes, getCurrentRotation } from "@/src/helpers/worldstateHelpers";
import { ExportRailjack, ExportRegions } from "warframe-public-export-plus";
import { logger } from "@/src/utils/logger";
import {
    factionSyndicates,
    neutralJobsSyndicates,
    neutralSyndicates,
    restSyndicates,
    CertusNormalJobs,
    CertusNarmerJobs,
    ZarimanNormalJobs,
    voidFisuresMissionTypes,
    validFisureMissionIndex,
    omniaNodes,
    liteSortiesBoss,
    endStates,
    modifierTypes,
    SortiesMissionTypes,
    voidTiers,
    FortunaNarmerJobs,
    FortunaNormalJobs
} from "@/src/constants/worldStateConstants";

export const createWorldState = async () => {
    const worldState = new WorldState();
    await worldState.save();
    await updateSyndicateMissions();
    await updateVoidFisures();
    await updateSorties();
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
            const Certusjobs = [
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
            return Certusjobs;

        case "SolarisSyndicate":
            const FortunaJobs = [
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
            const ZarimanJobs = [
                {
                    jobType: ZarimanNormalJobs[Math.floor(Math.random() * ZarimanNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierATable${getRandomKey(["A", "B", "C"])}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 5,
                    maxEnemyLevel: 15,
                    xpAmounts: [5, 5, 5]
                },
                {
                    jobType: ZarimanNormalJobs[Math.floor(Math.random() * ZarimanNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierCTable${getRandomKey(["A", "B", "C"])}Rewards`,
                    masteryReq: 1,
                    minEnemyLevel: 15,
                    maxEnemyLevel: 25,
                    xpAmounts: [9, 9, 9]
                },
                {
                    jobType: ZarimanNormalJobs[Math.floor(Math.random() * ZarimanNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierBTable${getRandomKey(["A", "B", "C"])}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 25,
                    maxEnemyLevel: 30,
                    endless: true,
                    xpAmounts: [14, 14, 14]
                },
                {
                    jobType: ZarimanNormalJobs[Math.floor(Math.random() * ZarimanNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierDTable${getRandomKey(["A", "B", "C"])}Rewards`,
                    masteryReq: 2,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 40,
                    xpAmounts: [19, 19, 19, 29]
                },
                {
                    jobType: ZarimanNormalJobs[Math.floor(Math.random() * ZarimanNormalJobs.length)],
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierETable${getRandomKey(["A", "B", "C"])}Rewards`,
                    masteryReq: 3,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 60,
                    xpAmounts: [21, 21, 21, 21, 41]
                },
                {
                    jobType: ZarimanNormalJobs[Math.floor(Math.random() * ZarimanNormalJobs.length)],
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
            return ZarimanJobs;

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
                    MissionType: voidFisuresMissionTypes[nodeData.missionIndex],
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
        .map(([key, node]) => {
            return {
                ...node,
                nodeKey: key
            };
        })
        .filter(node => {
            return validFisureMissionIndex.includes(node.missionIndex) && !node.missionName.includes("Archwing");
        });

    if (isRailJack) {
        const railJackNodes = Object.keys(ExportRailjack.nodes);
        const randomKey = railJackNodes[Math.floor(Math.random() * railJackNodes.length)];
        return {
            nodeKey: randomKey
        };
    } else if (isOmnia) {
        const validOmniaNodes = validNodes.filter(node => {
            return omniaNodes.includes(node.nodeKey);
        });
        const randomNode = validOmniaNodes[Math.floor(Math.random() * validOmniaNodes.length)];
        return {
            nodeKey: randomNode.nodeKey,
            systemIndex: randomNode.systemIndex,
            missionIndex: randomNode.missionIndex
        };
    } else {
        const randomNode = validNodes[Math.floor(Math.random() * validNodes.length)];
        return {
            nodeKey: randomNode.nodeKey,
            systemIndex: randomNode.systemIndex,
            missionIndex: randomNode.missionIndex
        };
    }
};

const updateSorties = async () => {
    const currentDate = Date.now();
    const oneDayIntervalStart =
        Math.floor(currentDate / unixTimesInMs.day) * unixTimesInMs.day + 16 * unixTimesInMs.hour;
    const oneDayIntervalEnd = oneDayIntervalStart + unixTimesInMs.day;
    const oneWeekIntervalStart =
        Math.floor(currentDate / (unixTimesInMs.day * 7)) * unixTimesInMs.day * 7 + 16 * unixTimesInMs.hour;
    const oneWeekIntervalEnd = oneDayIntervalStart + unixTimesInMs.day * 7;
    const nodes = Object.entries(ExportRegions).map(([key, node]) => {
        return {
            nodeSystemIndex: node.systemIndex,
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
            const sortie: ILiteSortie = {
                Activation: oneWeekIntervalStart,
                Expiry: oneWeekIntervalEnd,
                Reward: "/Lotus/Types/Game/MissionDecks/ArchonSortieRewards",
                Seed: getRandomNumber(1, 99999),
                Boss: liteSortiesBoss[Math.floor(Math.random() * liteSortiesBoss.length)],
                Missions: [
                    {
                        missionType: SortiesMissionTypes[Math.floor(Math.random() * SortiesMissionTypes.length)],
                        node: nodes[Math.floor(Math.random() * nodes.length)].nodeKey
                    },
                    {
                        missionType: SortiesMissionTypes[Math.floor(Math.random() * SortiesMissionTypes.length)],
                        node: nodes[Math.floor(Math.random() * nodes.length)].nodeKey
                    },
                    {
                        missionType: SortiesMissionTypes[Math.floor(Math.random() * SortiesMissionTypes.length)],
                        node: nodes[Math.floor(Math.random() * nodes.length)].nodeKey
                    }
                ]
            };
            liteSorties.push(sortie);
        }

        if (sorties.length < 1) {
            const randomBoss = endStates[Math.floor(Math.random() * endStates.length)];
            const randomRegionIndex = [
                Math.floor(Math.random() * randomBoss.regions.length),
                Math.floor(Math.random() * randomBoss.regions.length),
                Math.floor(Math.random() * randomBoss.regions.length)
            ];
            const randomRegionIndexFake = randomRegionIndex;
            randomRegionIndexFake.forEach((element, index, array) => {
                if (element == 13) {
                    array[index] = element + 2;
                } else if (element == 14) {
                    array[index] = element + 1;
                }
            });
            const filteredNodes = [
                nodes.filter(node => {
                    return randomRegionIndexFake[0] === node.nodeSystemIndex;
                }),
                nodes.filter(node => {
                    return randomRegionIndexFake[1] === node.nodeSystemIndex;
                }),
                nodes.filter(node => {
                    return randomRegionIndexFake[2] === node.nodeSystemIndex;
                })
            ];
            const sortie: ISortie = {
                Activation: oneDayIntervalStart,
                Expiry: oneDayIntervalEnd,
                ExtraDrops: [],
                Reward: "/Lotus/Types/Game/MissionDecks/SortieRewards",
                Seed: getRandomNumber(1, 99999),
                Boss: randomBoss.bossName,
                Variants: [
                    {
                        missionType:
                            randomBoss.regions[randomRegionIndex[0]].missions[
                                Math.floor(Math.random() * randomBoss.regions[randomRegionIndex[0]].missions.length)
                            ],
                        modifierType: modifierTypes[Math.floor(Math.random() * modifierTypes.length)],
                        node: filteredNodes[0][Math.floor(Math.random() * filteredNodes[0].length)].nodeKey,
                        tileset: "CorpusShipTileset"
                    },
                    {
                        missionType:
                            randomBoss.regions[randomRegionIndex[1]].missions[
                                Math.floor(Math.random() * randomBoss.regions[randomRegionIndex[1]].missions.length)
                            ],
                        modifierType: modifierTypes[Math.floor(Math.random() * modifierTypes.length)],
                        node: filteredNodes[1][Math.floor(Math.random() * filteredNodes[1].length)].nodeKey,
                        tileset: "OrokinMoonTilesetCorpus"
                    },
                    {
                        missionType:
                            randomBoss.regions[randomRegionIndex[2]].missions[
                                Math.floor(Math.random() * randomBoss.regions[randomRegionIndex[2]].missions.length)
                            ],
                        modifierType: modifierTypes[Math.floor(Math.random() * modifierTypes.length)],
                        node: filteredNodes[2][Math.floor(Math.random() * filteredNodes[2].length)].nodeKey,
                        tileset: "CorpusShipTileset"
                    }
                ],
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
