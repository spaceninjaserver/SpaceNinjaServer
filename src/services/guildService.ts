import { Request } from "express";
import { getAccountIdForRequest, TAccountDocument } from "@/src/services/loginService";
import { addLevelKeys, addRecipes, combineInventoryChanges, getInventory } from "@/src/services/inventoryService";
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
    IDojoDecoDatabase,
    IGuildClient,
    IGuildMemberClient,
    IGuildMemberDatabase,
    IGuildVault,
    ITechProjectDatabase
} from "@/src/types/guildTypes";
import { toMongoDate, toOid, toOid2 } from "@/src/helpers/inventoryHelpers";
import { Types } from "mongoose";
import { ExportDojoRecipes, ExportResources, IDojoBuild, IDojoResearch } from "warframe-public-export-plus";
import { logger } from "@/src/utils/logger";
import { config } from "@/src/services/configService";
import { getRandomInt } from "@/src/services/rngService";
import { Inbox } from "@/src/models/inboxModel";
import { IFusionTreasure } from "@/src/types/inventoryTypes/inventoryTypes";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { parallelForeach } from "@/src/utils/async-utils";
import allDecoRecipes from "@/static/fixed_responses/allDecoRecipes.json";
import { createMessage } from "@/src/services/inboxService";
import { addAccountDataToFriendInfo, addInventoryDataToFriendInfo } from "@/src/services/friendService";
import { ITypeCount } from "@/src/types/commonTypes";

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

export const getGuildClient = async (
    guild: TGuildDatabaseDocument,
    account: TAccountDocument
): Promise<IGuildClient> => {
    const guildMembers = await GuildMember.find({ guildId: guild._id });

    const members: IGuildMemberClient[] = [];
    let missingEntry = true;
    const dataFillInPromises: Promise<void>[] = [];
    for (const guildMember of guildMembers) {
        const member: IGuildMemberClient = {
            _id: toOid2(guildMember.accountId, account.BuildLabel),
            Rank: guildMember.rank,
            Status: guildMember.status,
            Note: guildMember.RequestMsg,
            RequestExpiry: guildMember.RequestExpiry ? toMongoDate(guildMember.RequestExpiry) : undefined
        };
        if (guildMember.accountId.equals(account._id)) {
            missingEntry = false;
        } else {
            dataFillInPromises.push(addAccountDataToFriendInfo(member));
            dataFillInPromises.push(addInventoryDataToFriendInfo(member));
        }
        members.push(member);
    }
    if (missingEntry) {
        // Handle clans created prior to creation of the GuildMember model.
        await GuildMember.insertOne({
            accountId: account._id,
            guildId: guild._id,
            status: 0,
            rank: 0
        });
        members.push({
            _id: toOid2(account._id, account.BuildLabel),
            Status: 0,
            Rank: 0
        });
    }

    await Promise.all(dataFillInPromises);

    return {
        _id: toOid2(guild._id, account.BuildLabel),
        Name: guild.Name,
        MOTD: guild.MOTD,
        LongMOTD: guild.LongMOTD,
        Members: members,
        Ranks: guild.Ranks,
        Tier: guild.Tier,
        Emblem: guild.Emblem,
        Vault: getGuildVault(guild),
        ActiveDojoColorResearch: guild.ActiveDojoColorResearch,
        Class: guild.Class,
        XP: guild.XP,
        IsContributor: !!guild.CeremonyContributors?.find(x => x.equals(account._id)),
        NumContributors: guild.CeremonyContributors?.length ?? 0,
        CeremonyResetDate: guild.CeremonyResetDate ? toMongoDate(guild.CeremonyResetDate) : undefined,
        AutoContributeFromVault: guild.AutoContributeFromVault,
        AllianceId: guild.AllianceId ? toOid2(guild.AllianceId, account.BuildLabel) : undefined,
        GoalProgress: guild.GoalProgress
            ? guild.GoalProgress.map(gp => ({
                  Count: gp.Count,
                  Tag: gp.Tag,
                  _id: { $oid: gp.goalId.toString() }
              }))
            : undefined
    };
};

export const getGuildVault = (guild: TGuildDatabaseDocument): IGuildVault => {
    return {
        DojoRefundRegularCredits: guild.VaultRegularCredits,
        DojoRefundMiscItems: guild.VaultMiscItems,
        DojoRefundPremiumCredits: guild.VaultPremiumCredits,
        ShipDecorations: guild.VaultShipDecorations,
        FusionTreasures: guild.VaultFusionTreasures,
        DecoRecipes: config.unlockAllDecoRecipes
            ? allDecoRecipes.map(recipe => ({ ItemType: recipe, ItemCount: 1 }))
            : guild.VaultDecoRecipes
    };
};

