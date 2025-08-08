import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { EPOCH, getSeasonChallengePools, getWorldState, pushWeeklyActs } from "@/src/services/worldStateService";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import { ISeasonChallenge } from "@/src/types/worldStateTypes";
import { ExportChallenges } from "warframe-public-export-plus";

export const getPastWeeklyChallengesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "SeasonChallengeHistory ChallengeProgress");
    const worldState = getWorldState(undefined);

    if (worldState.SeasonInfo) {
        const pools = getSeasonChallengePools(worldState.SeasonInfo.AffiliationTag);
        const nightwaveStartTimestamp = Number(worldState.SeasonInfo.Activation.$date.$numberLong);
        const nightwaveSeason = worldState.SeasonInfo.Season;
        const timeMs = worldState.Time * 1000;
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

        const PastWeeklyChallenges: ISeasonChallenge[] = [];

        let week = Math.trunc((timeMs - EPOCH) / unixTimesInMs.week) - 1;

        while (EPOCH + week * unixTimesInMs.week >= nightwaveStartTimestamp && PastWeeklyChallenges.length < 3) {
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

            week--;
        }

        res.json({ PastWeeklyChallenges: PastWeeklyChallenges });
    }
};
