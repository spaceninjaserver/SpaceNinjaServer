import { Stats, TStatsDatabaseDocument } from "@/src/models/statsModel";
import {
    IStatsAdd,
    IStatsMax,
    IStatsSet,
    IStatsTimers,
    IStatsUpdate,
    IUploadEntry,
    IWeapon
} from "@/src/types/statTypes";
import { logger } from "@/src/utils/logger";
import { addEmailItem, getInventory } from "@/src/services/inventoryService";
import { submitLeaderboardScore } from "@/src/services/leaderboardService";

export const createStats = async (accountId: string): Promise<TStatsDatabaseDocument> => {
    const stats = new Stats({ accountOwnerId: accountId });
    await stats.save();
    return stats;
};

export const getStats = async (accountOwnerId: string): Promise<TStatsDatabaseDocument> => {
    let stats = await Stats.findOne({ accountOwnerId: accountOwnerId });

    if (!stats) stats = await createStats(accountOwnerId);

    return stats;
};

export const updateStats = async (accountOwnerId: string, payload: IStatsUpdate): Promise<void> => {
    const unknownCategories: Record<string, string[]> = {};
    const playerStats = await getStats(accountOwnerId);

    for (const [action, actionData] of Object.entries(payload)) {
        switch (action) {
            case "add":
                for (const [category, data] of Object.entries(actionData as IStatsAdd)) {
                    switch (category) {
                        case "MISSION_COMPLETE":
                            for (const [key, value] of Object.entries(data as IUploadEntry)) {
                                switch (key) {
                                    case "GS_SUCCESS":
                                        playerStats.MissionsCompleted ??= 0;
                                        playerStats.MissionsCompleted += value;
                                        break;
                                    case "GS_QUIT":
                                        playerStats.MissionsQuit ??= 0;
                                        playerStats.MissionsQuit += value;
                                        break;
                                    case "GS_FAILURE":
                                        playerStats.MissionsFailed ??= 0;
                                        playerStats.MissionsFailed += value;
                                        break;
                                    case "GS_INTERRUPTED":
                                        playerStats.MissionsInterrupted ??= 0;
                                        playerStats.MissionsInterrupted += value;
                                        break;
                                    case "GS_DUMPED":
                                        playerStats.MissionsDumped ??= 0;
                                        playerStats.MissionsDumped += value;
                                        break;
                                    default:
                                        if (!ignoredCategories.includes(category)) {
                                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                            if (!unknownCategories[action]) {
                                                unknownCategories[action] = [];
                                            }
                                            unknownCategories[action].push(category);
                                        }
                                        break;
                                }
                            }
                            break;

                        case "PICKUP_ITEM":
                            playerStats.PickupCount ??= 0;
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            for (const [_key, value] of Object.entries(data as IUploadEntry)) {
                                playerStats.PickupCount += value;
                            }
                            break;

                        case "SCAN":
                            playerStats.Scans ??= [];
                            for (const [type, scans] of Object.entries(data as IUploadEntry)) {
                                const scan = playerStats.Scans.find(element => element.type === type);
                                if (scan) {
                                    scan.scans += scans;
                                } else {
                                    playerStats.Scans.push({ type: type, scans });
                                }
                            }
                            break;

                        case "USE_ABILITY":
                            playerStats.Abilities ??= [];
                            for (const [type, used] of Object.entries(data as IUploadEntry)) {
                                const ability = playerStats.Abilities.find(element => element.type === type);
                                if (ability) {
                                    ability.used += used;
                                } else {
                                    playerStats.Abilities.push({ type: type, used });
                                }
                            }
                            break;

                        case "FIRE_WEAPON":
                        case "HIT_ENTITY_ITEM":
                        case "HEADSHOT_ITEM":
                        case "KILL_ENEMY_ITEM":
                        case "KILL_ASSIST_ITEM": {
                            playerStats.Weapons ??= [];
                            const statKey = {
                                FIRE_WEAPON: "fired",
                                HIT_ENTITY_ITEM: "hits",
                                HEADSHOT_ITEM: "headshots",
                                KILL_ENEMY_ITEM: "kills",
                                KILL_ASSIST_ITEM: "assists"
                            }[category] as "fired" | "hits" | "headshots" | "kills" | "assists";

                            for (const [type, count] of Object.entries(data as IUploadEntry)) {
                                const weapon = playerStats.Weapons.find(element => element.type === type);
                                if (weapon) {
                                    weapon[statKey] ??= 0;
                                    weapon[statKey] += count;
                                } else {
                                    const newWeapon: IWeapon = { type: type };
                                    newWeapon[statKey] = count;
                                    playerStats.Weapons.push(newWeapon);
                                }
                            }
                            break;
                        }

                        case "KILL_ENEMY":
                        case "EXECUTE_ENEMY":
                        case "HEADSHOT":
                        case "KILL_ASSIST": {
                            playerStats.Enemies ??= [];
                            const enemyStatKey = (
                                {
                                    KILL_ENEMY: "kills",
                                    EXECUTE_ENEMY: "executions",
                                    HEADSHOT: "headshots",
                                    KILL_ASSIST: "assists"
                                } as const
                            )[category];

                            for (const [type, count] of Object.entries(data as IUploadEntry)) {
                                let enemy = playerStats.Enemies.find(element => element.type === type);
                                if (!enemy) {
                                    enemy = { type: type };
                                    playerStats.Enemies.push(enemy);
                                }
                                if (category === "KILL_ENEMY") {
                                    enemy.kills ??= 0;
                                    const captureCount = (actionData as IStatsAdd)["CAPTURE_ENEMY"]?.[type];
                                    if (captureCount) {
                                        enemy.kills += Math.max(count - captureCount, 0);
                                        enemy.captures ??= 0;
                                        enemy.captures += captureCount;
                                    } else {
                                        enemy.kills += count;
                                    }
                                } else {
                                    enemy[enemyStatKey] ??= 0;
                                    enemy[enemyStatKey] += count;
                                }
                            }
                            break;
                        }

                        case "DIE":
                            playerStats.Enemies ??= [];
                            playerStats.Deaths ??= 0;
                            for (const [type, deaths] of Object.entries(data as IUploadEntry)) {
                                playerStats.Deaths += deaths;
                                const enemy = playerStats.Enemies.find(element => element.type === type);
                                if (enemy) {
                                    enemy.deaths ??= 0;
                                    enemy.deaths += deaths;
                                } else {
                                    playerStats.Enemies.push({ type: type, deaths });
                                }
                            }
                            break;

                        case "MELEE_KILL":
                            playerStats.MeleeKills ??= 0;
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            for (const [_key, kills] of Object.entries(data as IUploadEntry)) {
                                playerStats.MeleeKills += kills;
                            }
                            break;

                        case "INCOME":
                            playerStats.Income ??= 0;
                            playerStats.Income += data;
                            break;

                        case "CIPHER":
                            if ((data as IUploadEntry)["0"] > 0) {
                                playerStats.CiphersFailed ??= 0;
                                playerStats.CiphersFailed += (data as IUploadEntry)["0"];
                            }
                            if ((data as IUploadEntry)["1"] > 0) {
                                playerStats.CiphersSolved ??= 0;
                                playerStats.CiphersSolved += (data as IUploadEntry)["1"];
                            }
                            break;

                        default:
                            if (!ignoredCategories.includes(category)) {
                                unknownCategories[action] ??= [];
                                unknownCategories[action].push(category);
                            }
                            break;
                    }
                }
                break;

            case "timers":
                for (const [category, data] of Object.entries(actionData as IStatsTimers)) {
                    switch (category) {
                        case "EQUIP_WEAPON":
                            playerStats.Weapons ??= [];
                            for (const [type, equipTime] of Object.entries(data as IUploadEntry)) {
                                const weapon = playerStats.Weapons.find(element => element.type === type);
                                if (weapon) {
                                    weapon.equipTime ??= 0;
                                    weapon.equipTime += equipTime;
                                } else {
                                    playerStats.Weapons.push({ type: type, equipTime });
                                }
                            }
                            break;

                        case "CURRENT_MISSION_TIME":
                            playerStats.TimePlayedSec ??= 0;
                            playerStats.TimePlayedSec += data;
                            break;

                        case "CIPHER_TIME":
                            playerStats.CipherTime ??= 0;
                            playerStats.CipherTime += data;
                            break;

                        default:
                            if (!ignoredCategories.includes(category)) {
                                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                if (!unknownCategories[action]) {
                                    unknownCategories[action] = [];
                                }
                                unknownCategories[action].push(category);
                            }
                            break;
                    }
                }
                break;

            case "max":
                for (const [category, data] of Object.entries(actionData as IStatsMax)) {
                    switch (category) {
                        case "WEAPON_XP":
                            playerStats.Weapons ??= [];
                            for (const [type, xp] of Object.entries(data as IUploadEntry)) {
                                const weapon = playerStats.Weapons.find(element => element.type === type);
                                if (weapon) {
                                    if (xp > (weapon.xp ?? 0)) {
                                        weapon.xp = xp;
                                    }
                                } else {
                                    playerStats.Weapons.push({ type: type, xp });
                                }
                            }
                            break;

                        case "MISSION_SCORE":
                            playerStats.Missions ??= [];
                            for (const [type, highScore] of Object.entries(data as IUploadEntry)) {
                                const mission = playerStats.Missions.find(element => element.type === type);
                                if (mission) {
                                    if (highScore > mission.highScore) {
                                        mission.highScore = highScore;
                                    }
                                } else {
                                    playerStats.Missions.push({ type: type, highScore });
                                }
                                await submitLeaderboardScore(
                                    "weekly",
                                    type,
                                    accountOwnerId,
                                    payload.displayName,
                                    highScore,
                                    payload.guildId
                                );
                                break;
                            }
                            break;

                        case "RACE_SCORE":
                            playerStats.Races ??= new Map();

                            for (const [race, highScore] of Object.entries(data as Record<string, number>)) {
                                const currentRace = playerStats.Races.get(race);

                                if (currentRace) {
                                    if (highScore > currentRace.highScore) {
                                        playerStats.Races.set(race, { highScore });
                                    }
                                } else {
                                    playerStats.Races.set(race, { highScore });
                                }

                                await submitLeaderboardScore(
                                    "daily",
                                    race,
                                    accountOwnerId,
                                    payload.displayName,
                                    highScore,
                                    payload.guildId
                                );
                            }

                            break;

                        case "ZephyrScore":
                        case "CaliberChicksScore":
                            playerStats[category] ??= 0;
                            if (data > playerStats[category]) playerStats[category] = data as number;
                            break;

                        case "SentinelGameScore":
                            playerStats[category] ??= 0;
                            if (data > playerStats[category]) playerStats[category] = data as number;
                            await submitLeaderboardScore(
                                "weekly",
                                category,
                                accountOwnerId,
                                payload.displayName,
                                data as number,
                                payload.guildId
                            );
                            break;

                        case "DojoObstacleScore":
                            playerStats[category] ??= 0;
                            if (data > playerStats[category]) playerStats[category] = data as number;
                            await submitLeaderboardScore(
                                "weekly",
                                category,
                                accountOwnerId,
                                payload.displayName,
                                data as number,
                                payload.guildId
                            );
                            break;

                        case "OlliesCrashCourseScore":
                            playerStats[category] ??= 0;
                            if (!playerStats[category]) {
                                const inventory = await getInventory(accountOwnerId, "EmailItems");
                                await addEmailItem(
                                    inventory,
                                    "/Lotus/Types/Items/EmailItems/PlayedOlliesCrashCourseEmailItem"
                                );
                            }
                            if (data >= 9991000 && playerStats[category] < 9991000) {
                                const inventory = await getInventory(accountOwnerId, "EmailItems");
                                await addEmailItem(
                                    inventory,
                                    "/Lotus/Types/Items/EmailItems/BeatOlliesCrashCourseInNinetySecEmailItem"
                                );
                            }
                            if (data > playerStats[category]) playerStats[category] = data as number;
                            await submitLeaderboardScore(
                                "weekly",
                                category,
                                accountOwnerId,
                                payload.displayName,
                                data as number,
                                payload.guildId
                            );
                            break;

                        default:
                            if (!ignoredCategories.includes(category)) {
                                unknownCategories[action] ??= [];
                                unknownCategories[action].push(category);
                            }
                            break;
                    }
                }
                break;

            case "set":
                for (const [category, value] of Object.entries(actionData as IStatsSet)) {
                    switch (category) {
                        case "ELO_RATING":
                            playerStats.Rating = value as number;
                            break;

                        case "RANK":
                            playerStats.Rank = value as number;
                            break;

                        case "PLAYER_LEVEL":
                            playerStats.PlayerLevel = value as number;
                            break;

                        default:
                            if (!ignoredCategories.includes(category)) {
                                unknownCategories[action] ??= [];
                                unknownCategories[action].push(category);
                            }
                            break;
                    }
                }
                break;

            case "displayName":
            case "guildId":
                break;

            default:
                logger.debug(`Unknown updateStats action: ${action}`);
                break;
        }
    }

    for (const [action, categories] of Object.entries(unknownCategories)) {
        logger.debug(`Unknown updateStats ${action} action categories: ${categories.join(", ")}`);
    }

    await playerStats.save();
};

