import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";
import { Guild, GuildMember, TGuildDatabaseDocument } from "@/src/models/guildModel";
import { Inventory, TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { Account } from "@/src/models/loginModel";
import { Stats, TStatsDatabaseDocument } from "@/src/models/statsModel";
import { allDailyAffiliationKeys } from "@/src/services/inventoryService";
import { IMongoDate, IOid } from "@/src/types/commonTypes";
import { IEquipmentClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import {
    IAffiliation,
    IAlignment,
    IChallengeProgress,
    IDailyAffiliations,
    ILoadoutConfigClient,
    IMission,
    IPlayerSkills,
    ITypeXPItem
} from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";
import { catBreadHash, getJSONfromString } from "@/src/helpers/stringHelpers";
import { ExportCustoms, ExportDojoRecipes } from "warframe-public-export-plus";
import { IStatsClient } from "@/src/types/statTypes";
import { toStoreItem } from "@/src/services/itemDataService";
import { FlattenMaps } from "mongoose";

const getProfileViewingDataByPlayerIdImpl = async (playerId: string): Promise<IProfileViewingData | undefined> => {
    const account = await Account.findById(playerId, "DisplayName");
    if (!account) {
        return;
    }
    const inventory = (await Inventory.findOne({ accountOwnerId: account._id }))!;

    const result: IPlayerProfileViewingDataResult = {
        AccountId: toOid(account._id),
        DisplayName: account.DisplayName,
        PlayerLevel: inventory.PlayerLevel,
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
        MigratedToConsole: false,
        Missions: inventory.Missions,
        Affiliations: inventory.Affiliations,
        DailyFocus: inventory.DailyFocus,
        Wishlist: inventory.Wishlist,
        Alignment: inventory.Alignment
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
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
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
    const data = await getProfileViewingDataByPlayerIdImpl(payload.AccountId);
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

interface IPlayerProfileViewingDataResult extends Partial<IDailyAffiliations> {
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

let skinLookupTable: Record<number, string> | undefined;

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
                        if (!skinLookupTable) {
                            skinLookupTable = {};
                            for (const key of Object.keys(ExportCustoms)) {
                                skinLookupTable[catBreadHash(key)] = key;
                            }
                        }
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
        result.LoadOutPreset = loadout.NORMAL.id(inventory.CurrentLoadOutIds[0].$oid)!.toJSON<ILoadoutConfigClient>();
        result.LoadOutPreset.ItemId = undefined;
        const skins = new Set<string>();
        if (result.LoadOutPreset.s) {
            result.LoadOutInventory.Suits = [
                inventory.Suits.id(result.LoadOutPreset.s.ItemId.$oid)!.toJSON<IEquipmentClient>()
            ];
            resolveAndCollectSkins(inventory, skins, result.LoadOutInventory.Suits[0]);
        }
        if (result.LoadOutPreset.p) {
            result.LoadOutInventory.Pistols = [
                inventory.Pistols.id(result.LoadOutPreset.p.ItemId.$oid)!.toJSON<IEquipmentClient>()
            ];
            resolveAndCollectSkins(inventory, skins, result.LoadOutInventory.Pistols[0]);
        }
        if (result.LoadOutPreset.l) {
            result.LoadOutInventory.LongGuns = [
                inventory.LongGuns.id(result.LoadOutPreset.l.ItemId.$oid)!.toJSON<IEquipmentClient>()
            ];
            resolveAndCollectSkins(inventory, skins, result.LoadOutInventory.LongGuns[0]);
        }
        if (result.LoadOutPreset.m) {
            result.LoadOutInventory.Melee = [
                inventory.Melee.id(result.LoadOutPreset.m.ItemId.$oid)!.toJSON<IEquipmentClient>()
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
