import { getGuildForRequestEx, hasAccessToDojo, hasGuildPermission } from "../../services/guildService.ts";
import {
    addFusionTreasures,
    addMiscItem,
    addMods,
    addRecipes,
    getInventory2,
    updateCredits,
    updatePlatinum
} from "../../services/inventoryService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { eGuildPermission } from "../../types/guildTypes.ts";
import type { RequestHandler } from "express";
import type { IPendingTradeDatabase, ITradeOffer } from "../../types/tradingTypes.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { logger } from "../../utils/logger.ts";
import { fromMongoDate, version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";
import type { TInventoryDatabaseDocument } from "../../models/inventoryModels/inventoryModel.ts";
import { importUpgrade } from "../../services/importService.ts";
import { Guild } from "../../models/guildModel.ts";
import { ExportArcanes, ExportResources, ExportUpgrades, type TRarity } from "warframe-public-export-plus";
import { getInfNodes, getNemesisManifest } from "../../helpers/nemesisHelpers.ts";
import { PendingTrade } from "../../models/tradingModel.ts";
import type { HydratedDocument, QueryFilter } from "mongoose";
import { exportTrade } from "../../services/tradingService.ts";

export const tradingController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const accountId = account._id.toString();
    const op = req.query.op as string as TTradingOperation;
    if (op == eTradingOperation.InitialOffer) {
        const buddyId = req.query.buddyId as string;
        const offer = getJSONfromString<ITradeOffer>(String(req.body));
        const us = getSide(accountId, buddyId);
        const them = us == "a" ? "b" : "a";
        const trade = await PendingTrade.create({
            [us]: accountId,
            [them]: buddyId,
            [`${us}Offer`]: offer,
            clanTax:
                (req.query.guildId ? await Guild.findById(req.query.guildId as string, "TradeTax") : undefined)
                    ?.TradeTax ?? 10 // When trading in Maroo's Bazaar, a 10% "Hub Tax" applies.
        });
        res.json({
            PendingTrades: [exportTrade(trade, us)]
        });
    } else if (op == eTradingOperation.CounterOffer) {
        const buddyId = req.query.buddyId as string;
        const offer = getJSONfromString<ITradeOffer>(String(req.body));
        const us = getSide(accountId, buddyId);
        const trade = (await PendingTrade.findOneAndUpdate(
            getTradeFilter(accountId, buddyId),
            {
                $set: {
                    [`${us}Offer`]: offer
                },
                $inc: {
                    revision: 1
                }
            },
            { returnDocument: "after" }
        ))!;
        res.json({
            PendingTrades: [exportTrade(trade, us)]
        });
    } else if (op == eTradingOperation.AcceptTrade) {
        const buildLabel = getBuildLabel(req, account);
        const buddyId = req.query.buddyId as string;
        const trade = (await getPendingTrade(accountId, buddyId))!;
        if (parseInt(req.query.revision as string) != trade.revision) {
            throw new Error(`can't accept trade because it was unexpectedly revised`);
        }
        const us = trade.a.equals(accountId) ? "a" : "b";
        trade[`${us}Accepted`] = true;
        const them = us == "a" ? "b" : "a";
        if (trade[`${them}Accepted`]) {
            const [aInventory, bInventory] = await Promise.all([
                getInventory2(
                    trade.a,
                    "tradesDontTouchInventory",
                    "Upgrades",
                    "RawUpgrades",
                    "MiscItems",
                    "Recipes",
                    "HybridFusionTreasures",
                    "NemesisHistory",
                    "Nemesis",
                    "infinitePlatinum",
                    "PremiumCreditsFree",
                    "PremiumCredits",
                    "infiniteCredits",
                    "RegularCredits",
                    "infiniteTrades",
                    "TradesRemaining"
                ),
                getInventory2(
                    trade.b,
                    "tradesDontTouchInventory",
                    "Upgrades",
                    "RawUpgrades",
                    "MiscItems",
                    "Recipes",
                    "HybridFusionTreasures",
                    "NemesisHistory",
                    "Nemesis",
                    "infinitePlatinum",
                    "PremiumCreditsFree",
                    "PremiumCredits",
                    "infiniteCredits",
                    "RegularCredits",
                    "infiniteTrades",
                    "TradesRemaining"
                )
            ]);

            if (!aInventory.tradesDontTouchInventory) {
                applyOfferToInventory(aInventory, trade.aOffer, -1); // A gives up their items
                applyOfferToInventory(aInventory, trade.bOffer, +1); // to get what B offered
                await chargeTax(aInventory, trade.bOffer, trade.clanTax, req.query.guildId as string | undefined); // and pays tax for it
                if (!aInventory.infiniteTrades) {
                    aInventory.TradesRemaining -= 1;
                }
            }
            if (!bInventory.tradesDontTouchInventory) {
                applyOfferToInventory(bInventory, trade.bOffer, -1); // Conversely, B gives up their items
                applyOfferToInventory(bInventory, trade.aOffer, +1); // to get what A offered
                await chargeTax(bInventory, trade.aOffer, trade.clanTax, req.query.guildId as string | undefined); // and pays tax for it
                if (!bInventory.infiniteTrades) {
                    bInventory.TradesRemaining -= 1;
                }
            }

            await Promise.all([aInventory.save(), bInventory.save(), trade.deleteOne()]);
            res.send(version_compare(buildLabel, gameToBuildVersion["40.0.0"]) < 0 ? "9" : "12").end();
        } else {
            await trade.save();
            res.send(version_compare(buildLabel, gameToBuildVersion["40.0.0"]) < 0 ? "8" : "11").end();
        }
    } else if (op == eTradingOperation.CancelTrade) {
        const buddyId = req.query.buddyId as string;
        await PendingTrade.deleteOne(getTradeFilter(accountId, buddyId));
        res.end();
    } else if (op == eTradingOperation.RefreshTradeInfo) {
        const buddyId = req.query.buddyId as string;
        const trade = (await getPendingTrade(accountId, buddyId))!;
        const us = trade.a.equals(accountId) ? "a" : "b";
        res.json({
            PendingTrades: [exportTrade(trade, us)]
        });
    } else if (op == eTradingOperation.SetClanTax) {
        const inventory = await getInventory2(accountId, "GuildId", "LevelKeys");
        const guild = await getGuildForRequestEx(req, inventory);
        if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, eGuildPermission.Treasurer))) {
            res.status(400).send("-1").end();
            return;
        }
        guild.TradeTax = parseInt(req.query.tax as string);
        await guild.save();
        res.send(guild.TradeTax).end();
    } else if (op == eTradingOperation.SetReady) {
        const buddyId = req.query.buddyId as string;
        const us = getSide(accountId, buddyId);
        const trade = (await getPendingTrade(accountId, buddyId))!;
        if (trade.revision == parseInt(req.query.revision as string)) {
            trade[`${us}Ready`] = true;
            await trade.save();
        }
        res.json({
            PendingTrades: [exportTrade(trade, us)]
        });
    } else if (op == eTradingOperation.UnsetReady) {
        const buddyId = req.query.buddyId as string;
        const us = getSide(accountId, buddyId);
        const trade = (await PendingTrade.findOneAndUpdate(
            getTradeFilter(accountId, buddyId),
            { [`${us}Ready`]: false, aAccepted: false, bAccepted: false },
            { returnDocument: "after" }
        ))!;
        res.json({
            PendingTrades: [exportTrade(trade, us)]
        });
    } else {
        if (req.body) {
            logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        }
        throw new Error(`unknown trading op: ${op}`);
    }
};

