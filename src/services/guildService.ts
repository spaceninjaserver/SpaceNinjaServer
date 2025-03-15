import { Request } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addRecipes, getInventory } from "@/src/services/inventoryService";
import { Guild, GuildMember, TGuildDatabaseDocument } from "@/src/models/guildModel";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import {
    GuildPermission,
    IDojoClient,
    IDojoComponentClient,
    IDojoComponentDatabase,
    IDojoContributable,
    IDojoDecoClient,
    IGuildClient,
    IGuildMemberClient,
    IGuildMemberDatabase,
    IGuildVault
} from "@/src/types/guildTypes";
import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";
import { Types } from "mongoose";
import { ExportDojoRecipes, IDojoBuild } from "warframe-public-export-plus";
import { logger } from "../utils/logger";
import { config } from "./configService";
import { Account } from "../models/loginModel";
import { getRandomInt } from "./rngService";

export const getGuildForRequest = async (req: Request): Promise<TGuildDatabaseDocument> => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    return await getGuildForRequestEx(req, inventory);
};

export const getGuildForRequestEx = async (
    req: Request,
    inventory: TInventoryDatabaseDocument
): Promise<TGuildDatabaseDocument> => {
    const guildId = req.query.guildId as string;
    if (!inventory.GuildId || inventory.GuildId.toString() != guildId) {
        throw new Error("Account is not in the guild that it has sent a request for");
    }
    const guild = await Guild.findOne({ _id: guildId });
    if (!guild) {
        throw new Error("Account thinks it is in a guild that doesn't exist");
    }
    return guild;
};

export const getGuildClient = async (guild: TGuildDatabaseDocument, accountId: string): Promise<IGuildClient> => {
    const guildMembers = await GuildMember.find({ guildId: guild._id });

    const members: IGuildMemberClient[] = [];
    let missingEntry = true;
    for (const guildMember of guildMembers) {
        const member: IGuildMemberClient = {
            _id: toOid(guildMember.accountId),
            Rank: guildMember.rank,
            Status: guildMember.status
        };
        if (guildMember.accountId.equals(accountId)) {
            missingEntry = false;
        } else {
            member.DisplayName = (await Account.findOne(
                {
                    _id: guildMember.accountId
                },
                "DisplayName"
            ))!.DisplayName;
            await fillInInventoryDataForGuildMember(member);
        }
        members.push(member);
    }
    if (missingEntry) {
        // Handle clans created prior to creation of the GuildMember model.
        await GuildMember.insertOne({
            accountId: accountId,
            guildId: guild._id,
            status: 0,
            rank: 0
        });
        members.push({
            _id: { $oid: accountId },
            Status: 0,
            Rank: 0
        });
    }

    return {
        _id: toOid(guild._id),
        Name: guild.Name,
        MOTD: guild.MOTD,
        LongMOTD: guild.LongMOTD,
        Members: members,
        Ranks: guild.Ranks,
        TradeTax: guild.TradeTax,
        Tier: 1,
        Vault: getGuildVault(guild),
        Class: guild.Class,
        XP: guild.XP,
        IsContributor: !!guild.CeremonyContributors?.find(x => x.equals(accountId)),
        NumContributors: guild.CeremonyContributors?.length ?? 0,
        CeremonyResetDate: guild.CeremonyResetDate ? toMongoDate(guild.CeremonyResetDate) : undefined
    };
};

export const getGuildVault = (guild: TGuildDatabaseDocument): IGuildVault => {
    return {
        DojoRefundRegularCredits: guild.VaultRegularCredits,
        DojoRefundMiscItems: guild.VaultMiscItems,
        DojoRefundPremiumCredits: guild.VaultPremiumCredits,
        ShipDecorations: guild.VaultShipDecorations,
        FusionTreasures: guild.VaultFusionTreasures
    };
};

