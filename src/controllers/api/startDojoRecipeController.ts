import { RequestHandler } from "express";
import { IDojoComponentClient } from "@/src/types/guildTypes";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Guild } from "@/src/models/guildModel";
import { Types } from "mongoose";

interface IStartDojoRecipeRequest {
    PlacedComponent: IDojoComponentClient;
    Revision: number;
}

export const startDojoRecipeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await Inventory.findOne({ accountOwnerId: accountId });
    if (!inventory) {
        res.status(400).end();
        return;
    }
    const guildId = req.query.guildId as string;
    if (!inventory.GuildId || inventory.GuildId.toString() != guildId) {
        res.status(400).end();
        return;
    }
    // Verified that a member of the guild is making this request. Assuming they are allowed to start a build.
    const guild = (await Guild.findOne({ _id: guildId }))!;
    const request = JSON.parse(req.body.toString()) as IStartDojoRecipeRequest;
    guild.DojoComponents!.push({
        _id: new Types.ObjectId(),
        pf: request.PlacedComponent.pf,
        ppf: request.PlacedComponent.ppf,
        pi: new Types.ObjectId(request.PlacedComponent.pi!.$oid),
        op: request.PlacedComponent.op,
        pp: request.PlacedComponent.pp,
        CompletionTime: new Date(Date.now()) // TOOD: Omit this field & handle the "Collecting Materials" state.
    });
    await guild.save();
    res.json({
        DojoRequestStatus: 0
    });
};
