import { Request } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { Alliance, AllianceMember, Guild, GuildAd, GuildMember, TGuildDatabaseDocument } from "@/src/models/guildModel";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import {
    GuildPermission,
    IAllianceClient,
    IAllianceDatabase,
    IAllianceMemberClient,
    IDojoClient,
    IDojoComponentClient,
    IDojoComponentDatabase,
    IDojoContributable,
    IDojoDecoClient,
    IGuildClient,
    IGuildMemberClient,
    IGuildMemberDatabase,
    IGuildVault,
    ITechProjectDatabase
} from "@/src/types/guildTypes";
import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";
import { Types } from "mongoose";
import { ExportDojoRecipes, ExportResources, IDojoBuild, IDojoResearch } from "warframe-public-export-plus";
import { logger } from "../utils/logger";
import { config } from "./configService";
import { Account } from "../models/loginModel";
import { getRandomInt } from "./rngService";
import { Inbox } from "../models/inboxModel";
import { IFusionTreasure, ITypeCount } from "../types/inventoryTypes/inventoryTypes";
import { IInventoryChanges } from "../types/purchaseTypes";
import { parallelForeach } from "../utils/async-utils";

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
    const guild = await Guild.findById(guildId);
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
            Status: guildMember.status,
            Note: guildMember.RequestMsg,
            RequestExpiry: guildMember.RequestExpiry ? toMongoDate(guildMember.RequestExpiry) : undefined
        };
        if (guildMember.accountId.equals(accountId)) {
            missingEntry = false;
        } else {
            member.DisplayName = (await Account.findById(guildMember.accountId, "DisplayName"))!.DisplayName;
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
        Tier: guild.Tier,
        Vault: getGuildVault(guild),
        ActiveDojoColorResearch: guild.ActiveDojoColorResearch,
        Class: guild.Class,
        XP: guild.XP,
        IsContributor: !!guild.CeremonyContributors?.find(x => x.equals(accountId)),
        NumContributors: guild.CeremonyContributors?.length ?? 0,
        CeremonyResetDate: guild.CeremonyResetDate ? toMongoDate(guild.CeremonyResetDate) : undefined,
        AllianceId: guild.AllianceId ? toOid(guild.AllianceId) : undefined
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
        Tier: guild.Tier,
        GuildEmblem: guild.Emblem,
        TradeTax: guild.TradeTax,
        NumContributors: guild.CeremonyContributors?.length ?? 0,
        CeremonyResetDate: guild.CeremonyResetDate ? toMongoDate(guild.CeremonyResetDate) : undefined,
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

                    let newTier: number | undefined;
                    switch (dojoComponent.pf) {
                        case "/Lotus/Levels/ClanDojo/ClanDojoBarracksShadow.level":
                            newTier = 2;
                            break;
                        case "/Lotus/Levels/ClanDojo/ClanDojoBarracksStorm.level":
                            newTier = 3;
                            break;
                        case "/Lotus/Levels/ClanDojo/ClanDojoBarracksMountain.level":
                            newTier = 4;
                            break;
                        case "/Lotus/Levels/ClanDojo/ClanDojoBarracksMoon.level":
                            newTier = 5;
                            break;
                    }
                    if (newTier) {
                        logger.debug(`clan finished building barracks, updating to tier ${newTier}`);
                        await setGuildTier(guild, newTier);
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
                        Name: deco.Name,
                        Sockets: deco.Sockets,
                        PictureFrameInfo: deco.PictureFrameInfo
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
            await removeDojoRoom(guild, id);
        }
        needSave = true;
    }
    if (needSave) {
        await guild.save();
    }
    dojo.Tier = guild.Tier;
    return dojo;
};

const guildTierScalingFactors = [0.01, 0.03, 0.1, 0.3, 1];
export const scaleRequiredCount = (tier: number, count: number): number => {
    return Math.max(1, Math.trunc(count * guildTierScalingFactors[tier - 1]));
};

