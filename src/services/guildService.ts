import { Request } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { Guild, TGuildDatabaseDocument } from "@/src/models/guildModel";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { IDojoClient, IDojoComponentClient } from "@/src/types/guildTypes";
import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";

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

export const getDojoClient = (guild: TGuildDatabaseDocument, status: number): IDojoClient => {
    const dojo: IDojoClient = {
        _id: { $oid: guild._id.toString() },
        Name: guild.Name,
        Tier: 1,
        FixedContributions: true,
        DojoRevision: 1,
        RevisionTime: Math.round(Date.now() / 1000),
        Energy: guild.DojoEnergy,
        Capacity: guild.DojoCapacity,
        DojoRequestStatus: status,
        DojoComponents: []
    };
    guild.DojoComponents.forEach(dojoComponent => {
        const clientComponent: IDojoComponentClient = {
            id: toOid(dojoComponent._id),
            pf: dojoComponent.pf,
            ppf: dojoComponent.ppf,
            Name: dojoComponent.Name,
            Message: dojoComponent.Message,
            DecoCapacity: 600
        };
        if (dojoComponent.pi) {
            clientComponent.pi = toOid(dojoComponent.pi);
            clientComponent.op = dojoComponent.op!;
            clientComponent.pp = dojoComponent.pp!;
        }
        if (dojoComponent.CompletionTime) {
            clientComponent.CompletionTime = toMongoDate(dojoComponent.CompletionTime);
        }
        dojo.DojoComponents.push(clientComponent);
    });
    return dojo;
};
