import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, getInventory } from "@/src/services/inventoryService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { ExportUpgrades } from "warframe-public-export-plus";
import { getRandomElement } from "@/src/services/rngService";

export const rerollRandomModController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = getJSONfromString(String(req.body)) as RerollRandomModRequest;
    if ("ItemIds" in request) {
        const upgrade = inventory.Upgrades.find(x => x._id?.toString() == request.ItemIds[0])!;
        const fingerprint = JSON.parse(upgrade.UpgradeFingerprint!) as IUnveiledRivenFingerprint;

        const kuvaCost = fingerprint.rerolls < rerollCosts.length ? rerollCosts[fingerprint.rerolls] : 3500;
        addMiscItems(inventory, [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/Kuva",
                ItemCount: kuvaCost * -1
            }
        ]);

        fingerprint.rerolls++;
        upgrade.UpgradeFingerprint = JSON.stringify(fingerprint);

        randomiseStats(upgrade.ItemType, fingerprint);
        upgrade.PendingRerollFingerprint = JSON.stringify(fingerprint);

        await inventory.save();

        res.json({
            changes: [
                {
                    ItemId: { $oid: request.ItemIds[0] },
                    UpgradeFingerprint: upgrade.UpgradeFingerprint,
                    PendingRerollFingerprint: upgrade.PendingRerollFingerprint
                }
            ],
            cost: kuvaCost
        });
    } else {
        const upgrade = inventory.Upgrades.find(x => x._id?.toString() == request.ItemId)!;
        if (request.CommitReroll && upgrade.PendingRerollFingerprint) {
            upgrade.UpgradeFingerprint = upgrade.PendingRerollFingerprint;
        }
        upgrade.PendingRerollFingerprint = undefined;
        await inventory.save();
        res.send(upgrade.UpgradeFingerprint);
    }
};

const randomiseStats = (randomModType: string, fingerprint: IUnveiledRivenFingerprint): void => {
    const meta = ExportUpgrades[randomModType];

    fingerprint.buffs = [];
    const numBuffs = 2 + Math.trunc(Math.random() * 2); // 2 or 3
    for (let i = 0; i != numBuffs; ++i) {
        let entry = getRandomElement(meta.upgradeEntries!);
        while (!entry.canBeBuff) {
            entry = getRandomElement(meta.upgradeEntries!);
        }
        fingerprint.buffs.push({ Tag: entry.tag, Value: Math.trunc(Math.random() * 0x40000000) });
    }

    fingerprint.curses = [];
    const numCurses = Math.trunc(Math.random() * 2); // 0 or 1
    for (let i = 0; i != numCurses; ++i) {
        let entry = getRandomElement(meta.upgradeEntries!);
        while (!entry.canBeCurse) {
            entry = getRandomElement(meta.upgradeEntries!);
        }
        fingerprint.curses.push({ Tag: entry.tag, Value: Math.trunc(Math.random() * 0x40000000) });
    }
};

type RerollRandomModRequest = LetsGoGamblingRequest | AwDangitRequest;

interface LetsGoGamblingRequest {
    ItemIds: string[];
}

interface AwDangitRequest {
    ItemId: string;
    CommitReroll: boolean;
}

interface IUnveiledRivenFingerprint {
    compat: string;
    lim: number;
    lvl: number;
    lvlReq: 0;
    rerolls: number;
    pol: string;
    buffs: IRivenStat[];
    curses: IRivenStat[];
}

interface IRivenStat {
    Tag: string;
    Value: number;
}

const rerollCosts = [900, 1000, 1200, 1400, 1700, 2000, 2350, 2750, 3150];
