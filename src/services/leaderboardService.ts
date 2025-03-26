import { Guild } from "../models/guildModel";
import { Leaderboard, TLeaderboardEntryDocument } from "../models/leaderboardModel";
import { ILeaderboardEntryClient } from "../types/leaderboardTypes";

export const submitLeaderboardScore = async (
    schedule: "weekly" | "daily",
    leaderboard: string,
    ownerId: string,
    displayName: string,
    score: number,
    guildId?: string
): Promise<void> => {
    let expiry: Date;
    if (schedule == "daily") {
        expiry = new Date(Math.trunc(Date.now() / 86400000) * 86400000 + 86400000);
    } else {
        const EPOCH = 1734307200 * 1000; // Monday
        const day = Math.trunc((Date.now() - EPOCH) / 86400000);
        const week = Math.trunc(day / 7);
        const weekStart = EPOCH + week * 604800000;
        const weekEnd = weekStart + 604800000;
        expiry = new Date(weekEnd);
    }
    await Leaderboard.findOneAndUpdate(
        { leaderboard: `${schedule}.accounts.${leaderboard}`, ownerId },
        { $max: { score }, $set: { displayName, guildId, expiry } },
        { upsert: true }
    );
    if (guildId) {
        const guild = (await Guild.findById(guildId, "Name Tier"))!;
        await Leaderboard.findOneAndUpdate(
            { leaderboard: `${schedule}.guilds.${leaderboard}`, ownerId: guildId },
            { $max: { score }, $set: { displayName: guild.Name, guildTier: guild.Tier, expiry } },
            { upsert: true }
        );
    }
};

export const getLeaderboard = async (
    leaderboard: string,
    before: number,
    after: number,
    guildId?: string,
    pivotId?: string,
    guildTier?: number
): Promise<ILeaderboardEntryClient[]> => {
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
