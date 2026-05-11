import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";
import { toMongoDate2, version_compare } from "../../helpers/inventoryHelpers.ts";
import { Guild } from "../../models/guildModel.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import type { IMongoDateWithLegacySupport } from "../../types/commonTypes.ts";
import type { RequestHandler } from "express";

export const getGuildLogController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const inventory = await getInventory(account._id, "GuildId");
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
                    dateTime: toMongoDate2(entry.dateTime ?? new Date(), buildLabel),
                    entryType: entry.entryType,
                    details: cleanupDetails(entry.details, buildLabel)
                });
            });
            guild.TechChanges?.forEach(entry => {
                log.TechChanges.push({
                    dateTime: toMongoDate2(entry.dateTime ?? new Date(), buildLabel),
                    entryType: entry.entryType,
                    details: cleanupDetails(entry.details, buildLabel)
                });
            });
            guild.RosterActivity?.forEach(entry => {
                log.RosterActivity.push({
                    dateTime: toMongoDate2(entry.dateTime, buildLabel),
                    entryType: entry.entryType,
                    details: cleanupDetails(entry.details, buildLabel)
                });
            });
            guild.ClassChanges?.forEach(entry => {
                log.ClassChanges.push({
                    dateTime: toMongoDate2(entry.dateTime, buildLabel),
                    entryType: entry.entryType,
                    details: cleanupDetails(entry.details, buildLabel)
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

const cleanupDetails = (details: number | string, buildLabel: string): number | string => {
    if (typeof details == "string" && version_compare(buildLabel, gameToBuildVersion["32.0.0"]) < 0) {
        // Remove the number suffix so pre-U32 clients don't show it. U32+ clients currently don't show it because we don't set CrossPlatformEnabled to true.
        return details
            .split(",")
            .map(x => x.split("#")[0])
            .join(",");
    }
    return details;
};
