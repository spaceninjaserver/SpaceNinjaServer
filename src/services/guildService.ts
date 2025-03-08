import { Request } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { Guild, TGuildDatabaseDocument } from "@/src/models/guildModel";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import {
    IDojoClient,
    IDojoComponentClient,
    IDojoContributable,
    IDojoDecoClient,
    IGuildVault
} from "@/src/types/guildTypes";
import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";
import { Types } from "mongoose";
import { ExportDojoRecipes, IDojoBuild } from "warframe-public-export-plus";
import { logger } from "../utils/logger";

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
    guild.DojoComponents.forEach(dojoComponent => {
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
                if (dojoComponent.DestructionTime) {
                    if (Date.now() >= dojoComponent.DestructionTime.getTime()) {
                        roomsToRemove.push(dojoComponent._id);
                        return;
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
    });
    if (roomsToRemove.length) {
        logger.debug(`removing now-destroyed rooms`, roomsToRemove);
        for (const id of roomsToRemove) {
            removeDojoRoom(guild, id);
        }
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
