import { toMongoDate2 } from "../../helpers/inventoryHelpers.ts";
import { Guild } from "../../models/guildModel.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import type { IMongoDateWithLegacySupport } from "../../types/commonTypes.ts";
import type { RequestHandler } from "express";

export const getGuildLogController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString(), "GuildId");
    if (inventory.GuildId) {
        const guild = await Guild.findById(inventory.GuildId);
        if (guild) {
            const log: Record<string, IGuildLogEntryClient[]> = {
                RoomChanges: [],
                TechChanges: [],
                RosterActivity: [],
                StandingsUpdates: [],
                ClassChanges: []
            };
            guild.RoomChanges?.forEach(entry => {
                log.RoomChanges.push({
                    dateTime: toMongoDate2(entry.dateTime ?? new Date(), account.BuildLabel),
                    entryType: entry.entryType,
                    details: entry.details
                });
            });
            guild.TechChanges?.forEach(entry => {
                log.TechChanges.push({
                    dateTime: toMongoDate2(entry.dateTime ?? new Date(), account.BuildLabel),
                    entryType: entry.entryType,
                    details: entry.details
                });
            });
            guild.RosterActivity?.forEach(entry => {
                log.RosterActivity.push({
                    dateTime: toMongoDate2(entry.dateTime, account.BuildLabel),
                    entryType: entry.entryType,
                    details: entry.details
                });
            });
            guild.ClassChanges?.forEach(entry => {
                log.ClassChanges.push({
                    dateTime: toMongoDate2(entry.dateTime, account.BuildLabel),
                    entryType: entry.entryType,
                    details: entry.details
                });
            });
            res.json(log);
            return;
        }
    }
    res.sendStatus(200);
};

interface IGuildLogEntryClient {
    dateTime: IMongoDateWithLegacySupport;
    entryType: number;
    details: number | string;
}