const eTradingOperation = {
    InitialOffer: "0",
    CounterOffer: "1",
    AcceptTrade: "2",
    CancelTrade: "3",
    RefreshTradeInfo: "4",
    SetClanTax: "5",
    SetReady: "6",
    UnsetReady: "7",
    NeverSayNever: "01189998819991197253"
} as const;
type TTradingOperation = (typeof eTradingOperation)[keyof typeof eTradingOperation];

const getSide = (accountId: string, buddyId: string): "a" | "b" => {
    return accountId.localeCompare(buddyId) < 0 ? "a" : "b";
};

const getTradeFilter = (accountId: string, buddyId: string): QueryFilter<IPendingTradeDatabase> => {
    return accountId.localeCompare(buddyId) < 0 ? { a: accountId, b: buddyId } : { a: buddyId, b: accountId };
};

const getPendingTrade = (
    accountId: string,
    buddyId: string
): Promise<HydratedDocument<IPendingTradeDatabase> | null> => {
    return PendingTrade.findOne(getTradeFilter(accountId, buddyId));
};

const applyOfferToInventory = (
    inventory: Pick<
        TInventoryDatabaseDocument,
        | "Upgrades"
        | "RawUpgrades"
        | "MiscItems"
        | "Recipes"
        | "HybridFusionTreasures"
        | "NemesisHistory"
        | "Nemesis"
        | "infinitePlatinum"
        | "PremiumCreditsFree"
        | "PremiumCredits"
    >,
    offer: ITradeOffer,
    factor: 1 | -1
): void => {
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
    if (offer.NemesisHistory) {
        inventory.NemesisHistory ??= [];
        if (factor == 1) {
            if (inventory.Nemesis) {
                logger.warn(`overwriting an existing nemesis as a new one is being requested`);
            }
            const manifest = getNemesisManifest(offer.NemesisHistory.manifest);
            inventory.Nemesis = {
                fp: BigInt(offer.NemesisHistory.fp),
                manifest: offer.NemesisHistory.manifest,
                KillingSuit: offer.NemesisHistory.KillingSuit,
                killingDamageType: offer.NemesisHistory.killingDamageType,
                ShoulderHelmet: offer.NemesisHistory.ShoulderHelmet,
                WeaponIdx: offer.NemesisHistory.WeaponIdx,
                AgentIdx: offer.NemesisHistory.AgentIdx,
                BirthNode: offer.NemesisHistory.BirthNode,
                Faction: offer.NemesisHistory.Faction,
                Rank: 0,
                k: false,
                Traded: true,
                d: fromMongoDate(offer.NemesisHistory.d),
                InfNodes: getInfNodes(manifest, 0),
                GuessHistory: [],
                Hints: [],
                HintProgress: 0,
                Weakened: false,
                PrevOwners: offer.NemesisHistory.PrevOwners + 1,
                HenchmenKilled: 0,
                SecondInCommand: false,
                MissionCount: 0,
                LastEnc: 0
            };
        } else {
            const i = inventory.NemesisHistory.findIndex(x => x.fp == BigInt(offer.NemesisHistory!.fp));
            if (i != -1) {
                inventory.NemesisHistory.splice(i, 1);
            }
        }
    }
    if (offer.PremiumCredits) {
        if (offer.PremiumCredits < 0) {
            throw new Error(`negative quantity in trade offer`);
        }
        updatePlatinum(inventory, offer.PremiumCredits * factor * -1, true);
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
    if (offer.NemesisHistory) {
        tax += 8000;
    }
    tax += (offer.PremiumCredits ?? 0) * 500;
    return tax;
};

const chargeTax = async (
    inventory: Pick<TInventoryDatabaseDocument, "infiniteCredits" | "RegularCredits">,
    offer: ITradeOffer,
    clanTaxInt: number,
    guildId: string | undefined
): Promise<void> => {
    const tax = calcuateTax(offer);
    const clanTaxRate = clanTaxInt ? 1 / clanTaxInt : 0;
    const clanTax = clanTaxRate * tax;
    updateCredits(inventory, tax + clanTax);
    if (guildId && clanTax) {
        const guild = await Guild.findById(guildId);
        if (guild) {
            guild.VaultRegularCredits ??= 0;
            guild.VaultRegularCredits += clanTax;
            await guild.save();
        }
    }
};
