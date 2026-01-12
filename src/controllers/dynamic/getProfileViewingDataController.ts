import { fromDbOid, toMongoDate, toOid } from "../../helpers/inventoryHelpers.ts";
import type { TGuildDatabaseDocument } from "../../models/guildModel.ts";
import { Guild, GuildMember } from "../../models/guildModel.ts";
import type { TInventoryDatabaseDocument } from "../../models/inventoryModels/inventoryModel.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { Loadout } from "../../models/inventoryModels/loadoutModel.ts";
import { Account } from "../../models/loginModel.ts";
import type { TStatsDatabaseDocument } from "../../models/statsModel.ts";
import { Stats } from "../../models/statsModel.ts";
import { allDailyAffiliationKeys } from "../../services/inventoryService.ts";
import type { IMongoDate, IOid } from "../../types/commonTypes.ts";
import type {
    IAffiliation,
    IAlignment,
    IChallengeProgress,
    IDailyAffiliations,
    IInventoryAccolades,
    IMission,
    IPlayerSkills,
    ITypeXPItem
} from "../../types/inventoryTypes/inventoryTypes.ts";
import { LoadoutIndex } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { ExportDojoRecipes } from "warframe-public-export-plus";
import type { IStatsClient } from "../../types/statTypes.ts";
import { toStoreItem } from "../../services/itemDataService.ts";
import type { FlattenMaps } from "mongoose";
import type { IEquipmentClient } from "../../types/equipmentTypes.ts";
import type { ILoadoutConfigClient } from "../../types/saveLoadoutTypes.ts";
import { skinLookupTable } from "../../helpers/skinLookupTable.ts";

const getProfileViewingDataByPlayerIdImpl = async (playerId: string): Promise<IProfileViewingData | undefined> => {
    const account = await Account.findById(playerId, "DisplayName");
    if (!account) {
        return;
    }
    const inventory = (await Inventory.findOne({ accountOwnerId: account._id }))!;

    const result: IPlayerProfileViewingDataResult = {
        AccountId: toOid(account._id),
        DisplayName: account.DisplayName,
        PlayerLevel:
            inventory.spoofMasteryRank !== undefined && inventory.spoofMasteryRank !== -1
                ? inventory.spoofMasteryRank
                : inventory.PlayerLevel,
        LoadOutInventory: {
            WeaponSkins: [],
            XPInfo: inventory.XPInfo
        },
        PlayerSkills: inventory.PlayerSkills,
        ChallengeProgress: inventory.ChallengeProgress,
        DeathMarks: inventory.DeathMarks,
        Harvestable: inventory.Harvestable,
        DeathSquadable: inventory.DeathSquadable,
        Created: toMongoDate(inventory.Created),
        TitleType: inventory.TitleType,
        MigratedToConsole: false,
        Missions: inventory.Missions,
        Affiliations: inventory.Affiliations,
        DailyFocus: inventory.DailyFocus,
        Wishlist: inventory.Wishlist,
        Alignment: inventory.Alignment,
        Staff: inventory.Staff,
        Founder: inventory.Founder,
        Guide: inventory.Guide,
        Moderator: inventory.Moderator,
        Partner: inventory.Partner,
        Accolades: inventory.Accolades
    };
    await populateLoadout(inventory, result);
    if (inventory.GuildId) {
        const guild = (await Guild.findById(inventory.GuildId, "Name Tier XP Class Emblem"))!;
        populateGuild(guild, result);
    }
    for (const key of allDailyAffiliationKeys) {
        result[key] = inventory[key];
    }

    const stats = (await Stats.findOne({ accountOwnerId: account._id }))!.toJSON<Partial<TStatsDatabaseDocument>>();
    delete stats._id;
    delete stats.__v;
    delete stats.accountOwnerId;

    return {
        Results: [result],
        TechProjects: [],
        XpComponents: [],
        //XpCacheExpiryDate, some IMongoDate in the future, no clue what it's for
        Stats: stats
    };
};

