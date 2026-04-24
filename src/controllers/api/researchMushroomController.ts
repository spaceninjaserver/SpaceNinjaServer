import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { addMiscItem, getInventory } from "../../services/inventoryService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { logger } from "../../utils/logger.ts";
import type { IJournalEntry } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { IAffiliationMods } from "../../types/purchaseTypes.ts";

export const researchMushroomController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "MiscItems NokkoColony Affiliations");
    const payload = getJSONfromString<IResearchMushroom>(String(req.body));
    switch (payload.Mode) {
        case "r": {
            const InventoryChanges = {};
            const AffiliationMods: IAffiliationMods[] = [];

            addMiscItem(inventory, payload.MushroomItem, payload.Amount * -1, InventoryChanges);
            if (payload.Convert) {
                addMiscItem(inventory, "/Lotus/Types/Items/MiscItems/MushroomFood", payload.Amount, InventoryChanges);
            }

            inventory.NokkoColony ??= {
                FeedLevel: 0,
                JournalEntries: []
            };

            let journalEntry = inventory.NokkoColony.JournalEntries.find(x => x.EntryType == payload.MushroomItem);
            if (!journalEntry) {
                journalEntry =
                    inventory.NokkoColony.JournalEntries[
                        inventory.NokkoColony.JournalEntries.push({ EntryType: payload.MushroomItem, Progress: 0 }) - 1
                    ];
            }

            let syndicate = inventory.Affiliations.find(x => x.Tag == "NightcapJournalSyndicate");
            if (!syndicate) {
                syndicate = { Tag: "NightcapJournalSyndicate", Title: 0, Standing: 0 };
                inventory.Affiliations.push(syndicate);
            }
            const completedBefore = inventory.NokkoColony.JournalEntries.filter(
                entry => getJournalRank(entry) === 3
            ).length;
            const PrevRank = syndicateTitleThresholds.reduce(
                (rank, threshold, i) => (completedBefore >= threshold ? i : rank),
                0
            );

            if (getJournalRank(journalEntry) < 3) journalEntry.Progress += payload.Amount;

            const completedAfter = inventory.NokkoColony.JournalEntries.filter(
                entry => getJournalRank(entry) === 3
            ).length;
            const NewRank = syndicateTitleThresholds.reduce(
                (rank, threshold, i) => (completedAfter >= threshold ? i : rank),
                0
            );

            if (NewRank > (syndicate.Title ?? 0)) {
                syndicate.Title = NewRank;
                AffiliationMods.push({ Tag: "NightcapJournalSyndicate", Title: NewRank });
            }

            await inventory.save();
            res.json({
                PrevRank,
                NewRank,
                Progress: journalEntry.Progress,
                InventoryChanges,
                AffiliationMods
            });
            break;
        }

        default:
            logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
            throw new Error(`unknown researchMushroom mode: ${payload.Mode}`);
    }
};

interface IResearchMushroom {
    Mode: string; // r
    MushroomItem: string;
    Amount: number;
    Convert: boolean;
}

const journalEntryRankUpRequirements: Record<string, [number, number, number]> = {
    "/Lotus/Types/Items/MushroomJournal/HeatMushroomJournalItem": [3, 6, 9],
    "/Lotus/Types/Items/MushroomJournal/CorrosiveMushroomJournalItem": [4, 8, 12],
    "/Lotus/Types/Items/MushroomJournal/SlashMushroomJournalItem": [3, 6, 9],
    "/Lotus/Types/Items/MushroomJournal/PlainMushroomJournalItem": [1, 1, 2], // Stinky
    "/Lotus/Types/Items/MushroomJournal/MagneticMushroomJournalItem": [4, 8, 12],
    "/Lotus/Types/Items/MushroomJournal/RadiationMushroomJournalItem": [4, 8, 12],
    "/Lotus/Types/Items/MushroomJournal/ImpactMushroomJournalItem": [3, 6, 9],
    "/Lotus/Types/Items/MushroomJournal/ToxinMushroomJournalItem": [3, 6, 9],
    "/Lotus/Types/Items/MushroomJournal/VoidMushroomJournalItem": [5, 10, 15],
    "/Lotus/Types/Items/MushroomJournal/GasMushroomJournalItem": [4, 8, 12],
    "/Lotus/Types/Items/MushroomJournal/BlastMushroomJournalItem": [4, 8, 12],
    "/Lotus/Types/Items/MushroomJournal/PunctureMushroomJournalItem": [3, 6, 9],
    "/Lotus/Types/Items/MushroomJournal/ElectricMushroomJournalItem": [3, 6, 9],
    "/Lotus/Types/Items/MushroomJournal/ViralMushroomJournalItem": [4, 8, 12],
    "/Lotus/Types/Items/MushroomJournal/TauMushroomJournalItem": [5, 10, 15],
    "/Lotus/Types/Items/MushroomJournal/ColdMushroomJournalItem": [3, 6, 9]
};

const syndicateTitleThresholds = [0, 1, 2, 6, 12, 16];

const getJournalRank = (journalEntry: IJournalEntry): number => {
    const requirements = journalEntryRankUpRequirements[journalEntry.EntryType] as [number, number, number] | undefined;
    if (requirements) {
        const rankOneThreshold = requirements[0];
        const rankTwoThreshold = rankOneThreshold + requirements[1];
        const rankThreeThreshold = rankTwoThreshold + requirements[2];

        if (journalEntry.Progress >= rankThreeThreshold) return 3;
        if (journalEntry.Progress >= rankTwoThreshold) return 2;
        if (journalEntry.Progress >= rankOneThreshold) return 1;
    }
    return 0;
};
