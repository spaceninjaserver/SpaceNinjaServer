import { IUpgrade } from "warframe-public-export-plus";
import { getRandomElement } from "../services/rngService";

export interface IUnveiledRivenFingerprint {
    compat: string;
    lim: 0;
    lvl: number;
    lvlReq: number;
    rerolls?: number;
    pol: string;
    buffs: IRivenStat[];
    curses: IRivenStat[];
}

interface IRivenStat {
    Tag: string;
    Value: number;
}

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
        );
        fingerprint.curses.push({ Tag: entry.tag, Value: Math.trunc(Math.random() * 0x40000000) });
    }
};