export const getDojoClient = async (
    guild: TGuildDatabaseDocument,
    status: number,
    componentId?: Types.ObjectId | string,
    buildLabel?: string
): Promise<IDojoClient> => {
    const dojo: IDojoClient = {
        _id: toOid2(guild._id, buildLabel),
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
    const decosToRemoveNoRefund: { componentId: Types.ObjectId; decoId: Types.ObjectId }[] = [];
    let needSave = false;
    for (const dojoComponent of guild.DojoComponents) {
        if (!componentId || dojoComponent._id.equals(componentId)) {
            const clientComponent: IDojoComponentClient = {
                id: toOid2(dojoComponent._id, buildLabel),
                SortId: toOid2(dojoComponent.SortId ?? dojoComponent._id, buildLabel), // always providing a SortId so decos don't need repositioning to reparent
                pf: dojoComponent.pf,
                ppf: dojoComponent.ppf,
                Name: dojoComponent.Name,
                Message: dojoComponent.Message,
                DecoCapacity: dojoComponent.DecoCapacity ?? 600,
                Settings: dojoComponent.Settings
            };
            if (dojoComponent.pi) {
                clientComponent.pi = toOid2(dojoComponent.pi, buildLabel);
                clientComponent.op = dojoComponent.op!;
                clientComponent.pp = dojoComponent.pp!;
            }
            if (dojoComponent.CompletionTime) {
                clientComponent.CompletionTime = toMongoDate(dojoComponent.CompletionTime);
                clientComponent.TimeRemaining = Math.trunc(
                    (dojoComponent.CompletionTime.getTime() - Date.now()) / 1000
                );
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
                    clientComponent.DestructionTimeRemaining = Math.trunc(
                        (dojoComponent.DestructionTime.getTime() - Date.now()) / 1000
                    );
                }
            } else {
                clientComponent.RegularCredits = dojoComponent.RegularCredits;
                clientComponent.MiscItems = dojoComponent.MiscItems;
            }
            if (dojoComponent.Decos) {
                clientComponent.Decos = [];
                for (const deco of dojoComponent.Decos) {
                    const clientDeco: IDojoDecoClient = {
                        id: toOid2(deco._id, buildLabel),
                        Type: deco.Type,
                        Pos: deco.Pos,
                        Rot: deco.Rot,
                        Scale: deco.Scale,
                        Name: deco.Name,
                        Sockets: deco.Sockets,
                        PictureFrameInfo: deco.PictureFrameInfo
                    };
                    if (deco.CompletionTime) {
                        if (
                            deco.Type == "/Lotus/Objects/Tenno/Props/TnoPaintBotDojoDeco" &&
                            Date.now() >= deco.CompletionTime.getTime()
                        ) {
                            if (dojoComponent.PendingColors) {
                                dojoComponent.Colors = dojoComponent.PendingColors;
                                dojoComponent.PendingColors = undefined;
                            }
                            if (dojoComponent.PendingLights) {
                                dojoComponent.Lights = dojoComponent.PendingLights;
                                dojoComponent.PendingLights = undefined;
                            }
                            decosToRemoveNoRefund.push({ componentId: dojoComponent._id, decoId: deco._id });
                            continue;
                        }
                        clientDeco.CompletionTime = toMongoDate(deco.CompletionTime);
                        clientDeco.TimeRemaining = Math.trunc((deco.CompletionTime.getTime() - Date.now()) / 1000);
                    } else {
                        clientDeco.RegularCredits = deco.RegularCredits;
                        clientDeco.MiscItems = deco.MiscItems;
                    }
                    clientComponent.Decos.push(clientDeco);
                }
            }
            clientComponent.PendingColors = dojoComponent.PendingColors;
            clientComponent.Colors = dojoComponent.Colors;
            clientComponent.PendingLights = dojoComponent.PendingLights;
            clientComponent.Lights = dojoComponent.Lights;
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
    for (const deco of decosToRemoveNoRefund) {
        logger.debug(`removing polychrome`, deco);
        const component = guild.DojoComponents.id(deco.componentId)!;
        component.Decos!.splice(
            component.Decos!.findIndex(x => x._id.equals(deco.decoId)),
            1
        );
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
    component.Decos?.forEach(deco => refundDojoDeco(guild, component, deco));

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
    refundDojoDeco(guild, component, deco);
};

export const refundDojoDeco = (
    guild: TGuildDatabaseDocument,
    component: IDojoComponentDatabase,
    deco: IDojoDecoDatabase
): void => {
    const meta = Object.values(ExportDojoRecipes.decos).find(x => x.resultType == deco.Type);
    if (meta) {
        if (meta.capacityCost) {
            component.DecoCapacity! += meta.capacityCost;
        }
    } else {
        const [itemType, meta] = Object.entries(ExportResources).find(arr => arr[1].deco == deco.Type)!;
        component.DecoCapacity! += meta.dojoCapacityCost!;
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
    moveResourcesToVault(guild, deco); // Refund resources spent on construction
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
        if (guild.ClaimedXP.indexOf(build.resultType) == -1) {
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
    await parallelForeach(members, async member => {
        const inventory = await getInventory(member.accountId.toString(), "MiscItems");
        const index = inventory.MiscItems.findIndex(
            x => x.ItemType == "/Lotus/Types/Items/Research/DojoColors/GenericDojoColorPigment"
        );
        if (index != -1) {
            inventory.MiscItems.splice(index, 1);
            await inventory.save();
        }
    });
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
    if (config.noDojoResearchTime) {
        processCompletedGuildTechProject(guild, techProject.ItemType);
    }
};

export const processCompletedGuildTechProject = (guild: TGuildDatabaseDocument, type: string): void => {
    if (type.startsWith("/Lotus/Levels/ClanDojo/ComponentPropRecipes/NpcPlaceables/")) {
        guild.VaultDecoRecipes ??= [];
        guild.VaultDecoRecipes.push({
            ItemType: type,
            ItemCount: 1
        });
    }
};

export const setGuildTechLogState = (
    guild: TGuildDatabaseDocument,
    type: string,
    state: number,
    dateTime?: Date
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
    if (guild.CeremonyContributors) {
        await checkClanAscensionHasRequiredContributors(guild);
    }
};

export const checkClanAscensionHasRequiredContributors = async (guild: TGuildDatabaseDocument): Promise<void> => {
    const requiredContributors = [1, 5, 15, 30, 50][guild.Tier - 1];
    // Once required contributor count is hit, the class is committed and there's 72 hours to claim endo.
    if (guild.CeremonyContributors!.length >= requiredContributors) {
        guild.Class = guild.CeremonyClass!;
        guild.CeremonyClass = undefined;
        guild.CeremonyResetDate = new Date(Date.now() + (config.fastClanAscension ? 5_000 : 72 * 3600_000));
        if (!config.fastClanAscension) {
            // Send message to all active guild members
            const members = await GuildMember.find({ guildId: guild._id, status: 0 }, "accountId");
            await parallelForeach(members, async member => {
                // somewhat unfaithful as on live the "msg" is not a loctag, but since we don't have the string, we'll let the client fill it in with "arg".
                await createMessage(member.accountId, [
                    {
                        sndr: guild.Name,
                        msg: "/Lotus/Language/Clan/Clan_AscensionCeremonyInProgressDetails",
                        arg: [
                            {
                                Key: "RESETDATE",
                                Tag:
                                    guild.CeremonyResetDate!.getUTCMonth() +
                                    "/" +
                                    guild.CeremonyResetDate!.getUTCDate() +
                                    "/" +
                                    (guild.CeremonyResetDate!.getUTCFullYear() % 100) +
                                    " " +
                                    guild.CeremonyResetDate!.getUTCHours().toString().padStart(2, "0") +
                                    ":" +
                                    guild.CeremonyResetDate!.getUTCMinutes().toString().padStart(2, "0")
                            }
                        ],
                        sub: "/Lotus/Language/Clan/Clan_AscensionCeremonyInProgress",
                        icon: "/Lotus/Interface/Graphics/ClanTileImages/ClanEnterDojo.png",
                        highPriority: true
                    }
                ]);
            });
        }
    }
};

export const giveClanKey = (inventory: TInventoryDatabaseDocument, inventoryChanges?: IInventoryChanges): void => {
    if (inventory.skipClanKeyCrafting) {
        const levelKeyChanges = [
            {
                ItemType: "/Lotus/Types/Keys/DojoKey",
                ItemCount: 1
            }
        ];
        addLevelKeys(inventory, levelKeyChanges);
        if (inventoryChanges) {
            combineInventoryChanges(inventoryChanges, { LevelKeys: levelKeyChanges });
        }
    } else {
        const recipeChanges = [
            {
                ItemType: "/Lotus/Types/Keys/DojoKeyBlueprint",
                ItemCount: 1
            }
        ];
        addRecipes(inventory, recipeChanges);
        if (inventoryChanges) {
            combineInventoryChanges(inventoryChanges, { Recipes: recipeChanges });
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

export const handleGuildGoalProgress = async (
    guild: TGuildDatabaseDocument,
    upload: { Count: number; Tag: string; goalId: Types.ObjectId }
): Promise<void> => {
    guild.GoalProgress ??= [];
    const goalProgress = guild.GoalProgress.find(x => x.goalId.equals(upload.goalId));
    if (!goalProgress) {
        guild.GoalProgress.push({
            Count: upload.Count,
            Tag: upload.Tag,
            goalId: upload.goalId
        });
    }
    const totalCount = (goalProgress?.Count ?? 0) + upload.Count;
    const guildRewards = goalGuildRewardByTag[upload.Tag].rewards;
    const tierGoals = goalGuildRewardByTag[upload.Tag].guildGoals[guild.Tier - 1];
    const rewards = [];
    if (tierGoals.length && guildRewards.length) {
        for (let i = 0; i < tierGoals.length; i++) {
            if (
                tierGoals[i] &&
                tierGoals[i] <= totalCount &&
                (!goalProgress || goalProgress.Count < tierGoals[i]) &&
                guildRewards[i]
            ) {
                rewards.push(guildRewards[i]);
            }
        }

        if (rewards.length) {
            logger.debug(`guild goal rewards`, rewards);
            guild.VaultDecoRecipes ??= [];
            rewards.forEach(type => {
                guild.VaultDecoRecipes!.push({
                    ItemType: type,
                    ItemCount: 1
                });
            });
        }
    }

    if (goalProgress) {
        goalProgress.Count += upload.Count;
    }
    await guild.save();
};

export const goalGuildRewardByTag: Record<string, { guildGoals: number[][]; rewards: string[] }> = {
    JadeShadowsEvent: {
        guildGoals: [
            // I don't know what ClanGoal means
            [15, 30, 45, 60],
            [45, 90, 135, 180],
            [150, 300, 450, 600],
            [450, 900, 1350, 1800],
            [1500, 3000, 4500, 6000]
        ],
        rewards: [
            "/Lotus/Levels/ClanDojo/ComponentPropRecipes/JadeShadowsEventPewterTrophyRecipe",
            "/Lotus/Levels/ClanDojo/ComponentPropRecipes/JadeShadowsEventBronzeTrophyRecipe",
            "/Lotus/Levels/ClanDojo/ComponentPropRecipes/JadeShadowsEventSilverTrophyRecipe",
            "/Lotus/Levels/ClanDojo/ComponentPropRecipes/JadeShadowsEventGoldTrophyRecipe"
        ]
    },
    DuviriMurmurEvent: {
        guildGoals: [
            // I don't know what ClanGoal means
            [260, 519, 779, 1038],
            [779, 1557, 2336, 3114],
            [2595, 5190, 7785, 10380],
            [7785, 15570, 23355, 31140],
            [29950, 51900, 77850, 103800]
        ],
        rewards: [
            "/Lotus/Levels/ClanDojo/ComponentPropRecipes/DuviriMurmurEventClayTrophyRecipe",
            "/Lotus/Levels/ClanDojo/ComponentPropRecipes/DuviriMurmurEventBronzeTrophyRecipe",
            "/Lotus/Levels/ClanDojo/ComponentPropRecipes/DuviriMurmurEventSilverTrophyRecipe",
            "/Lotus/Levels/ClanDojo/ComponentPropRecipes/DuviriMurmurEventGoldTrophyRecipe"
        ]
    },
    MechSurvival: {
        guildGoals: [
            [1390, 5860, 13920, 18850],
            [3510, 22275, 69120, 137250],
            [11700, 75250, 230400, 457500],
            [35100, 222750, 691200, 1372500],
            [117000, 742500, 2304000, 4575000]
        ],
        rewards: [
            "/Lotus/Levels/ClanDojo/ComponentPropRecipes/MechEventTrophyTerracottaRecipe",
            "/Lotus/Levels/ClanDojo/ComponentPropRecipes/MechEventTrophyBronzeRecipe",
            "/Lotus/Levels/ClanDojo/ComponentPropRecipes/MechEventTrophySilverRecipe",
            "/Lotus/Levels/ClanDojo/ComponentPropRecipes/MechEventTrophyGoldRecipe"
        ]
    }
};
