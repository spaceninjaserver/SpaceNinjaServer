import { toMongoDate } from "@/src/helpers/inventoryHelpers";
import { Guild } from "@/src/models/guildModel";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IMongoDate } from "@/src/types/commonTypes";
import { RequestHandler } from "express";

export const getGuildLogController: RequestHandler = async (req, res) => {
    const log: Record<string, IGuildLogEntryClient[]> = {
        RoomChanges: [],
        TechChanges: [],
        RosterActivity: [],
        StandingsUpdates: [],
        ClassChanges: []
    };
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    if (inventory.GuildId) {
        const guild = await Guild.findOne({ _id: inventory.GuildId });
        if (guild) {
            guild.ClassChanges?.forEach(entry => {
                log.ClassChanges.push({
                    dateTime: toMongoDate(entry.dateTime),
                    entryType: entry.entryType,
                    details: entry.details
                });
            });
        }
    }
    res.json(log);
};

interface IGuildLogEntryClient {
    dateTime: IMongoDate;
    entryType: number;
    details: number | string;
}
