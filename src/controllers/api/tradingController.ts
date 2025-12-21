import { getGuildForRequestEx, hasAccessToDojo, hasGuildPermission } from "../../services/guildService.ts";
import {
    addFusionTreasures,
    addMiscItem,
    addMods,
    addRecipes,
    getInventory,
    updateCurrency
} from "../../services/inventoryService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";
import type { IPendingTrade, ITradeOffer } from "../../types/inventoryTypes/inventoryTypes.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { logger } from "../../utils/logger.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";
import type { TInventoryDatabaseDocument } from "../../models/inventoryModels/inventoryModel.ts";
import { importUpgrade } from "../../services/importService.ts";
import { Guild } from "../../models/guildModel.ts";
import { ExportArcanes, ExportResources, ExportUpgrades, type TRarity } from "warframe-public-export-plus";

export const tradingController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const accountId = account._id.toString();
    const op = req.query.op as string;
    if (op == "0" || op == "1") {
        const buddyId = req.query.buddyId as string;
        const tradeId = getTradeId(accountId, buddyId);
        const offer = getJSONfromString<ITradeOffer>(String(req.body));
        pendingTrades[tradeId] ??= {
            trader: accountId,
            tradee: buddyId,
            traderOffer: { _SlotOrderInfo: ["", "", "", "", "", ""] },
            tradeeOffer: { _SlotOrderInfo: ["", "", "", "", "", ""] },
            traderReady: false,
            tradeeReady: false,
            traderAccepted: false,
            tradeeAccepted: false,
            revision: -1,
            clanTax: (req.query.guildId ? await Guild.findById(req.query.guildId as string) : undefined)?.TradeTax ?? 10 // When trading in Maroo's Bazaar, a 10% "Hub Tax" applies.
        };
        const us = accountId == pendingTrades[tradeId].trader ? "trader" : "tradee";
        logger.debug(`${us} offer:`, offer);
        {
            const tax = calcuateTax(offer);
            const clanTaxRate = pendingTrades[tradeId].clanTax ? 1 / pendingTrades[tradeId].clanTax : 0;
            const clanTax = clanTaxRate * tax;
            logger.debug(`calculated tax: ${tax} + ${clanTax}`);
        }
        pendingTrades[tradeId][`${us}Offer`] = offer;
        pendingTrades[tradeId].traderReady = false;
        pendingTrades[tradeId].tradeeReady = false;
        pendingTrades[tradeId].traderAccepted = false;
        pendingTrades[tradeId].tradeeAccepted = false;
        pendingTrades[tradeId].revision += 1;
        res.json({
            PendingTrades: [exportTrade(pendingTrades[tradeId], us)]
        });
    } else if (op == "2") {
        const buddyId = req.query.buddyId as string;
        const tradeId = getTradeId(accountId, buddyId);
        if (parseInt(req.query.revision as string) != pendingTrades[tradeId].revision) {
            throw new Error(`can't accept trade because it was unexpectedly revised`);
        }
        const us = accountId == pendingTrades[tradeId].trader ? "trader" : "tradee";
        pendingTrades[tradeId][`${us}Accepted`] = true;
        const them = us == "trader" ? "tradee" : "trader";
        if (pendingTrades[tradeId][`${them}Accepted`]) {
            const [traderInventory, tradeeInventory] = await Promise.all([
                getInventory(pendingTrades[tradeId].trader),
                getInventory(pendingTrades[tradeId].tradee)
            ]);

            applyOfferToInventory(traderInventory, pendingTrades[tradeId].traderOffer, -1); // Traders gives up their items
            applyOfferToInventory(traderInventory, pendingTrades[tradeId].tradeeOffer, +1); // to get what tradee offered
            // and pays tax for it
            await chargeTax(
                traderInventory,
                pendingTrades[tradeId].tradeeOffer,
                pendingTrades[tradeId].clanTax,
                req.query.guildId as string | undefined
            );
            applyOfferToInventory(tradeeInventory, pendingTrades[tradeId].tradeeOffer, -1); // Conversely, tradee gives up their items
            applyOfferToInventory(tradeeInventory, pendingTrades[tradeId].traderOffer, +1); // to get what trader offered
            // and pays tax for it
            await chargeTax(
                tradeeInventory,
                pendingTrades[tradeId].traderOffer,
                pendingTrades[tradeId].clanTax,
                req.query.guildId as string | undefined
            );

            traderInventory.TradesRemaining -= 1;
            tradeeInventory.TradesRemaining -= 1;

            await Promise.all([traderInventory.save(), tradeeInventory.save()]);
            delete pendingTrades[tradeId];
            res.send(
                account.BuildLabel && version_compare(account.BuildLabel, gameToBuildVersion["40.0.0"]) < 0 ? "9" : "12"
            ).end();
        } else {
            res.send(
                account.BuildLabel && version_compare(account.BuildLabel, gameToBuildVersion["40.0.0"]) < 0 ? "8" : "11"
            ).end();
        }
    } else if (op == "3") {
        const buddyId = req.query.buddyId as string;
        const tradeId = getTradeId(accountId, buddyId);
        delete pendingTrades[tradeId];
        res.json({
            pendingTrades: []
        });
    } else if (op == "4") {
        const tradeId = getTradeId(accountId, req.query.buddyId as string);
        const us = accountId == pendingTrades[tradeId].trader ? "trader" : "tradee";
        res.json({
            PendingTrades: [exportTrade(pendingTrades[tradeId], us)]
        });
    } else if (op == "5") {
        const inventory = await getInventory(accountId, "GuildId LevelKeys");
        const guild = await getGuildForRequestEx(req, inventory);
        if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Treasurer))) {
            res.status(400).send("-1").end();
            return;
        }
        guild.TradeTax = parseInt(req.query.tax as string);
        await guild.save();
        res.send(guild.TradeTax).end();
    } else if (op == "6") {
        const buddyId = req.query.buddyId as string;
        const tradeId = getTradeId(accountId, buddyId);
        const us = accountId == pendingTrades[tradeId].trader ? "trader" : "tradee";
        if (parseInt(req.query.revision as string) == pendingTrades[tradeId].revision) {
            pendingTrades[tradeId][`${us}Ready`] = true;
        }
        res.json({
            PendingTrades: [exportTrade(pendingTrades[tradeId], us)]
        });
    } else if (op == "7") {
        const buddyId = req.query.buddyId as string;
        const tradeId = getTradeId(accountId, buddyId);
        const us = accountId == pendingTrades[tradeId].trader ? "trader" : "tradee";
        pendingTrades[tradeId][`${us}Ready`] = false;
        pendingTrades[tradeId].tradeeAccepted = false;
        pendingTrades[tradeId].traderAccepted = false;
        res.json({
            PendingTrades: [exportTrade(pendingTrades[tradeId], us)]
        });
    } else {
        if (req.body) {
            logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        }
        throw new Error(`unknown trading op: ${op}`);
    }
};

