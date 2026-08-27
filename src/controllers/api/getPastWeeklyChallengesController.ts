import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import {
    getNightwaveSyndicateTag,
    getSeasonChallengePools,
    getWorldStateTime,
    nightwaveTagToActivation,
    nightwaveTagToSeason,
    pushWeeklyActs
} from "../../services/worldStateService.ts";
import { EPOCH, unixTimesInMs } from "../../constants/timeConstants.ts";
import type { ISeasonChallenge } from "../../types/worldStateTypes.ts";
import { ExportChallenges } from "warframe-public-export-plus";
import { buildLabelToVersionInt } from "../../helpers/versionHelper.ts";

export const getPastWeeklyChallengesController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id, "SeasonChallengeHistory ChallengeProgress");
    const nightwaveSyndicateTag = getNightwaveSyndicateTag(buildLabelToVersionInt(account.BuildLabel!));
    const PastWeeklyChallenges: ISeasonChallenge[] = [];

    if (nightwaveSyndicateTag) {
        const pools = getSeasonChallengePools(nightwaveSyndicateTag);
        const hasPools = pools.weekly.length > 0 || pools.hardWeekly.length > 0 || pools.weeklyPermanent.length > 0;
        if (hasPools) {
            const nightwaveStartTimestamp = nightwaveTagToActivation[nightwaveSyndicateTag] ?? 1747851300000;
            const nightwaveSeason = nightwaveTagToSeason[nightwaveSyndicateTag];
            const { week } = getWorldStateTime();
            const completedChallengesIds = new Set<string>();

            inventory.SeasonChallengeHistory.forEach(challengeHistory => {
                const entryNightwaveSeason = parseInt(challengeHistory.id.slice(0, 4), 10) - 1;
                if (nightwaveSeason == entryNightwaveSeason) {
                    const meta = Object.entries(ExportChallenges).find(
                        ([key]) => key.split("/").pop() === challengeHistory.challenge
                    );
                    if (meta) {
                        const [, challengeMeta] = meta;
                        const challengeProgress = inventory.ChallengeProgress.find(
                            c => c.Name === challengeHistory.challenge
                        );

                        if (challengeProgress && challengeProgress.Progress >= (challengeMeta.requiredCount ?? 1)) {
                            completedChallengesIds.add(challengeHistory.id);
                        }
                    }
                }
            });
            let previousWeek = week - 1;

            while (
                EPOCH + previousWeek * unixTimesInMs.week >= nightwaveStartTimestamp &&
                PastWeeklyChallenges.length < 3
            ) {
                const tempActs: ISeasonChallenge[] = [];
                pushWeeklyActs(tempActs, pools, week, nightwaveStartTimestamp, nightwaveSeason);

                for (const act of tempActs) {
                    if (!completedChallengesIds.has(act._id.$oid) && PastWeeklyChallenges.length < 3) {
                        if (act.Challenge.startsWith("/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyPermanent")) {
                            act.Permanent = true;
                        }
                        PastWeeklyChallenges.push(act);
                    }
                }

                previousWeek--;
            }
        }
    }
    return res.json({ PastWeeklyChallenges: PastWeeklyChallenges });
};
