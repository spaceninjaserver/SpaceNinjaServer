import type { IUpgrade } from "warframe-public-export-plus";
import { getRandomElement, getRandomInt, getRandomReward } from "../services/rngService.ts";

export type RivenFingerprint = IVeiledRivenFingerprint | IUnveiledRivenFingerprint;

export interface IVeiledRivenFingerprint {
    challenge: IRivenChallenge;
}

export interface IRivenChallenge {
    Type: string;
    Progress: number;
    Required: number;
    Complication?: string;
}

export interface IUnveiledRivenFingerprint {
    compat: string;
    lim: 0;
    lvl: number;
    lvlReq: number;
    rerolls?: number;
    pol: string;
    buffs: IFingerprintStat[];
    curses: IFingerprintStat[];
}

export interface IFingerprintStat {
    Tag: string;
    Value: number;
}

export const createVeiledRivenFingerprint = (meta: IUpgrade): IVeiledRivenFingerprint => {
    const challenge = getRandomElement(meta.availableChallenges!)!;
    const fingerprintChallenge: IRivenChallenge = {
        Type: challenge.fullName,
        Progress: 0,
        Required: getRandomInt(challenge.countRange[0], challenge.countRange[1])
    };
    if (Math.random() < challenge.complicationChance) {
        const complications: { type: string; probability: number }[] = [];
        for (const complication of challenge.complications) {
            complications.push({
                type: complication.fullName,
                probability: complication.weight
            });
        }
        fingerprintChallenge.Complication = getRandomReward(complications)!.type;
        const complication = challenge.complications.find(x => x.fullName == fingerprintChallenge.Complication)!;
        fingerprintChallenge.Required *= complication.countMultiplier;
    }
    return { challenge: fingerprintChallenge };
};

export const createUnveiledRivenFingerprint = (meta: IUpgrade): IUnveiledRivenFingerprint => {
    const fingerprint: IUnveiledRivenFingerprint = {
        compat: getRandomElement(meta.compatibleItems!)!,
        lim: 0,
        lvl: 0,
        lvlReq: getRandomInt(8, 16),
        pol: getRandomElement(["AP_ATTACK", "AP_DEFENSE", "AP_TACTIC"])!,
        buffs: [],
        curses: []
    };
    randomiseRivenStats(meta, fingerprint);
    return fingerprint;
};

export const randomiseRivenStats = (meta: IUpgrade, fingerprint: IUnveiledRivenFingerprint): void => {
    fingerprint.buffs = [];
    const numBuffs = 2 + Math.trunc(Math.random() * 2); // 2 or 3
    const buffEntries = meta.upgradeEntries!.filter(x => x.canBeBuff);
    for (let i = 0; i != numBuffs; ++i) {
        const buffIndex = Math.trunc(Math.random() * buffEntries.length);
        const entry = buffEntries[buffIndex];
        fingerprint.buffs.push({ Tag: entry.tag, Value: Math.trunc(Math.random() * 0x40000000) });
        buffEntries.splice(buffIndex, 1);
    }

    fingerprint.curses = [];
    if (Math.random() < 0.5) {
        const entry = getRandomElement(
            meta.upgradeEntries!.filter(x => x.canBeCurse && !fingerprint.buffs.find(y => y.Tag == x.tag))
        )!;
        fingerprint.curses.push({ Tag: entry.tag, Value: Math.trunc(Math.random() * 0x40000000) });
    }
};

export const rivenRawToRealWeighted: Record<string, string[]> = {
    "/Lotus/Upgrades/Mods/Randomized/RawArchgunRandomMod": [
        "/Lotus/Upgrades/Mods/Randomized/LotusArchgunRandomModRare"
    ],
    "/Lotus/Upgrades/Mods/Randomized/RawMeleeRandomMod": [
        "/Lotus/Upgrades/Mods/Randomized/PlayerMeleeWeaponRandomModRare"
    ],
    "/Lotus/Upgrades/Mods/Randomized/RawModularMeleeRandomMod": [
        "/Lotus/Upgrades/Mods/Randomized/LotusModularMeleeRandomModRare"
    ],
    "/Lotus/Upgrades/Mods/Randomized/RawModularPistolRandomMod": [
        "/Lotus/Upgrades/Mods/Randomized/LotusModularPistolRandomModRare"
    ],
    "/Lotus/Upgrades/Mods/Randomized/RawPistolRandomMod": ["/Lotus/Upgrades/Mods/Randomized/LotusPistolRandomModRare"],
    "/Lotus/Upgrades/Mods/Randomized/RawRifleRandomMod": ["/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare"],
    "/Lotus/Upgrades/Mods/Randomized/RawShotgunRandomMod": [
        "/Lotus/Upgrades/Mods/Randomized/LotusShotgunRandomModRare"
    ],
    "/Lotus/Upgrades/Mods/Randomized/RawSentinelWeaponRandomMod": [
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusShotgunRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusPistolRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/PlayerMeleeWeaponRandomModRare"
    ]
};
