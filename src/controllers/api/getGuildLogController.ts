import { toMongoDate } from "../../helpers/inventoryHelpers.ts";
import { Guild } from "../../models/guildModel.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IMongoDate } from "../../types/commonTypes.ts";
import type { RequestHandler } from "express";

export const getGuildLogController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId");
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
                    dateTime: toMongoDate(entry.dateTime ?? new Date()),
                    entryType: entry.entryType,
                    details: entry.details
                });
            });
            guild.TechChanges?.forEach(entry => {
                log.TechChanges.push({
                    dateTime: toMongoDate(entry.dateTime ?? new Date()),
                    entryType: entry.entryType,
                    details: entry.details
                });
            });
            guild.RosterActivity?.forEach(entry => {
                log.RosterActivity.push({
                    dateTime: toMongoDate(entry.dateTime),
                    entryType: entry.entryType,
                    details: entry.details
                });
            });
            guild.ClassChanges?.forEach(entry => {
                log.ClassChanges.push({
                    dateTime: toMongoDate(entry.dateTime),
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
    dateTime: IMongoDate;
    entryType: number;
    details: number | string;
}
