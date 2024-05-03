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
