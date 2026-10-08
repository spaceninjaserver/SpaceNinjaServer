import type { RequestHandler } from "express";
import { ExportUpgrades } from "warframe-public-export-plus";
import { getAccountForRequest } from "../../services/loginService.ts";
import { addMiscItems, getInventory } from "../../services/inventoryService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { IUnveiledRivenFingerprint } from "../../helpers/rivenHelper.ts";
import { randomiseRivenStats } from "../../helpers/rivenHelper.ts";

export const mergeRandomUpgradesController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const request = getJSONfromString<IMergeRandomUpgradesRequest>(String(req.body));
    const inventory = await getInventory(account._id, "Upgrades MiscItems");
    const upgrade = inventory.Upgrades.id(request.ItemId)!;
    const meta = ExportUpgrades[upgrade.ItemType];
    const mergeOption = meta.mergeOptions?.find(
        x =>
            (x.primaryIngredient == request.FirstTag && x.secondaryIngredient == request.SecondTag) ||
            (x.primaryIngredient == request.SecondTag && x.secondaryIngredient == request.FirstTag)
    );
    if (!mergeOption) {
        throw new Error(`no merge option for ${request.FirstTag} & ${request.SecondTag} on ${upgrade.ItemType}`);
    }
    const fingerprint = JSON.parse(upgrade.UpgradeFingerprint!) as IUnveiledRivenFingerprint;
    const firstIsCurse = fingerprint.curses?.some(x => x.Tag == request.FirstTag);
    const splicedTag = firstIsCurse ? request.SecondTag : request.FirstTag;
    const otherTag = firstIsCurse ? request.FirstTag : request.SecondTag;
    fingerprint.buffs[fingerprint.buffs.findIndex(x => x.Tag == splicedTag)] = {
        Tag: mergeOption.resultTag,
        Value: Math.max(
            ...[...fingerprint.buffs, ...(fingerprint.curses ?? [])]
                .filter(x => x.Tag == splicedTag || x.Tag == otherTag)
                .map(x => x.Value)
        )
    };
    randomiseRivenStats(
        meta,
        fingerprint,
        [...fingerprint.buffs, ...(fingerprint.curses ?? [])].map(x => x.Tag).filter(x => x != otherTag)
    );
    upgrade.UpgradeFingerprint = JSON.stringify(fingerprint);

    addMiscItems(inventory, [{ ItemType: "/Lotus/Types/Items/MiscItems/RivenSplicer", ItemCount: -1 }]);
    await inventory.save();

    res.json({
        NewFingerprint: upgrade.UpgradeFingerprint,
        MiscItemCosts: [{ ItemType: "/Lotus/Types/Items/MiscItems/RivenSplicer", ItemCount: 1 }]
    });
};

interface IMergeRandomUpgradesRequest {
    ItemId: string;
    FirstTag: string;
    SecondTag: string;
}