export const getDojoClient = async (
    guild: TGuildDatabaseDocument,
    status: number,
    componentId: Types.ObjectId | string | undefined = undefined
): Promise<IDojoClient> => {
    const dojo: IDojoClient = {
        _id: { $oid: guild._id.toString() },
        Name: guild.Name,
        Tier: 1,
        FixedContributions: true,
        DojoRevision: 1,
        Vault: getGuildVault(guild),
        RevisionTime: Math.round(Date.now() / 1000),
        Energy: guild.DojoEnergy,
        Capacity: guild.DojoCapacity,
        DojoRequestStatus: status,
        DojoComponents: []
    };
    const roomsToRemove: Types.ObjectId[] = [];
    let needSave = false;
    for (const dojoComponent of guild.DojoComponents) {
        if (!componentId || dojoComponent._id.equals(componentId)) {
            const clientComponent: IDojoComponentClient = {
                id: toOid(dojoComponent._id),
                pf: dojoComponent.pf,
                ppf: dojoComponent.ppf,
                Name: dojoComponent.Name,
                Message: dojoComponent.Message,
                DecoCapacity: dojoComponent.DecoCapacity ?? 600
            };
            if (dojoComponent.pi) {
                clientComponent.pi = toOid(dojoComponent.pi);
                clientComponent.op = dojoComponent.op!;
                clientComponent.pp = dojoComponent.pp!;
            }
            if (dojoComponent.CompletionTime) {
                clientComponent.CompletionTime = toMongoDate(dojoComponent.CompletionTime);
                if (dojoComponent.CompletionLogPending && Date.now() >= dojoComponent.CompletionTime.getTime()) {
                    const entry = guild.RoomChanges?.find(x => x.componentId.equals(dojoComponent._id));
                    if (entry) {
                        dojoComponent.CompletionLogPending = undefined;
                        entry.entryType = 1;
                        needSave = true;
                    }
                }
                if (dojoComponent.DestructionTime) {
                    if (Date.now() >= dojoComponent.DestructionTime.getTime()) {
                        roomsToRemove.push(dojoComponent._id);
                        continue;
                    }
                    clientComponent.DestructionTime = toMongoDate(dojoComponent.DestructionTime);
                }
            } else {
                clientComponent.RegularCredits = dojoComponent.RegularCredits;
                clientComponent.MiscItems = dojoComponent.MiscItems;
            }
            if (dojoComponent.Decos) {
                clientComponent.Decos = [];
                for (const deco of dojoComponent.Decos) {
                    const clientDeco: IDojoDecoClient = {
                        id: toOid(deco._id),
                        Type: deco.Type,
                        Pos: deco.Pos,
                        Rot: deco.Rot,
                        Name: deco.Name
                    };
                    if (deco.CompletionTime) {
                        clientDeco.CompletionTime = toMongoDate(deco.CompletionTime);
                    } else {
                        clientDeco.RegularCredits = deco.RegularCredits;
                        clientDeco.MiscItems = deco.MiscItems;
                    }
                    clientComponent.Decos.push(clientDeco);
                }
            }
            dojo.DojoComponents.push(clientComponent);
        }
    }
    if (roomsToRemove.length) {
        logger.debug(`removing now-destroyed rooms`, roomsToRemove);
        for (const id of roomsToRemove) {
            removeDojoRoom(guild, id);
        }
        needSave = true;
    }
    if (needSave) {
        await guild.save();
    }
    return dojo;
};

export const scaleRequiredCount = (count: number): number => {
    // The recipes in the export are for Moon clans. For now we'll just assume we only have Ghost clans.
    return Math.max(1, Math.trunc(count / 100));
};

export const removeDojoRoom = (guild: TGuildDatabaseDocument, componentId: Types.ObjectId | string): void => {
    const component = guild.DojoComponents.splice(
        guild.DojoComponents.findIndex(x => x._id.equals(componentId)),
        1
    )[0];
    const meta = Object.values(ExportDojoRecipes.rooms).find(x => x.resultType == component.pf);
    if (meta) {
        guild.DojoCapacity -= meta.capacity;
        guild.DojoEnergy -= meta.energy;
    }
    moveResourcesToVault(guild, component);
    component.Decos?.forEach(deco => moveResourcesToVault(guild, deco));

    if (guild.RoomChanges) {
        const index = guild.RoomChanges.findIndex(x => x.componentId.equals(component._id));
        if (index != -1) {
            guild.RoomChanges.splice(index, 1);
        }
    }
};

export const removeDojoDeco = (
    guild: TGuildDatabaseDocument,
    componentId: Types.ObjectId | string,
    decoId: Types.ObjectId | string
): void => {
    const component = guild.DojoComponents.id(componentId)!;
    const deco = component.Decos!.splice(
        component.Decos!.findIndex(x => x._id.equals(decoId)),
        1
    )[0];
    const meta = Object.values(ExportDojoRecipes.decos).find(x => x.resultType == deco.Type);
    if (meta && meta.capacityCost) {
        component.DecoCapacity! += meta.capacityCost;
    }
    moveResourcesToVault(guild, deco);
};