interface IPendingTradeMem {
    trader: string;
    tradee: string;
    traderOffer: ITradeOffer;
    tradeeOffer: ITradeOffer;
    traderReady: boolean;
    tradeeReady: boolean;
    traderAccepted: boolean;
    tradeeAccepted: boolean;
    revision: number;
    clanTax: number;
}

const pendingTrades: Record<string, IPendingTradeMem> = {};

const getTradeId = (accountId: string, buddyId: string): string => {
    return accountId.localeCompare(buddyId) < 0 ? accountId + buddyId : buddyId + accountId;
};

const exportTrade = (mem: IPendingTradeMem, us: "trader" | "tradee"): IPendingTrade => {
    const them = us == "trader" ? "tradee" : "trader";
    return {
        ItemId: { $oid: mem[them] },
        Giving: mem[`${us}Offer`],
        Getting: mem[`${them}Offer`],
        SelfReady: mem[`${us}Ready`],
        BuddyReady: mem[`${them}Ready`],
        State: mem[`${us}Accepted`] ? (mem[`${them}Accepted`] ? 4 : 3) : 2,
        Revision: mem.revision,
        ClanTax: mem.clanTax
    };
};

const applyOfferToInventory = (inventory: TInventoryDatabaseDocument, offer: ITradeOffer, factor: 1 | -1): void => {
    if (offer.RandomUpgrades) {
        for (const item of offer.RandomUpgrades) {
            if (factor == -1) {
                inventory.Upgrades.pull({ _id: item.ItemId.$oid });
            } else {
                inventory.Upgrades.push(importUpgrade(item));
            }
        }
    }
    if (offer.Upgrades) {
        for (const item of offer.Upgrades) {
            if (factor == -1) {
                inventory.Upgrades.pull({ _id: item.ItemId.$oid });
            } else {
                inventory.Upgrades.push(importUpgrade(item));
            }
        }
    }
    if (offer.RawUpgrades) {
        if (factor == 1) {
            addMods(inventory, offer.RawUpgrades);
        } else {
            for (const item of offer.RawUpgrades) {
                if (item.ItemCount < 0) {
                    throw new Error(`negative quantity in trade offer`);
                }
                addMods(inventory, [{ ...item, ItemCount: item.ItemCount * -1 }]);
            }
        }
    }
    if (offer.MiscItems) {
        for (const item of offer.MiscItems) {
            if (item.ItemCount < 0) {
                throw new Error(`negative quantity in trade offer`);
            }
            addMiscItem(inventory, item.ItemType, item.ItemCount * factor);
        }
    }
    if (offer.Recipes) {
        if (factor == 1) {
            addRecipes(inventory, offer.Recipes);
        } else {
            for (const item of offer.Recipes) {
                if (item.ItemCount < 0) {
                    throw new Error(`negative quantity in trade offer`);
                }
                addRecipes(inventory, [{ ...item, ItemCount: item.ItemCount * -1 }]);
            }
        }
    }
    if (offer.FusionTreasures) {
        if (factor == 1) {
            addFusionTreasures(inventory, offer.FusionTreasures);
        } else {
            for (const item of offer.FusionTreasures) {
                if (item.ItemCount < 0) {
                    throw new Error(`negative quantity in trade offer`);
                }
                addFusionTreasures(inventory, [{ ...item, ItemCount: item.ItemCount * -1 }]);
            }
        }
    }
    if (offer.PremiumCredits) {
        if (offer.PremiumCredits < 0) {
            throw new Error(`negative quantity in trade offer`);
        }
        updateCurrency(inventory, offer.PremiumCredits * factor * -1, true);
    }
};

