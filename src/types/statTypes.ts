import { Types } from "mongoose";

export interface IStatsClient {
    CiphersSolved?: number;
    CiphersFailed?: number;
    CipherTime?: number;
    Weapons?: IWeapon[];
    Enemies?: IEnemy[];
    MeleeKills?: number;
    MissionsCompleted?: number;
    MissionsQuit?: number;
    MissionsFailed?: number;
    MissionsInterrupted?: number;
    MissionsDumped?: number;
    TimePlayedSec?: number;
    PickupCount?: number;
    Tutorial?: Map<string, ITutorial>;
    Abilities?: IAbility[];
    Rating?: number;
    Income?: number;
    Rank?: number;
    PlayerLevel?: number;
    Scans?: IScan[];
    Missions?: IMission[];
    Deaths?: number;
    HealCount?: number;
    ReviveCount?: number;
    Races?: Map<string, IRace>;
    ZephyrScore?: number;
    SentinelGameScore?: number;
    CaliberChicksScore?: number;
    OlliesCrashCourseScore?: number;
    DojoObstacleScore?: number;

    // event scores
    Halloween16?: number;
    AmalgamEventScoreMax?: number;
    Halloween19ScoreMax?: number;
    FlotillaEventScore?: number;
    FlotillaSpaceBadgesTier1?: number;
    FlotillaSpaceBadgesTier2?: number;
    FlotillaSpaceBadgesTier3?: number;
    FlotillaGroundBadgesTier1?: number;
    FlotillaGroundBadgesTier2?: number;
    FlotillaGroundBadgesTier3?: number;
    MechSurvivalScoreMax?: number;

    // not in schema
    PVP?: {
        suitDeaths?: number;
        suitKills?: number;
        weaponKills?: number;
        type: string;
    }[];
}

export interface IStatsDatabase extends IStatsClient {
    accountOwnerId: Types.ObjectId;
}

export interface IAbility {
    type: string;
    used: number;
}

export interface IEnemy {
    type: string;
    executions?: number;
    headshots?: number;
    kills?: number;
    assists?: number;
    deaths?: number;
    captures?: number;
}

export interface IMission {
    type: string;
    highScore: number;
}

export interface IScan {
    type: string;
    scans: number;
}

export interface ITutorial {
    stage: number;
}

export interface IWeapon {
    type: string;
    equipTime?: number;
    hits?: number;
    kills?: number;
    xp?: number;
    assists?: number;
    headshots?: number;
    fired?: number;
}

export interface IRace {
    highScore: number;
}

export interface IStatsUpdate {
    displayName: string;
    guildId?: string;
    PS?: string;
    add?: IStatsAdd;
    set?: IStatsSet;
    max?: IStatsMax;
    timers?: IStatsTimers;
}

export interface IStatsAdd {
    GEAR_USED?: IUploadEntry;
    SCAN?: IUploadEntry;
    MISSION_COMPLETE?: IUploadEntry;
    HEADSHOT_ITEM?: IUploadEntry;
    HEADSHOT?: IUploadEntry;
    PLAYER_COUNT?: IUploadEntry;
    HOST_MIGRATION?: IUploadEntry;
    PICKUP_ITEM?: IUploadEntry;
    FIRE_WEAPON?: IUploadEntry;
    HIT_ENTITY_ITEM?: IUploadEntry;
    DESTROY_DECORATION?: IUploadEntry;
    KILL_ENEMY?: IUploadEntry;
    TAKE_DAMAGE?: IUploadEntry;
    SQUAD_KILL_ENEMY?: IUploadEntry;
    RECEIVE_UPGRADE?: IUploadEntry;
    USE_ABILITY?: IUploadEntry;
    SQUAD_VIP_KILL?: IUploadEntry;
    HEAL_BUDDY?: IUploadEntry;
    INCOME?: number;
    CIPHER?: IUploadEntry;
    EQUIP_COSMETIC?: IUploadEntry;
    EQUIP_UPGRADE?: IUploadEntry;
    KILL_BOSS?: IUploadEntry;
    MISSION_TYPE?: IUploadEntry;
    MISSION_FACTION?: IUploadEntry;
    MISSION_PLAYED?: IUploadEntry;
    MISSION_PLAYED_TIME?: IUploadEntry;
    MEDALS_TOP?: IUploadEntry;
    INPUT_ACTIVITY_TIME?: IUploadEntry;
    KILL_ENEMY_ITEM?: IUploadEntry;
    TAKE_DAMAGE_ITEM?: IUploadEntry;
    SQUAD_KILL_ENEMY_ITEM?: IUploadEntry;
    MELEE_KILL?: IUploadEntry;
    SQUAD_MELEE_KILL?: IUploadEntry;
    MELEE_KILL_ITEM?: IUploadEntry;
    SQUAD_MELEE_KILL_ITEM?: IUploadEntry;
    DIE?: IUploadEntry;
    DIE_ITEM?: IUploadEntry;
    EXECUTE_ENEMY?: IUploadEntry;
    EXECUTE_ENEMY_ITEM?: IUploadEntry;
    KILL_ASSIST?: IUploadEntry;
    KILL_ASSIST_ITEM?: IUploadEntry;
    CAPTURE_ENEMY?: IUploadEntry;
}

export interface IUploadEntry {
    [key: string]: number;
}

export interface IStatsMax {
    WEAPON_XP?: IUploadEntry;
    MISSION_SCORE?: IUploadEntry;
    RACE_SCORE?: IUploadEntry;
    ZephyrScore?: number;
    SentinelGameScore?: number;
    CaliberChicksScore?: number;
    OlliesCrashCourseScore?: number;
    DojoObstacleScore?: number;
}

export interface IStatsSet {
    ELO_RATING?: number;
    RANK?: number;
    PLAYER_LEVEL?: number;
}

export interface IStatsTimers {
    IN_SHIP_TIME?: number;
    IN_SHIP_VIEW_TIME?: IUploadEntry;
    EQUIP_WEAPON?: IUploadEntry;
    MISSION_TIME?: IUploadEntry;
    REGION_TIME?: IUploadEntry;
    PLATFORM_TIME?: IUploadEntry;
    CURRENT_MISSION_TIME?: number;
    CIPHER_TIME?: number;
}