const moveResourcesToVault = (guild: TGuildDatabaseDocument, component: IDojoContributable): void => {
    if (component.RegularCredits) {
        guild.VaultRegularCredits ??= 0;
        guild.VaultRegularCredits += component.RegularCredits;
    }
    if (component.MiscItems) {
        guild.VaultMiscItems ??= [];
        for (const componentMiscItem of component.MiscItems) {
            const vaultMiscItem = guild.VaultMiscItems.find(x => x.ItemType == componentMiscItem.ItemType);
            if (vaultMiscItem) {
                vaultMiscItem.ItemCount += componentMiscItem.ItemCount;
            } else {
                guild.VaultMiscItems.push(componentMiscItem);
            }
        }
    }
    if (component.RushPlatinum) {
        guild.VaultPremiumCredits ??= 0;
        guild.VaultPremiumCredits += component.RushPlatinum;
    }
};

export const processDojoBuildMaterialsGathered = (guild: TGuildDatabaseDocument, build: IDojoBuild): void => {
    if (build.guildXpValue) {
        guild.ClaimedXP ??= [];
        if (!guild.ClaimedXP.find(x => x == build.resultType)) {
            guild.ClaimedXP.push(build.resultType);
            guild.XP += build.guildXpValue;
        }
    }
};

// guild.save(); is expected some time after this function is called
export const setDojoRoomLogFunded = (guild: TGuildDatabaseDocument, component: IDojoComponentDatabase): void => {
    const entry = guild.RoomChanges?.find(x => x.componentId.equals(component._id));
    if (entry && entry.entryType == 2) {
        entry.entryType = 0;
        entry.dateTime = component.CompletionTime!;
        component.CompletionLogPending = true;
    }
};

export const fillInInventoryDataForGuildMember = async (member: IGuildMemberClient): Promise<void> => {
    const inventory = await getInventory(member._id.$oid, "PlayerLevel ActiveAvatarImageType");
    member.PlayerLevel = config.spoofMasteryRank == -1 ? inventory.PlayerLevel : config.spoofMasteryRank;
    member.ActiveAvatarImageType = inventory.ActiveAvatarImageType;
};

export const updateInventoryForConfirmedGuildJoin = async (
    accountId: string,
    guildId: Types.ObjectId
): Promise<void> => {
    const inventory = await getInventory(accountId);

    // Set GuildId
    inventory.GuildId = guildId;

    // Give clan key blueprint
    addRecipes(inventory, [
        {
            ItemType: "/Lotus/Types/Keys/DojoKeyBlueprint",
            ItemCount: 1
        }
    ]);

    await inventory.save();
};

export const createUniqueClanName = async (name: string): Promise<string> => {
    const initialDiscriminator = getRandomInt(0, 999);
    let discriminator = initialDiscriminator;
    do {
        const fullName = name + "#" + discriminator.toString().padStart(3, "0");
        if (!(await Guild.exists({ Name: fullName }))) {
            return fullName;
        }
        discriminator = (discriminator + 1) % 1000;
    } while (discriminator != initialDiscriminator);
    throw new Error(`clan name is so unoriginal it's already been done 1000 times: ${name}`);
};

export const hasAccessToDojo = (inventory: TInventoryDatabaseDocument): boolean => {
    return inventory.LevelKeys.find(x => x.ItemType == "/Lotus/Types/Keys/DojoKey") !== undefined;
};

export const hasGuildPermission = async (
    guild: TGuildDatabaseDocument,
    accountId: string | Types.ObjectId,
    perm: GuildPermission
): Promise<boolean> => {
    const member = await GuildMember.findOne({ accountId: accountId, guildId: guild._id });
    if (member) {
        return hasGuildPermissionEx(guild, member, perm);
    }
    return false;
};

export const hasGuildPermissionEx = (
    guild: TGuildDatabaseDocument,
    member: IGuildMemberDatabase,
    perm: GuildPermission
): boolean => {
    const rank = guild.Ranks[member.rank];
    return (rank.Permissions & perm) != 0;
};
