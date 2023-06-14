export interface Polarity {
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

export interface Color {
    t0?: number;
    t1?: number;
    t2?: number;
    t3?: number;
    en?: number;
    e1?: number;
    m0?: number;
    m1?: number;
}

export interface AbilityOverride {
    Ability: string;
    Index: number;
}

export interface SlotsBin {
    Slots: number;
}

export interface sigcol {
    t0: number;
    t1: number;
    en: number;
}
