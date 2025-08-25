import { Guild } from "../models/guildModel.ts";
import type { TLeaderboardEntryDocument } from "../models/leaderboardModel.ts";
import { Leaderboard } from "../models/leaderboardModel.ts";
import type { ILeaderboardEntryClient } from "../types/leaderboardTypes.ts";
import { handleGuildGoalProgress } from "./guildService.ts";
import { getWorldState } from "./worldStateService.ts";
import { Types } from "mongoose";

export const submitLeaderboardScore = async (
    schedule: "weekly" | "daily" | "events",
    leaderboard: string,
    ownerId: string,
    displayName: string,
    score: number,
    guildId: string | undefined
): Promise<void> => {
    let expiry: Date | undefined;
    if (schedule == "daily") {
        expiry = new Date(Math.trunc(Date.now() / 86400000) * 86400000 + 86400000);
    } else if (schedule == "weekly") {
        const EPOCH = 1734307200 * 1000; // Monday
        const week = Math.trunc((Date.now() - EPOCH) / 604800000);
        const weekStart = EPOCH + week * 604800000;
        const weekEnd = weekStart + 604800000;
        expiry = new Date(weekEnd);
    }

    if (guildId) {
        const guild = (await Guild.findById(guildId, "Name Tier GoalProgress VaultDecoRecipes"))!;
        if (schedule == "events") {
            const prevAccount = await Leaderboard.findOne(
                { leaderboard: `${schedule}.accounts.${leaderboard}`, ownerId },
                "score"
            );
            const delta = score - (prevAccount?.score ?? 0);
            if (delta > 0) {
                await Leaderboard.findOneAndUpdate(
                    { leaderboard: `${schedule}.guilds.${leaderboard}`, ownerId: guildId },
                    { $inc: { score: delta }, $set: { displayName: guild.Name, guildTier: guild.Tier } },
                    { upsert: true }
                );
                const goal = getWorldState().Goals.find(x => x.ScoreMaxTag == leaderboard);
                if (goal) {
                    await handleGuildGoalProgress(guild, {
                        Count: delta,
                        Tag: goal.Tag,
                        goalId: new Types.ObjectId(goal._id.$oid)
                    });
                }
            }
        } else {
            await Leaderboard.findOneAndUpdate(
                { leaderboard: `${schedule}.guilds.${leaderboard}`, ownerId: guildId },
                { $max: { score }, $set: { displayName: guild.Name, guildTier: guild.Tier, expiry } },
                { upsert: true, new: true }
            );
        }
    }

    await Leaderboard.findOneAndUpdate(
        { leaderboard: `${schedule}.accounts.${leaderboard}`, ownerId },
        { $max: { score }, $set: { displayName, guildId, expiry } },
        { upsert: true }
    );
};

export const getLeaderboard = async (
    leaderboard: string,
    before: number,
    after: number,
    pivotId: string | undefined,
    guildId: string | undefined,
    guildTier: number | undefined
): Promise<ILeaderboardEntryClient[]> => {
    leaderboard = leaderboard.replace("archived", guildTier || guildId ? "events.guilds" : "events.accounts");
    const filter: { leaderboard: string; guildId?: string; guildTier?: number } = { leaderboard };
    if (guildId) {
        filter.guildId = guildId;
    }
    if (guildTier) {
        filter.guildTier = guildTier;
    }

    let entries: TLeaderboardEntryDocument[];
    let r: number;
    if (pivotId) {
        const pivotDoc = await Leaderboard.findOne({ ...filter, ownerId: pivotId });
        if (!pivotDoc) {
            return [];
        }
        const beforeDocs = await Leaderboard.find({
            ...filter,
            score: { $gt: pivotDoc.score }
        })
            .sort({ score: 1 })
            .limit(before);
        const afterDocs = await Leaderboard.find({
            ...filter,
            score: { $lt: pivotDoc.score }
        })
            .sort({ score: -1 })
            .limit(after);
        entries = [...beforeDocs.reverse(), pivotDoc, ...afterDocs];
        r =
            (await Leaderboard.countDocuments({
                ...filter,
                score: { $gt: pivotDoc.score }
            })) - beforeDocs.length;
    } else {
        entries = await Leaderboard.find(filter)
            .sort({ score: -1 })
            .skip(before)
            .limit(after - before);
        r = before;
    }
    const res: ILeaderboardEntryClient[] = [];
    for (const entry of entries) {
        res.push({
            _id: entry.ownerId.toString(),
            s: entry.score,
            r: ++r,
            n: entry.displayName
        });
    }
    return res;
};
