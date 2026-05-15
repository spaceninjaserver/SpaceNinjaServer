import type { RequestHandler } from "express";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { addMiscItems, addStanding, freeUpSlot, getInventory } from "../../services/inventoryService.ts";
import type { IMiscItem } from "../../types/inventoryTypes/inventoryTypes.ts";
import { eInventorySlot } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { IOid } from "../../types/commonTypes.ts";
import { ExportWeapons } from "warframe-public-export-plus";
import { logger } from "../../utils/logger.ts";
import type { IAffiliationMods, IInventoryChanges } from "../../types/purchaseTypes.ts";
import { eEquipmentFeatures } from "../../types/equipmentTypes.ts";
import { fromOid } from "../../helpers/inventoryHelpers.ts";
import { getSyndicate } from "../../services/itemDataService.ts";

export const syndicateStandingBonusController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const request = JSON.parse(String(req.body)) as ISyndicateStandingBonusRequest;

    const affiliationTag = "Operation" in request ? request.Operation.AffiliationTag : request.AffiliationTag;
    const items = "Operation" in request ? request.Operation.Items : request.Items;
    const modularWeaponIdRaw = "Operation" in request ? request.Operation.ModularWeaponId : request.ModularWeaponId;
    const modularWeaponId = fromOid(modularWeaponIdRaw);

    const syndicateMeta = (await getSyndicate(buildLabel, buildLabel))!;

    // Process items
    let gainedStanding = 0;
    items.forEach(item => {
        const medallion = (syndicateMeta.medallions ?? []).find(medallion => medallion.itemType == item.ItemType);
        if (medallion) {
            gainedStanding += medallion.standing * item.ItemCount;
        }

        item.ItemCount *= -1;
    });
    const inventory = await getInventory(account._id, undefined);
    addMiscItems(inventory, items);
    const inventoryChanges: IInventoryChanges = {};
    inventoryChanges.MiscItems = items;

    // Process modular weapon
    if (modularWeaponId != "" && modularWeaponId != "000000000000000000000000") {
        const category = req.query.Category as "LongGuns" | "Pistols" | "Melee" | "OperatorAmps";
        const weapon = inventory[category].id(modularWeaponId)!;
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
        if (weapon.Features && (weapon.Features & eEquipmentFeatures.GILDED) != 0) {
            gainedStanding *= 2;
        }
        inventoryChanges.RemovedIdItems = [{ ItemId: modularWeaponIdRaw }];
        inventory[category].pull({ _id: modularWeaponId });
        const slotBin = category == "OperatorAmps" ? eInventorySlot.AMPS : eInventorySlot.WEAPONS;
        freeUpSlot(inventory, slotBin);
        inventoryChanges[slotBin] = { count: -1, platinum: 0, Slots: 1 };
    }

    const affiliationMods: IAffiliationMods[] = [];
    await addStanding(inventory, buildLabel, affiliationTag, gainedStanding, affiliationMods, true);

    await inventory.save();

    res.json({
        AffiliationTag: affiliationTag, // Older versions
        StandingChange: affiliationMods[0].Standing, // Older versions
        InventoryChanges: inventoryChanges, // Newer versions
        AffiliationMods: affiliationMods // Newer versions
    });
};

type ISyndicateStandingBonusRequest =
    | {
          // Newer versions
          Operation: {
              AffiliationTag: string;
              AlternateBonusReward: ""; // ???
              Items: IMiscItem[];
              ModularWeaponId: IOid;
          };
      }
    | {
          // Older versions
          AffiliationTag: string;
          Items: IMiscItem[];
          ModularWeaponId: IOid;
      };