const RARITY_TAX_RATES: Record<TRarity, number> = { COMMON: 2000, UNCOMMON: 4000, RARE: 8000, LEGENDARY: 1_000_000 };
const LEGENDARY_ARCANE_TAX_RATES: number[] = [100_000, 300_000, 600_000, 1_000_000, 1_500_000, 2_100_000];
const calcuateTax = (offer: ITradeOffer): number => {
    let tax = 0;
    if (offer.RandomUpgrades) {
        tax += offer.RandomUpgrades.length * 8000;
    }
    if (offer.Upgrades) {
        for (const item of offer.Upgrades) {
            if (item.ItemType in ExportArcanes) {
                const rarity = ExportArcanes[item.ItemType].rarity;
                if (rarity == "LEGENDARY") {
                    tax += LEGENDARY_ARCANE_TAX_RATES[(JSON.parse(item.UpgradeFingerprint!) as { lvl: number }).lvl];
                }
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                tax += RARITY_TAX_RATES[ExportUpgrades[item.ItemType]?.rarity ?? "COMMON"];
            }
        }
    }
    if (offer.RawUpgrades) {
        for (const item of offer.RawUpgrades) {
            tax +=
                RARITY_TAX_RATES[
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    ExportUpgrades[item.ItemType]?.rarity ?? ExportArcanes[item.ItemType]?.rarity ?? "COMMON"
                ] * item.ItemCount;
        }
    }
    if (offer.MiscItems) {
        for (const item of offer.MiscItems) {
            if (
                item.ItemType.startsWith("/Lotus/Types/Game/Projections/T3") ||
                item.ItemType.startsWith("/Lotus/Types/Game/Projections/T4")
            ) {
                tax += 4000 * item.ItemCount;
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                tax += RARITY_TAX_RATES[ExportResources[item.ItemType]?.rarity ?? "COMMON"] * item.ItemCount;
            }
        }
    }
    if (offer.Recipes) {
        tax += offer.Recipes.length * 2000;
    }
    if (offer.FusionTreasures) {
        for (const item of offer.FusionTreasures) {
            tax += item.ItemCount * (item.Sockets ? 12000 : 4000);
        }
    }
    tax += (offer.PremiumCredits ?? 0) * 500;
    return tax;
};

const chargeTax = async (
    inventory: TInventoryDatabaseDocument,
    offer: ITradeOffer,
    clanTaxInt: number,
    guildId: string | undefined
): Promise<void> => {
    const tax = calcuateTax(offer);
    const clanTaxRate = clanTaxInt ? 1 / clanTaxInt : 0;
    const clanTax = clanTaxRate * tax;
    updateCurrency(inventory, tax + clanTax, false);
    if (guildId && clanTax) {
        const guild = await Guild.findById(guildId);
        if (guild) {
            guild.VaultRegularCredits ??= 0;
            guild.VaultRegularCredits += clanTax;
            await guild.save();
        }
    }
};