const ignoredCategories = [
    //add action
    "MISSION_STARTED",
    "HOST_OS",
    "CPU_CORES",
    "CPU_MODEL",
    "CPU_VENDOR",
    "GPU_CLASS",
    "GFX_DRIVER",
    "GFX_RESOLUTION",
    "GFX_ASPECT",
    "GFX_WINDOW",
    "GPU_VENDOR",
    "GFX_HDR",
    "SPEAKER_COUNT",
    "MISSION_MATCHMAKING",
    "PLAYER_COUNT",
    "HOST_MIGRATION",
    "DESTROY_DECORATION",
    "MOVEMENT",
    "RECEIVE_UPGRADE",
    "EQUIP_COSMETIC",
    "EQUIP_UPGRADE",
    "MISSION_TYPE",
    "MISSION_FACTION",
    "MISSION_PLAYED",
    "MISSION_PLAYED_TIME",
    "CPU_CLOCK",
    "CPU_FEATURE",
    "RAM",
    "ADDR_SPACE",
    "GFX_SCALE",
    "LOGINS",
    "GPU_MODEL",
    "MEDALS_TOP",
    "STATS_TIMERS_RESET",
    "INPUT_ACTIVITY_TIME",
    "LOGINS_ITEM",
    "TAKE_DAMAGE",
    "SQUAD_KILL_ENEMY",
    "SQUAD_HEADSHOT",
    "SQUAD_MELEE_KILL",
    "MELEE_KILL_ITEM",
    "TAKE_DAMAGE_ITEM",
    "SQUAD_KILL_ENEMY_ITEM",
    "SQUAD_HEADSHOT_ITEM",
    "SQUAD_MELEE_KILL_ITEM",
    "PRE_DIE",
    "PRE_DIE_ITEM",
    "GEAR_USED",
    "DIE_ITEM",
    "CAPTURE_ENEMY", // handled in KILL_ENEMY

    // timers action
    "IN_SHIP_TIME",
    "IN_SHIP_VIEW_TIME",
    "MISSION_LOAD_TIME",
    "MISSION_TIME",
    "REGION_TIME",
    "PLATFORM_TIME",
    "PRE_DIE_TIME",
    "VEHICLE_TIME"
];
