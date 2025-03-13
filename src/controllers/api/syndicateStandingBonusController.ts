import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import {
    addMiscItems,
    freeUpSlot,
    getInventory,
    getStandingLimit,
    updateStandingLimit
} from "@/src/services/inventoryService";
import { IMiscItem, InventorySlot } from "@/src/types/inventoryTypes/inventoryTypes";
import { IOid } from "@/src/types/commonTypes";
import { ExportSyndicates, ExportWeapons } from "warframe-public-export-plus";
import { getMaxStanding } from "@/src/helpers/syndicateStandingHelper";
import { logger } from "@/src/utils/logger";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { EquipmentFeatures } from "@/src/types/inventoryTypes/commonInventoryTypes";

export const syndicateStandingBonusController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = JSON.parse(String(req.body)) as ISyndicateStandingBonusRequest;

    const syndicateMeta = ExportSyndicates[request.Operation.AffiliationTag];

    // Process items
    let gainedStanding = 0;
    request.Operation.Items.forEach(item => {
        const medallion = (syndicateMeta.medallions ?? []).find(medallion => medallion.itemType == item.ItemType);
        if (medallion) {
            gainedStanding += medallion.standing * item.ItemCount;
        }

        item.ItemCount *= -1;
    });
    const inventory = await getInventory(accountId);
    addMiscItems(inventory, request.Operation.Items);
    const inventoryChanges: IInventoryChanges = {};
    inventoryChanges.MiscItems = request.Operation.Items;

    // Process modular weapon
    if (request.Operation.ModularWeaponId.$oid != "000000000000000000000000") {
        const category = req.query.Category as "LongGuns" | "Pistols" | "Melee" | "OperatorAmps";
        const weapon = inventory[category].id(request.Operation.ModularWeaponId.$oid)!;
        if (gainedStanding !== 0) {
            throw new Error(`modular weapon standing bonus should be mutually exclusive`);
        }
        weapon.ModularParts!.forEach(part => {
            const partStandingBonus = ExportWeapons[part].donationStandingBonus;
            if (partStandingBonus === undefined) {
                throw new Error(`no standing bonus for ${part}`);
            }
            logger.debug(`modular weapon part ${part} gives ${partStandingBonus} standing`);
            gainedStanding += partStandingBonus;
        });
        if (weapon.Features && (weapon.Features & EquipmentFeatures.GILDED) != 0) {
            gainedStanding *= 2;
        }
        inventoryChanges.RemovedIdItems = [{ ItemId: request.Operation.ModularWeaponId }];
        inventory[category].pull({ _id: request.Operation.ModularWeaponId.$oid });
        const slotBin = category == "OperatorAmps" ? InventorySlot.AMPS : InventorySlot.WEAPONS;
        freeUpSlot(inventory, slotBin);
        inventoryChanges[slotBin] = { count: -1, platinum: 0, Slots: 1 };
    }

    let syndicate = inventory.Affiliations.find(x => x.Tag == request.Operation.AffiliationTag);
    if (!syndicate) {
        syndicate =
            inventory.Affiliations[
                inventory.Affiliations.push({ Tag: request.Operation.AffiliationTag, Standing: 0 }) - 1
            ];
    }

    const max = getMaxStanding(syndicateMeta, syndicate.Title ?? 0);
    if (syndicate.Standing + gainedStanding > max) {
        gainedStanding = max - syndicate.Standing;
    }

    if (syndicateMeta.medallionsCappedByDailyLimit) {
        if (gainedStanding > getStandingLimit(inventory, syndicateMeta.dailyLimitBin)) {
            gainedStanding = getStandingLimit(inventory, syndicateMeta.dailyLimitBin);
        }
        updateStandingLimit(inventory, syndicateMeta.dailyLimitBin, gainedStanding);
    }

    syndicate.Standing += gainedStanding;

    await inventory.save();

    res.json({
        InventoryChanges: inventoryChanges,
        AffiliationMods: [
            {
                Tag: request.Operation.AffiliationTag,
                Standing: gainedStanding
            }
        ]
    });
};

interface ISyndicateStandingBonusRequest {
    Operation: {
        AffiliationTag: string;
        AlternateBonusReward: ""; // ???
        Items: IMiscItem[];
        ModularWeaponId: IOid;
    };
}
