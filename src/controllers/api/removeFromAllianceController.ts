import { AllianceMember, Guild, GuildMember } from "@/src/models/guildModel";
import { deleteAlliance } from "@/src/services/guildService";
import { getAccountForRequest } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import type { RequestHandler } from "express";

export const removeFromAllianceController: RequestHandler = async (req, res) => {
    // Check requester is a warlord in their guild
    const account = await getAccountForRequest(req);
    const guildMember = (await GuildMember.findOne({ accountId: account._id, status: 0 }))!;
    if (guildMember.rank > 1) {
        res.status(400).json({ Error: 104 });
        return;
    }

    let allianceMember = (await AllianceMember.findOne({ guildId: guildMember.guildId }))!;
    if (!guildMember.guildId.equals(req.query.guildId as string)) {
        // Removing a guild that is not our own needs additional permissions
        if (!(allianceMember.Permissions & GuildPermission.Ruler)) {
            res.status(400).json({ Error: 104 });
            return;
        }

        // Update allianceMember to point to the alliance to kick
        allianceMember = (await AllianceMember.findOne({ guildId: req.query.guildId }))!;
    }

    if (allianceMember.Permissions & GuildPermission.Ruler) {
        await deleteAlliance(allianceMember.allianceId);
    } else {
        await Promise.all([
            await Guild.updateOne({ _id: allianceMember.guildId }, { $unset: { AllianceId: "" } }),
            await AllianceMember.deleteOne({ _id: allianceMember._id })
        ]);
    }

    res.end();
};