export const getProfileViewingDataGetController: RequestHandler = async (req, res) => {
    if (req.query.playerId) {
        const data = await getProfileViewingDataByPlayerIdImpl(req.query.playerId as string);
        if (data) {
            res.json(data);
        } else {
            res.status(409).send("Could not find requested account");
        }
    } else if (req.query.guildId) {
        const guild = await Guild.findById(
            req.query.guildId as string,
            "Name Tier XP Class Emblem TechProjects ClaimedXP"
        );
        if (!guild) {
            res.status(409).send("Could not find guild");
            return;
        }
        const members = await GuildMember.find({ guildId: guild._id, status: 0 });
        const results: IPlayerProfileViewingDataResult[] = [];
        for (let i = 0; i != Math.min(4, members.length); ++i) {
            const member = members[i];
            const [account, inventory] = await Promise.all([
                Account.findById(member.accountId, "DisplayName"),
                Inventory.findOne(
                    { accountOwnerId: member.accountId },
                    "DisplayName PlayerLevel XPInfo LoadOutPresets CurrentLoadOutIds WeaponSkins Suits Pistols LongGuns Melee"
                )
            ]);
            const result: IPlayerProfileViewingDataResult = {
                AccountId: toOid(account!._id),
                DisplayName: account!.DisplayName,
                PlayerLevel: inventory!.PlayerLevel,
                LoadOutInventory: {
                    WeaponSkins: [],
                    XPInfo: inventory!.XPInfo
                }
            };
            await populateLoadout(inventory!, result);
            results.push(result);
        }
        populateGuild(guild, results[0]);

        const combinedStats: IStatsClient = {};
        const statsArr = await Stats.find({ accountOwnerId: { $in: members.map(x => x.accountId) } }).lean(); // need this as POJO so Object.entries works as expected
        for (const stats of statsArr) {
            for (const [key, value] of Object.entries(stats)) {
                if (typeof value == "number" && key != "__v") {
                    (combinedStats[key as keyof IStatsClient] as number | undefined) ??= 0;
                    (combinedStats[key as keyof IStatsClient] as number) += value;
                }
            }
            for (const arrayName of ["Weapons", "Enemies", "Scans", "Missions", "PVP"] as const) {
                if (stats[arrayName]) {
                    combinedStats[arrayName] ??= [];
                    for (const entry of stats[arrayName]) {
                        const combinedEntry = combinedStats[arrayName].find(x => x.type == entry.type);
                        if (combinedEntry) {
                            for (const [key, value] of Object.entries(entry)) {
                                if (typeof value == "number") {
                                    (combinedEntry[key as keyof typeof combinedEntry] as unknown as
                                        | number
                                        | undefined) ??= 0;
                                    (combinedEntry[key as keyof typeof combinedEntry] as unknown as number) += value;
                                }
                            }
                        } else {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            combinedStats[arrayName].push(entry as any);
                        }
                    }
                }
            }
        }

        const xpComponents: IXPComponentClient[] = [];
        if (guild.ClaimedXP) {
            for (const componentName of guild.ClaimedXP) {
                if (componentName.endsWith(".level")) {
                    const [key] = Object.entries(ExportDojoRecipes.rooms).find(
                        ([_key, value]) => value.resultType == componentName
                    )!;
                    xpComponents.push({
                        StoreTypeName: toStoreItem(key)
                    });
                } else {
                    const [key] = Object.entries(ExportDojoRecipes.decos).find(
                        ([_key, value]) => value.resultType == componentName
                    )!;
                    xpComponents.push({
                        StoreTypeName: toStoreItem(key)
                    });
                }
            }
        }

        res.json({
            Results: results,
            TechProjects: guild.TechProjects,
            XpComponents: xpComponents,
            //XpCacheExpiryDate, some IMongoDate in the future, no clue what it's for
            Stats: combinedStats
        });
    } else {
        res.sendStatus(400);
    }
};

// For old versions, this was an authenticated POST request.
interface IGetProfileViewingDataRequest {
    AccountId: string;
}
export const getProfileViewingDataPostController: RequestHandler = async (req, res) => {
    const payload = getJSONfromString<IGetProfileViewingDataRequest>(String(req.body));
    const playerId = req.query.playerId as string; // companion app sends a POST request should be handled like a GET request
    const data = await getProfileViewingDataByPlayerIdImpl(playerId ? playerId : payload.AccountId);
    if (data) {
        res.json(data);
    } else {
        res.status(409).send("Could not find requested account");
    }
};

interface IProfileViewingData {
    Results: IPlayerProfileViewingDataResult[];
    TechProjects: [];
    XpComponents: [];
    //XpCacheExpiryDate, some IMongoDate in the future, no clue what it's for
    Stats: FlattenMaps<Partial<TStatsDatabaseDocument>>;
}

interface IPlayerProfileViewingDataResult extends Partial<IDailyAffiliations>, IInventoryAccolades {
    AccountId: IOid;
    DisplayName: string;
    PlayerLevel: number;
    LoadOutPreset?: Omit<ILoadoutConfigClient, "ItemId"> & { ItemId?: IOid };
    LoadOutInventory: {
        WeaponSkins: { ItemType: string }[];
        Suits?: IEquipmentClient[];
        Pistols?: IEquipmentClient[];
        LongGuns?: IEquipmentClient[];
        Melee?: IEquipmentClient[];
        XPInfo: ITypeXPItem[];
    };
    GuildId?: IOid;
    GuildName?: string;
    GuildTier?: number;
    GuildXp?: number;
    GuildClass?: number;
    GuildEmblem?: boolean;
    PlayerSkills?: IPlayerSkills;
    ChallengeProgress?: IChallengeProgress[];
    DeathMarks?: string[];
    Harvestable?: boolean;
    DeathSquadable?: boolean;
    Created?: IMongoDate;
    TitleType?: string;
    MigratedToConsole?: boolean;
    Missions?: IMission[];
    Affiliations?: IAffiliation[];
    DailyFocus?: number;
    Wishlist?: string[];
    Alignment?: IAlignment;
}

