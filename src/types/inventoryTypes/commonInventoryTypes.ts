export interface IPolarity {
    Slot: number;
    Value: FocusSchool;
}

export enum FocusSchool {
    ApAny = "AP_ANY",
    ApAttack = "AP_ATTACK",
    ApDefense = "AP_DEFENSE",
    ApPower = "AP_POWER",
    ApPrecept = "AP_PRECEPT",
    ApTactic = "AP_TACTIC",
    ApUmbra = "AP_UMBRA",
    ApUniversal = "AP_UNIVERSAL",
    ApWard = "AP_WARD"
}

export interface IColor {
    t0?: number;
    t1?: number;
    t2?: number;
    t3?: number;
    en?: number;
    e1?: number;
    m0?: number;
    m1?: number;
}

export interface IAbilityOverride {
    Ability: string;
    Index: number;
}

export interface ISlotsBin {
    Slots: number;
}

// ISigCol? IsIgCoL? ISIGCOL!
export interface Isigcol {
    t0: number;
    t1: number;
    en: number;
}
