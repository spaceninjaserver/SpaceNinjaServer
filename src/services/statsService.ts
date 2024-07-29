import Stats from "@/src/models/statsModel";
import { IStatsUpload } from "@/src/types/statTypes";

/*
    Missing in stats update

    Weapons?: IWeapon[]; // assists
    Enemies?: IEnemy[]; // assists
    Tutorial?: { [key: string]: ITutorial };
    Missions?: IMission[];
    HealCount?: number;
    ReviveCount?: number;
*/

export const uploadStats = async (accountId: string, payload: IStatsUpload): Promise<void> => {
    let playerStats = await Stats.findOne({ accountOwnerId: accountId });
    if (!playerStats) {
        playerStats = new Stats({ accountOwnerId: accountId });
    }

    if (payload.add) {
        const {
            MISSION_COMPLETE,
            PICKUP_ITEM,
            SCAN,
            USE_ABILITY,
            FIRE_WEAPON,
            HIT_ENTITY_ITEM,
            HEADSHOT_ITEM,
            KILL_ENEMY_ITEM,
            KILL_ENEMY,
            EXECUTE_ENEMY,
            HEADSHOT,
            DIE,
            MELEE_KILL,
            INCOME,
            CIPHER
        } = payload.add;

        if (MISSION_COMPLETE) {
            for (const [key, value] of Object.entries(MISSION_COMPLETE)) {
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
                }
            }
        }

        if (PICKUP_ITEM) {
            for (const value of Object.values(PICKUP_ITEM)) {
                playerStats.PickupCount ??= 0;
                playerStats.PickupCount += value;
            }
        }

        if (SCAN) {
            for (const [key, scans] of Object.entries(SCAN)) {
                playerStats.Scans ??= [];
                const scan = playerStats.Scans.find(element => element.type === key);
                if (scan) {
                    scan.scans ??= 0;
                    scan.scans += scans;
                } else {
                    playerStats.Scans.push({ type: key, scans });
                }
            }
        }

        if (USE_ABILITY) {
            for (const [key, used] of Object.entries(USE_ABILITY)) {
                playerStats.Abilities ??= [];
                const ability = playerStats.Abilities.find(element => element.type === key);
                if (ability) {
                    ability.used ??= 0;
                    ability.used += used;
                } else {
                    playerStats.Abilities.push({ type: key, used });
                }
            }
        }

        if (FIRE_WEAPON) {
            for (const [key, fired] of Object.entries(FIRE_WEAPON)) {
                playerStats.Weapons ??= [];
                const weapon = playerStats.Weapons.find(element => element.type === key);
                if (weapon) {
                    weapon.fired ??= 0;
                    weapon.fired += fired;
                } else {
                    playerStats.Weapons.push({ type: key, fired });
                }
            }
        }

        if (HIT_ENTITY_ITEM) {
            for (const [key, hits] of Object.entries(HIT_ENTITY_ITEM)) {
                playerStats.Weapons ??= [];
                const weapon = playerStats.Weapons.find(element => element.type === key);
                if (weapon) {
                    weapon.hits ??= 0;
                    weapon.hits += hits;
                } else {
                    playerStats.Weapons.push({ type: key, hits });
                }
            }
        }

        if (HEADSHOT_ITEM) {
            for (const [key, headshots] of Object.entries(HEADSHOT_ITEM)) {
                playerStats.Weapons ??= [];
                const weapon = playerStats.Weapons.find(element => element.type === key);
                if (weapon) {
                    weapon.headshots ??= 0;
                    weapon.headshots += headshots;
                } else {
                    playerStats.Weapons.push({ type: key, headshots });
                }
            }
        }

        if (KILL_ENEMY_ITEM) {
            for (const [key, kills] of Object.entries(KILL_ENEMY_ITEM)) {
                playerStats.Weapons ??= [];
                const weapon = playerStats.Weapons.find(element => element.type === key);
                if (weapon) {
                    weapon.kills ??= 0;
                    weapon.kills += kills;
                } else {
                    playerStats.Weapons.push({ type: key, kills });
                }
            }
        }

        if (KILL_ENEMY) {
            for (const [key, kills] of Object.entries(KILL_ENEMY)) {
                playerStats.Enemies ??= [];
                const enemy = playerStats.Enemies.find(element => element.type === key);
                if (enemy) {
                    enemy.kills ??= 0;
                    enemy.kills += kills;
                } else {
                    playerStats.Enemies.push({ type: key, kills });
                }
            }
        }

        if (EXECUTE_ENEMY) {
            for (const [key, executions] of Object.entries(EXECUTE_ENEMY)) {
                playerStats.Enemies ??= [];
                const enemy = playerStats.Enemies.find(element => element.type === key);
                if (enemy) {
                    enemy.executions ??= 0;
                    enemy.executions += executions;
                } else {
                    playerStats.Enemies.push({ type: key, executions });
                }
            }
        }

        if (HEADSHOT) {
            for (const [key, headshots] of Object.entries(HEADSHOT)) {
                playerStats.Enemies ??= [];
                const enemy = playerStats.Enemies.find(element => element.type === key);
                if (enemy) {
                    enemy.headshots ??= 0;
                    enemy.headshots += headshots;
                } else {
                    playerStats.Enemies.push({ type: key, headshots });
                }
            }
        }

        if (DIE) {
            for (const [key, deaths] of Object.entries(DIE)) {
                playerStats.Deaths ??= 0;
                playerStats.Deaths += deaths;
                playerStats.Enemies ??= [];
                const enemy = playerStats.Enemies.find(element => element.type === key);
                if (enemy) {
                    enemy.deaths ??= 0;
                    enemy.deaths += deaths;
                } else {
                    playerStats.Enemies.push({ type: key, deaths });
                }
            }
        }

        if (MELEE_KILL) {
            playerStats.MeleeKills ??= 0;
            for (const kills of Object.values(MELEE_KILL)) {
                playerStats.MeleeKills += kills;
            }
        }

        if (INCOME) {
            playerStats.Income ??= 0;
            playerStats.Income += INCOME;
        }

        if (CIPHER) {
            if (CIPHER["0"] > 0) {
                playerStats.CiphersFailed ??= 0;
                playerStats.CiphersFailed += CIPHER["0"];
            }
            if (CIPHER["1"] > 0) {
                playerStats.CiphersSolved ??= 0;
                playerStats.CiphersSolved += CIPHER["1"];
            }
        }
    }

    if (payload.timers) {
        const { EQUIP_WEAPON, CURRENT_MISSION_TIME, CIPHER_TIME } = payload.timers;

        if (EQUIP_WEAPON) {
            for (const [key, equipTime] of Object.entries(EQUIP_WEAPON)) {
                playerStats.Weapons ??= [];
                const weapon = playerStats.Weapons.find(element => element.type === key);
                if (weapon) {
                    weapon.equipTime ??= 0;
                    weapon.equipTime += equipTime;
                } else {
                    playerStats.Weapons.push({ type: key, equipTime });
                }
            }
        }

        if (CURRENT_MISSION_TIME) {
            playerStats.TimePlayedSec ??= 0;
            playerStats.TimePlayedSec += CURRENT_MISSION_TIME;
        }

        if (CIPHER_TIME) {
            playerStats.CipherTime ??= 0;
            playerStats.CipherTime += CIPHER_TIME;
        }
    }

    if (payload.max) {
        const { WEAPON_XP } = payload.max;
        if (WEAPON_XP) {
            for (const [key, xp] of Object.entries(WEAPON_XP)) {
                playerStats.Weapons ??= [];
                const weapon = playerStats.Weapons.find(element => element.type === key);
                if (weapon) {
                    weapon.xp ??= 0;
                    weapon.xp += xp;
                } else {
                    playerStats.Weapons.push({ type: key, xp });
                }
            }
        }
    }

    if (payload.set) {
        const { ELO_RATING, RANK, PLAYER_LEVEL } = payload.set;
        if (ELO_RATING) playerStats.Rating = ELO_RATING;
        if (RANK) playerStats.Rank = RANK;
        if (PLAYER_LEVEL) playerStats.PlayerLevel = PLAYER_LEVEL;
    }

    await playerStats.save();
};