interface IXPComponentClient {
    _id?: IOid;
    StoreTypeName: string;
    TypeName?: string;
    PurchaseQuantity?: number;
    ProductCategory?: "Recipes";
    Rarity?: "COMMON";
    RegularPrice?: number;
    PremiumPrice?: number;
    SellingPrice?: number;
    DateAddedToManifest?: number;
    PrimeSellingPrice?: number;
    GuildXp?: number;
    ResultPrefab?: string;
    ResultDecoration?: string;
    ShowInMarket?: boolean;
    ShowInInventory?: boolean;
    locTags?: Record<string, string>;
}

const resolveAndCollectSkins = (
    inventory: TInventoryDatabaseDocument,
    skins: Set<string>,
    item: IEquipmentClient
): void => {
    for (const config of item.Configs) {
        if (config.Skins) {
            for (let i = 0; i != config.Skins.length; ++i) {
                // Resolve oids to type names
                if (config.Skins[i].length == 24) {
                    if (config.Skins[i].substring(0, 16) == "ca70ca70ca70ca70") {
                        config.Skins[i] = skinLookupTable[parseInt(config.Skins[i].substring(16), 16)];
                    } else {
                        const skinItem = inventory.WeaponSkins.id(config.Skins[i]);
                        config.Skins[i] = skinItem ? skinItem.ItemType : "";
                    }
                }

                // Collect type names
                if (config.Skins[i]) {
                    skins.add(config.Skins[i]);
                }
            }
        }
    }
};

const populateLoadout = async (
    inventory: TInventoryDatabaseDocument,
    result: IPlayerProfileViewingDataResult
): Promise<void> => {
    if (inventory.CurrentLoadOutIds.length) {
        const loadout = (await Loadout.findById(inventory.LoadOutPresets, "NORMAL"))!;
        result.LoadOutPreset = loadout.NORMAL.id(
            fromDbOid(inventory.CurrentLoadOutIds[LoadoutIndex.NORMAL])
        )!.toJSON<ILoadoutConfigClient>();
        result.LoadOutPreset.ItemId = undefined;
        const skins = new Set<string>();
        if (result.LoadOutPreset.s?.ItemId) {
            result.LoadOutInventory.Suits = [
                inventory.Suits.id(fromDbOid(result.LoadOutPreset.s.ItemId))!.toJSON<IEquipmentClient>()
            ];
            resolveAndCollectSkins(inventory, skins, result.LoadOutInventory.Suits[0]);
        }
        if (result.LoadOutPreset.p?.ItemId) {
            result.LoadOutInventory.Pistols = [
                inventory.Pistols.id(fromDbOid(result.LoadOutPreset.p.ItemId))!.toJSON<IEquipmentClient>()
            ];
            resolveAndCollectSkins(inventory, skins, result.LoadOutInventory.Pistols[0]);
        }
        if (result.LoadOutPreset.l?.ItemId) {
            result.LoadOutInventory.LongGuns = [
                inventory.LongGuns.id(fromDbOid(result.LoadOutPreset.l.ItemId))!.toJSON<IEquipmentClient>()
            ];
            resolveAndCollectSkins(inventory, skins, result.LoadOutInventory.LongGuns[0]);
        }
        if (result.LoadOutPreset.m?.ItemId) {
            result.LoadOutInventory.Melee = [
                inventory.Melee.id(fromDbOid(result.LoadOutPreset.m.ItemId))!.toJSON<IEquipmentClient>()
            ];
            resolveAndCollectSkins(inventory, skins, result.LoadOutInventory.Melee[0]);
        }
        for (const skin of skins) {
            result.LoadOutInventory.WeaponSkins.push({ ItemType: skin });
        }
    }
};

const populateGuild = (guild: TGuildDatabaseDocument, result: IPlayerProfileViewingDataResult): void => {
    result.GuildId = toOid(guild._id);
    result.GuildName = guild.Name;
    result.GuildTier = guild.Tier;
    result.GuildXp = guild.XP;
    result.GuildClass = guild.Class;
    result.GuildEmblem = guild.Emblem;
};
