import { Alliance, AllianceMember, Guild, GuildMember } from "../../models/guildModel.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import { parallelForeach } from "../../utils/async-utils.ts";
import { logger } from "../../utils/logger.ts";
import type { RequestHandler } from "express";

export const divvyAllianceVaultController: RequestHandler = async (req, res) => {
    // Afaict, there's no way to put anything other than credits in the alliance vault (anymore?), so just no-op if this is not a request to divvy credits.
    if (req.query.credits == "1") {
        // Check requester is a warlord in their guild
        const account = await getAccountForRequest(req);
        const guildMember = (await GuildMember.findOne({ accountId: account._id, status: 0 }))!;
        if (guildMember.rank > 1) {
            res.status(400).end();
            return;
        }

        // Check guild has treasurer permissions in the alliance
        const allianceMember = (await AllianceMember.findOne({
            allianceId: req.query.allianceId,
            guildId: guildMember.guildId
        }))!;
        if (!(allianceMember.Permissions & GuildPermission.Treasurer)) {
            res.status(400).end();
            return;
        }

        const allianceMembers = await AllianceMember.find({ allianceId: req.query.allianceId });
        const memberCounts: Record<string, number> = {};
        let totalMembers = 0;
        await parallelForeach(allianceMembers, async allianceMember => {
            const memberCount = await GuildMember.countDocuments({
                guildId: allianceMember.guildId
            });
            memberCounts[allianceMember.guildId.toString()] = memberCount;
            totalMembers += memberCount;
        });
        logger.debug(`alliance has ${totalMembers} members between all its clans`);

        const alliance = (await Alliance.findById(allianceMember.allianceId, "VaultRegularCredits"))!;
        if (alliance.VaultRegularCredits) {
            let creditsHandedOutInTotal = 0;
            await parallelForeach(allianceMembers, async allianceMember => {
                const memberCount = memberCounts[allianceMember.guildId.toString()];
                const cutPercentage = memberCount / totalMembers;
                const creditsToHandOut = Math.trunc(alliance.VaultRegularCredits! * cutPercentage);
                logger.debug(
                    `${allianceMember.guildId.toString()} has ${memberCount} member(s) = ${Math.trunc(cutPercentage * 100)}% of alliance; giving ${creditsToHandOut} credit(s)`
                );
                if (creditsToHandOut != 0) {
                    await Guild.updateOne(
                        { _id: allianceMember.guildId },
                        { $inc: { VaultRegularCredits: creditsToHandOut } }
                    );
                    creditsHandedOutInTotal += creditsToHandOut;
                }
            });
            alliance.VaultRegularCredits -= creditsHandedOutInTotal;
            logger.debug(
                `handed out ${creditsHandedOutInTotal} credits; alliance vault now has ${alliance.VaultRegularCredits} credit(s)`
            );
        }
        await alliance.save();
    }
    res.end();
};
