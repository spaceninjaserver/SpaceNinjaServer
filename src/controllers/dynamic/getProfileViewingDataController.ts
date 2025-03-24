import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";
import { Guild } from "@/src/models/guildModel";
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
import { catBreadHash } from "../api/inventoryController";
import { ExportCustoms } from "warframe-public-export-plus";

export const getProfileViewingDataController: RequestHandler = async (req, res) => {
    if (!req.query.playerId) {
        res.status(400).end();
        return;
    }
    const account = await Account.findById(req.query.playerId as string, "DisplayName");
    if (!account) {
        res.status(400).send("No account or guild ID specified");
        return;
    }
    const inventory = (await Inventory.findOne({ accountOwnerId: account._id }))!;
    const loadout = (await Loadout.findById(inventory.LoadOutPresets, "NORMAL"))!;

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
    if (inventory.CurrentLoadOutIds.length) {
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
    if (inventory.GuildId) {
        const guild = (await Guild.findById(inventory.GuildId, "Name Tier XP Class"))!;
        result.GuildId = toOid(inventory.GuildId);
        result.GuildName = guild.Name;
        result.GuildTier = guild.Tier;
        result.GuildXp = guild.XP;
        result.GuildClass = guild.Class;
        result.GuildEmblem = false;
    }
    for (const key of allDailyAffiliationKeys) {
        result[key] = inventory[key];
    }

    const stats = (await Stats.findOne({ accountOwnerId: account._id }))!.toJSON<Partial<TStatsDatabaseDocument>>();
    delete stats._id;
    delete stats.__v;
    delete stats.accountOwnerId;

    res.json({
        Results: [result],
        TechProjects: [],
        XpComponents: [],
        //XpCacheExpiryDate, some IMongoDate in the future, no clue what it's for
        Stats: stats
    });
};

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
    PlayerSkills: IPlayerSkills;
    ChallengeProgress: IChallengeProgress[];
    DeathMarks: string[];
    Harvestable: boolean;
    DeathSquadable: boolean;
    Created: IMongoDate;
    MigratedToConsole: boolean;
    Missions: IMission[];
    Affiliations: IAffiliation[];
    DailyFocus: number;
    Wishlist: string[];
    Alignment?: IAlignment;
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
