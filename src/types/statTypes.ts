import { Types } from "mongoose";

export interface IStatsView {
    CiphersSolved?: number;
    CiphersFailed?: number;
    CipherTime?: number;
    Weapons?: IWeapon[];
    Enemies?: IEnemy[];
    MeleeKills?: number;
    MissionsCompleted?: number;
    MissionsQuit?: number;
    MissionsFailed?: number;
    TimePlayedSec?: number;
    PickupCount?: number;
    Tutorial?: { [key: string]: ITutorial };
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
}

export interface IStatsDatabase extends IStatsView {
    accountOwnerId: Types.ObjectId;
}

export interface IAbility {
    used: number;
    type: string;
}

export interface IEnemy {
    executions?: number;
    headshots?: number;
    kills?: number;
    type: string;
    assists?: number;
    deaths?: number;
}

export interface IMission {
    highScore: number;
    type: string;
}

export interface IScan {
    scans: number;
    type: string;
}

export interface ITutorial {
    stage: number;
}

export interface IWeapon {
    equipTime?: number;
    hits?: number;
    kills?: number;
    xp?: number;
    assists?: number;
    type: string;
    headshots?: number;
    fired?: number;
}

export interface IStatsUpload {
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
}

export interface IUploadEntry {
    [key: string]: number;
}

export interface IStatsMax {
    WEAPON_XP?: IUploadEntry;
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
