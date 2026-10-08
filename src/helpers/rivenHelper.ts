import { ExportWeapons, type IUpgrade } from "warframe-public-export-plus";
import { getRandomElement, getRandomInt, getRandomReward } from "../services/rngService.ts";
import { logger } from "../utils/logger.ts";

export type RivenFingerprint = IVeiledRivenFingerprint | IUnveiledRivenFingerprint;

export interface IVeiledRivenFingerprint {
    challenge: IRivenChallenge;
    IsSentinel?: true;
}

interface IRivenChallenge {
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
    curses?: IFingerprintStat[];
    IsSentinel?: true;
}

export interface IFingerprintStat {
    Tag: string;
    Value: number;
}

export const createVeiledRivenFingerprint = (meta: IUpgrade, IsSentinel: true | undefined): IVeiledRivenFingerprint => {
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
    return { challenge: fingerprintChallenge, IsSentinel };
};

export const createUnveiledRivenFingerprint = (
    meta: IUpgrade,
    IsSentinel: true | undefined
): IUnveiledRivenFingerprint => {
    const fingerprint: IUnveiledRivenFingerprint = {
        compat: getRandomElement(
            meta.compatibleItems!.filter(weaponType => {
                // "Although Beast Companions had their weapons separated in Update 37.0, Veiled Companion Riven mods can still only become mods for Robotic Weapons." (https://wiki.warframe.com/w/Riven%20Mods)
                // ^ To be faithful to this, we're checking for the SENTINEL_WEAPON compatibility tag instead of the "SentinelWeapons" productCategory.
                const isSentinelWeapon =
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    (ExportWeapons[weaponType]?.compatibilityTags?.indexOf("SENTINEL_WEAPON") ?? -1) != -1;
                return IsSentinel ? isSentinelWeapon : !isSentinelWeapon;
            })
        )!,
        lim: 0,
        lvl: 0,
        lvlReq: getRandomInt(8, 16),
        pol: getRandomElement(["AP_ATTACK", "AP_DEFENSE", "AP_TACTIC"])!,
        buffs: [],
        curses: [],
        IsSentinel
    };
    randomiseRivenStats(meta, fingerprint);
    return fingerprint;
};

export const randomiseRivenStats = (
    meta: IUpgrade,
    fingerprint: IUnveiledRivenFingerprint,
    lockedTraits?: string[]
): void => {
    // With a locked trait, the number of buffs and curses stays the same
    const hasLock = !!lockedTraits?.length;
    const numBuffs = hasLock ? fingerprint.buffs.length : 2 + Math.trunc(Math.random() * 2); // 2 or 3
    const numCurses = hasLock ? (fingerprint.curses?.length ?? 0) : Math.random() < 0.5 ? 1 : 0;

    fingerprint.buffs = hasLock ? fingerprint.buffs.filter(x => lockedTraits!.includes(x.Tag)) : [];
    fingerprint.curses = hasLock ? (fingerprint.curses ?? []).filter(x => lockedTraits!.includes(x.Tag)) : [];

    const isUsed = (tag: string): boolean =>
        fingerprint.buffs.some(y => y.Tag == tag) || fingerprint.curses!.some(y => y.Tag == tag);

    while (fingerprint.buffs.length < numBuffs) {
        const entry = getRandomElement(
            meta.upgradeEntries!.filter(x => x.canBeBuff && !x.isAdvancedTrait && !isUsed(x.tag))
        );
        if (!entry) {
            logger.warn(`no unused buff left, riven has ${fingerprint.buffs.length}/${numBuffs}`);
            break;
        }
        fingerprint.buffs.push({ Tag: entry.tag, Value: Math.trunc(Math.random() * 0x40000000) });
    }

    while (fingerprint.curses.length < numCurses) {
        const entry = getRandomElement(
            meta.upgradeEntries!.filter(x => x.canBeCurse && !x.isAdvancedTrait && !isUsed(x.tag))
        );
        if (!entry) {
            logger.warn(`no unused curse left, riven has ${fingerprint.curses.length}/${numCurses}`);
            break;
        }
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