export const removeDojoRoom = async (
    guild: TGuildDatabaseDocument,
    componentId: Types.ObjectId | string
): Promise<void> => {
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

    switch (component.pf) {
        case "/Lotus/Levels/ClanDojo/ClanDojoBarracksShadow.level":
            await setGuildTier(guild, 1);
            break;
        case "/Lotus/Levels/ClanDojo/ClanDojoBarracksStorm.level":
            await setGuildTier(guild, 2);
            break;
        case "/Lotus/Levels/ClanDojo/ClanDojoBarracksMountain.level":
            await setGuildTier(guild, 3);
            break;
        case "/Lotus/Levels/ClanDojo/ClanDojoBarracksMoon.level":
            await setGuildTier(guild, 4);
            break;
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
    if (meta) {
        if (meta.capacityCost) {
            component.DecoCapacity! += meta.capacityCost;
        }
    } else {
        const itemType = Object.entries(ExportResources).find(arr => arr[1].deco == deco.Type)![0];
        if (deco.Sockets !== undefined) {
            addVaultFusionTreasures(guild, [
                {
                    ItemType: itemType,
                    ItemCount: 1,
                    Sockets: deco.Sockets
                }
            ]);
        } else {
            addVaultShipDecos(guild, [
                {
                    ItemType: itemType,
                    ItemCount: 1
                }
            ]);
        }
    }
    moveResourcesToVault(guild, deco);
};

const moveResourcesToVault = (guild: TGuildDatabaseDocument, component: IDojoContributable): void => {
    if (component.RegularCredits) {
        guild.VaultRegularCredits ??= 0;
        guild.VaultRegularCredits += component.RegularCredits;
    }
    if (component.MiscItems) {
        addVaultMiscItems(guild, component.MiscItems);
    }
    if (component.RushPlatinum) {
        guild.VaultPremiumCredits ??= 0;
        guild.VaultPremiumCredits += component.RushPlatinum;
    }
};

export const getVaultMiscItemCount = (guild: TGuildDatabaseDocument, itemType: string): number => {
    return guild.VaultMiscItems?.find(x => x.ItemType == itemType)?.ItemCount ?? 0;
};

export const addVaultMiscItems = (guild: TGuildDatabaseDocument, miscItems: ITypeCount[]): void => {
    guild.VaultMiscItems ??= [];
    for (const item of miscItems) {
        const vaultItem = guild.VaultMiscItems.find(x => x.ItemType == item.ItemType);
        if (vaultItem) {
            vaultItem.ItemCount += item.ItemCount;
        } else {
            guild.VaultMiscItems.push(item);
        }
    }
};

export const addVaultShipDecos = (guild: TGuildDatabaseDocument, shipDecos: ITypeCount[]): void => {
    guild.VaultShipDecorations ??= [];
    for (const item of shipDecos) {
        const vaultItem = guild.VaultShipDecorations.find(x => x.ItemType == item.ItemType);
        if (vaultItem) {
            vaultItem.ItemCount += item.ItemCount;
        } else {
            guild.VaultShipDecorations.push(item);
        }
    }
};

export const addVaultFusionTreasures = (guild: TGuildDatabaseDocument, fusionTreasures: IFusionTreasure[]): void => {
    guild.VaultFusionTreasures ??= [];
    for (const item of fusionTreasures) {
        const vaultItem = guild.VaultFusionTreasures.find(
            x => x.ItemType == item.ItemType && x.Sockets == item.Sockets
        );
        if (vaultItem) {
            vaultItem.ItemCount += item.ItemCount;
        } else {
            guild.VaultFusionTreasures.push(item);
        }
    }
};

export const addGuildMemberMiscItemContribution = (guildMember: IGuildMemberDatabase, item: ITypeCount): void => {
    guildMember.MiscItemsContributed ??= [];
    const miscItemContribution = guildMember.MiscItemsContributed.find(x => x.ItemType == item.ItemType);
    if (miscItemContribution) {
        miscItemContribution.ItemCount += item.ItemCount;
    } else {
        guildMember.MiscItemsContributed.push(item);
    }
};

export const addGuildMemberShipDecoContribution = (guildMember: IGuildMemberDatabase, item: ITypeCount): void => {
    guildMember.ShipDecorationsContributed ??= [];
    const shipDecoContribution = guildMember.ShipDecorationsContributed.find(x => x.ItemType == item.ItemType);
    if (shipDecoContribution) {
        shipDecoContribution.ItemCount += item.ItemCount;
    } else {
        guildMember.ShipDecorationsContributed.push(item);
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

export const removePigmentsFromGuildMembers = async (guildId: string | Types.ObjectId): Promise<void> => {
    const members = await GuildMember.find({ guildId, status: 0 }, "accountId");
    for (const member of members) {
        const inventory = await getInventory(member.accountId.toString(), "MiscItems");
        const index = inventory.MiscItems.findIndex(
            x => x.ItemType == "/Lotus/Types/Items/Research/DojoColors/GenericDojoColorPigment"
        );
        if (index != -1) {
            inventory.MiscItems.splice(index, 1);
            await inventory.save();
        }
    }
};

export const processGuildTechProjectContributionsUpdate = async (
    guild: TGuildDatabaseDocument,
    techProject: ITechProjectDatabase
): Promise<void> => {
    if (techProject.ReqCredits == 0 && !techProject.ReqItems.find(x => x.ItemCount > 0)) {
        // This research is now fully funded.

        if (
            techProject.State == 0 &&
            techProject.ItemType.substring(0, 39) == "/Lotus/Types/Items/Research/DojoColors/"
        ) {
            guild.ActiveDojoColorResearch = "";
            await removePigmentsFromGuildMembers(guild._id);
        }

        const recipe = ExportDojoRecipes.research[techProject.ItemType];
        processFundedGuildTechProject(guild, techProject, recipe);
    }
};

export const processFundedGuildTechProject = (
    guild: TGuildDatabaseDocument,
    techProject: ITechProjectDatabase,
    recipe: IDojoResearch
): void => {
    techProject.State = 1;
    techProject.CompletionDate = new Date(Date.now() + (config.noDojoResearchTime ? 0 : recipe.time) * 1000);
    if (recipe.guildXpValue) {
        guild.XP += recipe.guildXpValue;
    }
    setGuildTechLogState(guild, techProject.ItemType, config.noDojoResearchTime ? 4 : 3, techProject.CompletionDate);
};

export const setGuildTechLogState = (
    guild: TGuildDatabaseDocument,
    type: string,
    state: number,
    dateTime: Date | undefined = undefined
): boolean => {
    guild.TechChanges ??= [];
    const entry = guild.TechChanges.find(x => x.details == type);
    if (entry) {
        if (entry.entryType == state) {
            return false;
        }
        entry.dateTime = dateTime;
        entry.entryType = state;
    } else {
        guild.TechChanges.push({
            dateTime: dateTime,
            entryType: state,
            details: type
        });
    }
    return true;
};

const setGuildTier = async (guild: TGuildDatabaseDocument, newTier: number): Promise<void> => {
    const oldTier = guild.Tier;
    guild.Tier = newTier;
    if (guild.TechProjects) {
        for (const project of guild.TechProjects) {
            if (project.State == 1) {
                continue;
            }

            const meta = ExportDojoRecipes.research[project.ItemType];

            {
                const numContributed = scaleRequiredCount(oldTier, meta.price) - project.ReqCredits;
                project.ReqCredits = scaleRequiredCount(newTier, meta.price) - numContributed;
                if (project.ReqCredits < 0) {
                    guild.VaultRegularCredits ??= 0;
                    guild.VaultRegularCredits += project.ReqCredits * -1;
                    project.ReqCredits = 0;
                }
            }

            for (let i = 0; i != project.ReqItems.length; ++i) {
                const numContributed =
                    scaleRequiredCount(oldTier, meta.ingredients[i].ItemCount) - project.ReqItems[i].ItemCount;
                project.ReqItems[i].ItemCount =
                    scaleRequiredCount(newTier, meta.ingredients[i].ItemCount) - numContributed;
                if (project.ReqItems[i].ItemCount < 0) {
                    project.ReqItems[i].ItemCount *= -1;
                    addVaultMiscItems(guild, [project.ReqItems[i]]);
                    project.ReqItems[i].ItemCount = 0;
                }
            }

            // Check if research is fully funded now due to lowered requirements.
            await processGuildTechProjectContributionsUpdate(guild, project);
        }
    }
};

export const removeDojoKeyItems = (inventory: TInventoryDatabaseDocument): IInventoryChanges => {
    const inventoryChanges: IInventoryChanges = {};

    const itemIndex = inventory.LevelKeys.findIndex(x => x.ItemType == "/Lotus/Types/Keys/DojoKey");
    if (itemIndex != -1) {
        inventoryChanges.LevelKeys = [
            {
                ItemType: "/Lotus/Types/Keys/DojoKey",
                ItemCount: inventory.LevelKeys[itemIndex].ItemCount * -1
            }
        ];
        inventory.LevelKeys.splice(itemIndex, 1);
    }

    const recipeIndex = inventory.Recipes.findIndex(x => x.ItemType == "/Lotus/Types/Keys/DojoKeyBlueprint");
    if (recipeIndex != -1) {
        inventoryChanges.Recipes = [
            {
                ItemType: "/Lotus/Types/Keys/DojoKeyBlueprint",
                ItemCount: inventory.Recipes[recipeIndex].ItemCount * -1
            }
        ];
        inventory.Recipes.splice(recipeIndex, 1);
    }

    return inventoryChanges;
};

export const deleteGuild = async (guildId: Types.ObjectId): Promise<void> => {
    await Guild.deleteOne({ _id: guildId });

    const guildMembers = await GuildMember.find({ guildId, status: 0 }, "accountId");
    await parallelForeach(guildMembers, async member => {
        const inventory = await getInventory(member.accountId.toString(), "GuildId LevelKeys Recipes");
        inventory.GuildId = undefined;
        removeDojoKeyItems(inventory);
        await inventory.save();
    });

    await GuildMember.deleteMany({ guildId });

    // If guild sent any invites, delete those inbox messages as well.
    await Inbox.deleteMany({
        contextInfo: guildId.toString(),
        acceptAction: "GUILD_INVITE"
    });

    await GuildAd.deleteOne({ GuildId: guildId });

    // If guild is the creator of an alliance, delete that as well.
    const allianceMember = await AllianceMember.findOne({ guildId, Pending: false });
    if (allianceMember) {
        if (allianceMember.Permissions & GuildPermission.Ruler) {
            await deleteAlliance(allianceMember.allianceId);
        }
    }

    await AllianceMember.deleteMany({ guildId });
};

export const deleteAlliance = async (allianceId: Types.ObjectId): Promise<void> => {
    const allianceMembers = await AllianceMember.find({ allianceId, Pending: false });
    await parallelForeach(allianceMembers, async allianceMember => {
        await Guild.updateOne({ _id: allianceMember.guildId }, { $unset: { AllianceId: "" } });
    });

    await AllianceMember.deleteMany({ allianceId });

    await Alliance.deleteOne({ _id: allianceId });
};

export const getAllianceClient = async (
    alliance: IAllianceDatabase,
    guild: TGuildDatabaseDocument
): Promise<IAllianceClient> => {
    const allianceMembers = await AllianceMember.find({ allianceId: alliance._id });
    const clans: IAllianceMemberClient[] = [];
    for (const allianceMember of allianceMembers) {
        const memberGuild = allianceMember.guildId.equals(guild._id)
            ? guild
            : (await Guild.findById(allianceMember.guildId))!;
        clans.push({
            _id: toOid(allianceMember.guildId),
            Name: memberGuild.Name,
            Tier: memberGuild.Tier,
            Pending: allianceMember.Pending,
            Permissions: allianceMember.Permissions,
            MemberCount: await GuildMember.countDocuments({ guildId: memberGuild._id, status: 0 })
        });
    }
    return {
        _id: toOid(alliance._id),
        Name: alliance.Name,
        MOTD: alliance.MOTD,
        LongMOTD: alliance.LongMOTD,
        Clans: clans,
        AllianceVault: {
            DojoRefundRegularCredits: alliance.VaultRegularCredits
        }
    };
};
