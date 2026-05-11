import type { RequestHandler } from "express";
import allScans from "../../../static/fixed_responses/allScans.json" with { type: "json" };
import { ExportCodex, ExportEnemies } from "warframe-public-export-plus";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getStats } from "../../services/statsService.ts";
import {
    addShipDecorations,
    getInventory,
    giveThousandYearFishDeco,
    updateIncentiveStates
} from "../../services/inventoryService.ts";
import { getShipDecoByNameTag } from "../../services/itemDataService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const unlockAllScansController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const [stats, inventory] = await Promise.all([
        getStats(accountId),
        getInventory(
            accountId,
            "ChallengeProgress CollectibleSeries LoreFragmentScans ShipDecorations receivedThousandYearFishDeco accountOwnerId"
        )
    ]);

    // Unlock all enemy & object scans
    const scanTypes = new Set<string>(allScans);
    for (const type of Object.keys(ExportEnemies.avatars)) {
        scanTypes.add(type);
    }
    for (const type of Object.keys(ExportCodex.objects)) {
        scanTypes.add(type);
    }
    stats.Scans = [];
    for (const type of scanTypes) {
        stats.Scans.push({ type, scans: 9999 });
    }

    // Complete the junction scan challenge
    const jsCodex = inventory.ChallengeProgress.find(x => x.Name === "JSCodexScan");
    if (jsCodex) {
        jsCodex.Progress = 1;
    } else {
        inventory.ChallengeProgress.push({
            Name: "JSCodexScan",
            Progress: 1
        });
    }

    // Complete the mars to phobos junction scan challenge for older versions
    const mpCephFragments = inventory.ChallengeProgress.find(x => x.Name == "MPCephFragments");
    if (mpCephFragments) {
        mpCephFragments.Progress = 3;
    } else {
        inventory.ChallengeProgress.push({
            Name: "MPCephFragments",
            Progress: 3
        });
    }

    // Unlock all kuria scans
    inventory.CollectibleSeries ??= [];
    let kuriaSeries = inventory.CollectibleSeries.find(
        x => x.CollectibleType == "/Lotus/Objects/Orokin/Props/CollectibleSeriesOne"
    );
    if (!kuriaSeries) {
        kuriaSeries =
            inventory.CollectibleSeries[
                inventory.CollectibleSeries.push({
                    CollectibleType: "/Lotus/Objects/Orokin/Props/CollectibleSeriesOne",
                    Count: 0,
                    Tracking:
                        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                    ReqScans: 56,
                    IncentiveStates: [
                        {
                            threshold: 0.5,
                            complete: false,
                            sent: false
                        },
                        {
                            threshold: 0.75,
                            complete: false,
                            sent: false
                        }
                    ]
                }) - 1
            ];
    }
    if (kuriaSeries.Count != kuriaSeries.ReqScans) {
        kuriaSeries.Count = kuriaSeries.ReqScans;
        kuriaSeries.Tracking =
            "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111";
        await updateIncentiveStates(accountId, kuriaSeries);
    }

    // Unlock all duviri fragments
    let duviriSeries = inventory.CollectibleSeries.find(
        x => x.CollectibleType == "/Lotus/Types/Lore/Fragments/DuviriFragments/DuviriCollectibleDeco"
    );
    if (!duviriSeries) {
        duviriSeries =
            inventory.CollectibleSeries[
                inventory.CollectibleSeries.push({
                    CollectibleType: "/Lotus/Types/Lore/Fragments/DuviriFragments/DuviriCollectibleDeco",
                    Count: 0,
                    Tracking:
                        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                    ReqScans: 90,
                    IncentiveStates: []
                }) - 1
            ];
    }
    if (duviriSeries.Count != duviriSeries.ReqScans) {
        duviriSeries.Count = duviriSeries.ReqScans;
        duviriSeries.Tracking =
            "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111";
    }

    // Unlock all isleweaver fragments
    let spiderSeries = inventory.CollectibleSeries.find(
        x => x.CollectibleType == "/Lotus/Types/Lore/Fragments/DuviriMITWFragments/DuviriMITWCollectibleDeco"
    );
    if (!spiderSeries) {
        spiderSeries =
            inventory.CollectibleSeries[
                inventory.CollectibleSeries.push({
                    CollectibleType: "/Lotus/Types/Lore/Fragments/DuviriMITWFragments/DuviriMITWCollectibleDeco",
                    Count: 0,
                    Tracking:
                        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                    ReqScans: 15,
                    IncentiveStates: []
                }) - 1
            ];
    }
    if (spiderSeries.Count != spiderSeries.ReqScans) {
        spiderSeries.Count = spiderSeries.ReqScans;
        spiderSeries.Tracking =
            "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111";
        await updateIncentiveStates(accountId, spiderSeries);
    }

    // Unlock all lore fragment scans
    const existingPrex = new Set<string>();
    for (const lfs of inventory.LoreFragmentScans) {
        if (lfs.ItemType.startsWith("/Lotus/Types/Lore/Fragments/LoreCardFragments/")) {
            existingPrex.add(lfs.ItemType);
        }
    }
    inventory.LoreFragmentScans = [];
    for (const [ItemType, data] of Object.entries(ExportCodex.loreFragments)) {
        inventory.LoreFragmentScans.push({
            Progress: data.reqScans,
            Region: "",
            ItemType
        });
        if (ItemType.startsWith("/Lotus/Types/Lore/Fragments/LoreCardFragments/") && !existingPrex.has(ItemType)) {
            addShipDecorations(inventory, [
                {
                    ItemType: getShipDecoByNameTag(data.name),
                    ItemCount: 1
                }
            ]);
        }
    }
    for (const [ItemType, data] of Object.entries(ExportCodex.songs)) {
        inventory.LoreFragmentScans.push({
            Progress: data.reqScans,
            Region: "",
            ItemType
        });
    }
    for (const [ItemType, data] of Object.entries(ExportCodex.fighterFrames)) {
        inventory.LoreFragmentScans.push({
            Progress: data.reqScans,
            Region: "",
            ItemType
        });
    }
    if (!inventory.receivedThousandYearFishDeco) {
        await giveThousandYearFishDeco(inventory); // needs accountOwnerId
    }

    await Promise.all([stats.save(), inventory.save()]);
    res.end();
    broadcastInventoryUpdate(req);
};
