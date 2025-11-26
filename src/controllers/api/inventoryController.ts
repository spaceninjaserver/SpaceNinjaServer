import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import type { TInventoryDatabaseDocument } from "../../models/inventoryModels/inventoryModel.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { config } from "../../services/configService.ts";
import allDialogue from "../../../static/fixed_responses/allDialogue.json" with { type: "json" };
import allPopups from "../../../static/fixed_responses/allPopups.json" with { type: "json" };
import type { ILoadoutConfigClientLegacy, ILoadoutDatabase, ILoadOutPresets } from "../../types/saveLoadoutTypes.ts";
import type { IInventoryClient, IShipInventory, IUpgradeClient } from "../../types/inventoryTypes/inventoryTypes.ts";
import { equipmentKeys, loadoutKeysLegacy } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { IPolarity } from "../../types/inventoryTypes/commonInventoryTypes.ts";
import { ArtifactPolarity } from "../../types/inventoryTypes/commonInventoryTypes.ts";
import type { ICountedItem } from "warframe-public-export-plus";
import { ExportCustoms } from "warframe-public-export-plus";
import { applyCheatsToInfestedFoundry, handleSubsumeCompletion } from "../../services/infestedFoundryService.ts";
import {
    addEmailItem,
    addItem,
    addMiscItems,
    allDailyAffiliationKeys,
    checkCalendarAutoAdvance,
    cleanupInventory,
    createLibraryDailyTask,
    getCalendarProgress
} from "../../services/inventoryService.ts";
import { logger } from "../../utils/logger.ts";
import { addString, catBreadHash } from "../../helpers/stringHelpers.ts";
import { Types } from "mongoose";
import { getNemesisManifest } from "../../helpers/nemesisHelpers.ts";
import { getPersonalRooms } from "../../services/personalRoomsService.ts";
import type { IPersonalRoomsClient } from "../../types/personalRoomsTypes.ts";
import { Ship } from "../../models/shipModel.ts";
import {
    convertIColorToLegacyColors,
    convertIColorToLegacyColorsWithAtt,
    toLegacyOid,
    toOid,
    toOid2,
    version_compare
} from "../../helpers/inventoryHelpers.ts";
import { Inbox } from "../../models/inboxModel.ts";
import { unixTimesInMs } from "../../constants/timeConstants.ts";
import { DailyDeal } from "../../models/worldStateModel.ts";
import { EquipmentFeatures } from "../../types/equipmentTypes.ts";
import { generateRewardSeed } from "../../services/rngService.ts";
import { getInvasionByOid, getWorldState } from "../../services/worldStateService.ts";
import { createMessage } from "../../services/inboxService.ts";

export const inventoryController: RequestHandler = async (request, response) => {
    const account = await getAccountForRequest(request);

    const inventory = await Inventory.findOne({ accountOwnerId: account._id });

    if (!inventory) {
        response.status(400).json({ error: "inventory was undefined" });
        return;
    }

    // Handle daily reset
    if (!inventory.NextRefill || Date.now() >= inventory.NextRefill.getTime()) {
        const today = Math.trunc(Date.now() / 86400000);

        for (const key of allDailyAffiliationKeys) {
            inventory[key] = 16000 + inventory.PlayerLevel * 500;
        }
        inventory.DailyFocus = 250000 + inventory.PlayerLevel * 5000;
        inventory.GiftsRemaining = Math.max(8, inventory.PlayerLevel);
        inventory.TradesRemaining = inventory.PlayerLevel;

        inventory.LibraryAvailableDailyTaskInfo = createLibraryDailyTask();

        if (inventory.NextRefill) {
            const lastLoginDay = Math.trunc(inventory.NextRefill.getTime() / 86400000) - 1;
            const daysPassed = today - lastLoginDay;

            if (inventory.noArgonCrystalDecay) {
                inventory.FoundToday = undefined;
            } else {
                for (let i = 0; i != daysPassed; ++i) {
                    const numArgonCrystals =
                        inventory.MiscItems.find(x => x.ItemType == "/Lotus/Types/Items/MiscItems/ArgonCrystal")
                            ?.ItemCount ?? 0;
                    if (numArgonCrystals == 0) {
                        break;
                    }
                    const numStableArgonCrystals = Math.min(
                        numArgonCrystals,
                        inventory.FoundToday?.find(x => x.ItemType == "/Lotus/Types/Items/MiscItems/ArgonCrystal")
                            ?.ItemCount ?? 0
                    );
                    const numDecayingArgonCrystals = numArgonCrystals - numStableArgonCrystals;
                    const numDecayingArgonCrystalsToRemove = Math.ceil(numDecayingArgonCrystals / 2);
                    logger.debug(`ticking argon crystals for day ${i + 1} of ${daysPassed}`, {
                        numArgonCrystals,
                        numStableArgonCrystals,
                        numDecayingArgonCrystals,
                        numDecayingArgonCrystalsToRemove
                    });
                    // Remove half of owned decaying argon crystals
                    addMiscItems(inventory, [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/ArgonCrystal",
                            ItemCount: numDecayingArgonCrystalsToRemove * -1
                        }
                    ]);
                    // All stable argon crystals are now decaying
                    inventory.FoundToday = undefined;
                }
            }

            if (inventory.UsedDailyDeals.length != 0) {
                if (daysPassed == 1) {
                    const todayAt0Utc = today * 86400000;
                    const darvoIndex = Math.trunc((todayAt0Utc - 25200000) / (26 * unixTimesInMs.hour));
                    const darvoStart = darvoIndex * (26 * unixTimesInMs.hour) + 25200000;
                    const darvoOid =
                        ((darvoStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + "adc51a72f7324d95";
                    const deal = await DailyDeal.findById(darvoOid);
                    if (deal) {
                        inventory.UsedDailyDeals = inventory.UsedDailyDeals.filter(x => x == deal.StoreItem); // keep only the deal that came into this new day with us
                    } else {
                        inventory.UsedDailyDeals = [];
                    }
                } else {
                    inventory.UsedDailyDeals = [];
                }
            }
        }

        // TODO: Setup CalendarProgress as part of 1999 mission completion?

        const previousYearIteration = inventory.CalendarProgress?.Iteration;

        // We need to do the following to ensure the in-game calendar does not break:
        getCalendarProgress(inventory); // Keep the CalendarProgress up-to-date (at least for the current year iteration) (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/2364)
        checkCalendarAutoAdvance(inventory, getWorldState().KnownCalendarSeasons[0]); // Skip birthday events for characters if we do not have them unlocked yet (https://onlyg.it/OpenWF/SpaceNinjaServer/issues/2424)

        // also handle sending of kiss cinematic at year rollover
        if (
            inventory.CalendarProgress!.Iteration != previousYearIteration &&
            inventory.DialogueHistory &&
            inventory.DialogueHistory.Dialogues
        ) {
            let kalymos = false;
            for (const { dialogueName, kissEmail } of [
                {
                    dialogueName: "/Lotus/Types/Gameplay/1999Wf/Dialogue/ArthurDialogue_rom.dialogue",
                    kissEmail: "/Lotus/Types/Items/EmailItems/ArthurKissEmailItem"
                },
                {
                    dialogueName: "/Lotus/Types/Gameplay/1999Wf/Dialogue/EleanorDialogue_rom.dialogue",
                    kissEmail: "/Lotus/Types/Items/EmailItems/EleanorKissEmailItem"
                },
                {
                    dialogueName: "/Lotus/Types/Gameplay/1999Wf/Dialogue/LettieDialogue_rom.dialogue",
                    kissEmail: "/Lotus/Types/Items/EmailItems/LettieKissEmailItem"
                },
                {
                    dialogueName: "/Lotus/Types/Gameplay/1999Wf/Dialogue/JabirDialogue_rom.dialogue",
                    kissEmail: "/Lotus/Types/Items/EmailItems/AmirKissEmailItem"
                },
                {
                    dialogueName: "/Lotus/Types/Gameplay/1999Wf/Dialogue/AoiDialogue_rom.dialogue",
                    kissEmail: "/Lotus/Types/Items/EmailItems/AoiKissEmailItem"
                },
                {
                    dialogueName: "/Lotus/Types/Gameplay/1999Wf/Dialogue/QuincyDialogue_rom.dialogue",
                    kissEmail: "/Lotus/Types/Items/EmailItems/QuincyKissEmailItem"
                }
            ]) {
                const dialogue = inventory.DialogueHistory.Dialogues.find(x => x.DialogueName == dialogueName);
                if (dialogue) {
                    if (dialogue.Rank == 7) {
                        await addEmailItem(inventory, kissEmail);
                        kalymos = false;
                        break;
                    }
                    if (dialogue.Rank == 6) {
                        kalymos = true;
                    }
                }
            }
            if (kalymos) {
                await addEmailItem(inventory, "/Lotus/Types/Items/EmailItems/KalymosKissEmailItem");
            }
        }

        await cleanupInventory(inventory);

        inventory.NextRefill = new Date((today + 1) * 86400000); // tomorrow at 0 UTC
        //await inventory.save();
    }

    if (
        inventory.InfestedFoundry &&
        inventory.InfestedFoundry.AbilityOverrideUnlockCooldown &&
        new Date() >= inventory.InfestedFoundry.AbilityOverrideUnlockCooldown
    ) {
        handleSubsumeCompletion(inventory);
        //await inventory.save();
    }

    for (let i = 0; i != inventory.QualifyingInvasions.length; ) {
        const qi = inventory.QualifyingInvasions[i];
        const invasion = getInvasionByOid(qi.invasionId.toString());
        if (!invasion) {
            logger.debug(`removing QualifyingInvasions entry for unknown invasion: ${qi.invasionId.toString()}`);
            inventory.QualifyingInvasions.splice(i, 1);
            continue;
        }
        if (invasion.Completed) {
            let factionSidedWith: string | undefined;
            let battlePay: ICountedItem[] | undefined;
            if (qi.AttackerScore >= 3) {
                factionSidedWith = invasion.Faction;
                battlePay = invasion.AttackerReward.countedItems;
                logger.debug(`invasion pay from ${factionSidedWith}`, { battlePay });
            } else if (qi.DefenderScore >= 3) {
                factionSidedWith = invasion.DefenderFaction;
                battlePay = invasion.DefenderReward.countedItems;
                logger.debug(`invasion pay from ${factionSidedWith}`, { battlePay });
            }
            if (factionSidedWith) {
                if (battlePay) {
                    // Decoupling rewards from the inbox message because it may delete itself without being read
                    for (const item of battlePay) {
                        await addItem(inventory, item.ItemType, item.ItemCount);
                    }
                    await createMessage(account._id, [
                        {
                            sndr:
                                factionSidedWith == "FC_GRINEER"
                                    ? "/Lotus/Language/Menu/GrineerInvasionLeader"
                                    : "/Lotus/Language/Menu/CorpusInvasionLeader",
                            msg: `/Lotus/Language/G1Quests/${factionSidedWith}_InvasionThankyouMessageBody`,
                            sub: `/Lotus/Language/G1Quests/${factionSidedWith}_InvasionThankyouMessageSubject`,
                            countedAtt: battlePay,
                            attVisualOnly: true,
                            icon:
                                factionSidedWith == "FC_GRINEER"
                                    ? "/Lotus/Interface/Icons/Npcs/EliteRifleLancerAvatar.png" // Source: https://www.reddit.com/r/Warframe/comments/1aj4usx/battle_pay_worth_10_plat/, https://www.youtube.com/watch?v=XhNZ6ai6BOY
                                    : "/Lotus/Interface/Icons/Npcs/CrewmanNormal.png", // My best source for this is https://www.youtube.com/watch?v=rxrCCFm73XE around 1:37
                            // TOVERIFY: highPriority?
                            endDate: new Date(Date.now() + 86400_000) // TOVERIFY: This type of inbox message seems to automatically delete itself. We'll just delete it after 24 hours, but it's not clear if this is correct.
                        }
                    ]);
                }
                if (invasion.Faction != "FC_INFESTATION") {
                    // Sided with grineer -> opposed corpus -> send zanuka (harvester)
                    // Sided with corpus -> opposed grineer -> send g3 (death squad)
                    inventory[factionSidedWith != "FC_GRINEER" ? "DeathSquadable" : "Harvestable"] = true;
                    // TOVERIFY: Should this happen earlier?
                    // TOVERIFY: Should this send an (ephemeral) email?
                }
            }
            logger.debug(`removing QualifyingInvasions entry for completed invasion: ${qi.invasionId.toString()}`);
            inventory.QualifyingInvasions.splice(i, 1);
            continue;
        }
        ++i;
    }

    if (inventory.LastInventorySync) {
        const lastSyncDuviriMood = Math.trunc(inventory.LastInventorySync.getTimestamp().getTime() / 7200000);
        const currentDuviriMood = Math.trunc(Date.now() / 7200000);
        if (lastSyncDuviriMood != currentDuviriMood) {
            logger.debug(`refreshing duviri seed`);
            if (!inventory.DuviriInfo) {
                inventory.DuviriInfo = {
                    Seed: generateRewardSeed(),
                    NumCompletions: 0
                };
            } else {
                inventory.DuviriInfo.Seed = generateRewardSeed();
            }
        }
    }
    inventory.LastInventorySync = new Types.ObjectId();

    if (inventory.QuestKeys.some(x => x.ItemType.endsWith("KubrowQuestKeyChain") && x.Completed)) {
        inventory.KubrowPets.forEach(item => item.Details && (item.Details.HasCollar = true));
    }
    await inventory.save();

    response.json(
        await getInventoryResponse(
            inventory,
            "xpBasedLevelCapDisabled" in request.query,
            "ignoreBuildLabel" in request.query ? undefined : account.BuildLabel
        )
    );
};

export const getInventoryResponse = async (
    inventory: TInventoryDatabaseDocument,
    xpBasedLevelCapDisabled: boolean,
    buildLabel: string | undefined
): Promise<IInventoryClient> => {
    const [inventoryWithLoadOutPresets, ships, latestMessage] = await Promise.all([
        inventory.populate<{ LoadOutPresets: ILoadoutDatabase }>("LoadOutPresets"),
        Ship.find({ ShipOwnerId: inventory.accountOwnerId }),
        Inbox.findOne({ ownerId: inventory.accountOwnerId }, "_id").sort({ date: -1 })
    ]);
    const inventoryResponse = inventoryWithLoadOutPresets.toJSON<IInventoryClient>();
    inventoryResponse.Ships = ships.map(x => x.toJSON<IShipInventory>());

    // In case mission inventory update added an inbox message, we need to send the Mailbox part so the client knows to refresh it.
    if (latestMessage) {
        inventoryResponse.Mailbox = {
            LastInboxId: toOid(latestMessage._id)
        };
    }

    if (inventory.infiniteCredits) {
        inventoryResponse.RegularCredits = 999999999;
    }
    if (inventory.infinitePlatinum) {
        inventoryResponse.PremiumCreditsFree = 0;
        inventoryResponse.PremiumCredits = 999999999;
    }
    if (inventory.infiniteEndo) {
        inventoryResponse.FusionPoints = 999999999;
    }
    if (inventory.infiniteRegalAya) {
        inventoryResponse.PrimeTokens = 999999999;
    }

    if (inventory.skipAllDialogue) {
        inventoryResponse.TauntHistory ??= [];
        if (!inventoryResponse.TauntHistory.find(x => x.node == "TreasureTutorial")) {
            inventoryResponse.TauntHistory.push({
                node: "TreasureTutorial",
                state: "TS_COMPLETED"
            });
        }
        for (const str of allDialogue) {
            addString(inventoryResponse.NodeIntrosCompleted, str);
        }
    }

    if (inventory.skipAllPopups) {
        for (const str of allPopups) {
            addString(inventoryResponse.NodeIntrosCompleted, str);
        }
    }

    if (config.worldState?.baroTennoConRelay) {
        [
            "/Lotus/Types/Items/Events/TennoConRelay2022EarlyAccess",
            "/Lotus/Types/Items/Events/TennoConRelay2023EarlyAccess",
            "/Lotus/Types/Items/Events/TennoConRelay2024EarlyAccess",
            "/Lotus/Types/Items/Events/TennoConRelay2025EarlyAccess"
        ].forEach(uniqueName => {
            if (!inventoryResponse.FlavourItems.some(x => x.ItemType == uniqueName)) {
                inventoryResponse.FlavourItems.push({ ItemType: uniqueName });
            }
        });
    }

    if (config.unlockAllSkins) {
        const ownedWeaponSkins = new Set<string>(inventoryResponse.WeaponSkins.map(x => x.ItemType));
        for (const [uniqueName, meta] of Object.entries(ExportCustoms)) {
            if (!meta.alwaysAvailable && !ownedWeaponSkins.has(uniqueName)) {
                inventoryResponse.WeaponSkins.push({
                    ItemId: {
                        $oid: "ca70ca70ca70ca70" + catBreadHash(uniqueName).toString(16).padStart(8, "0")
                    },
                    ItemType: uniqueName
                });
            }
        }
    }

    if (inventory.spoofMasteryRank && inventory.spoofMasteryRank >= 0) {
        inventoryResponse.PlayerLevel = inventory.spoofMasteryRank;
        if (!xpBasedLevelCapDisabled) {
            // This client has not been patched to accept any mastery rank, need to fake the XP.
            inventoryResponse.XPInfo = [];
            let numFrames = getExpRequiredForMr(Math.min(inventory.spoofMasteryRank, 5030)) / (30 * 200);
            while (numFrames-- > 0) {
                inventoryResponse.XPInfo.push({
                    ItemType: "/Lotus/Powersuits/Mag/Mag",
                    XP: 900_000 // Enough for rank 30 as per https://wiki.warframe.com/w/Affinity
                });
            }
        }
    }

    if (inventory.universalPolarityEverywhere) {
        const Polarity: IPolarity[] = [];
        // 12 is needed for necramechs. 15 is needed for plexus/crewshipharness.
        for (let i = 0; i != 15; ++i) {
            Polarity.push({
                Slot: i,
                Value: ArtifactPolarity.Any
            });
        }
        for (const key of equipmentKeys) {
            if (key in inventoryResponse) {
                for (const equipment of inventoryResponse[key]) {
                    equipment.Polarity = Polarity;
                }
            }
        }
    }

    if (inventory.unlockDoubleCapacityPotatoesEverywhere) {
        for (const key of equipmentKeys) {
            if (key in inventoryResponse) {
                for (const equipment of inventoryResponse[key]) {
                    equipment.Features ??= 0;
                    equipment.Features |= EquipmentFeatures.DOUBLE_CAPACITY;
                }
            }
        }
    }

    if (inventory.unlockExilusEverywhere) {
        for (const key of equipmentKeys) {
            if (key in inventoryResponse) {
                for (const equipment of inventoryResponse[key]) {
                    equipment.Features ??= 0;
                    equipment.Features |= EquipmentFeatures.UTILITY_SLOT;
                }
            }
        }
    }

    if (inventory.unlockArcanesEverywhere) {
        for (const key of equipmentKeys) {
            if (key in inventoryResponse) {
                for (const equipment of inventoryResponse[key]) {
                    equipment.Features ??= 0;
                    equipment.Features |= EquipmentFeatures.ARCANE_SLOT;
                    equipment.Features |= EquipmentFeatures.SECOND_ARCANE_SLOT;
                }
            }
        }
    }

    if (inventory.noDailyStandingLimits) {
        const spoofedDailyAffiliation = Math.max(999_999, 16000 + inventoryResponse.PlayerLevel * 500);
        for (const key of allDailyAffiliationKeys) {
            inventoryResponse[key] = spoofedDailyAffiliation;
        }
    }

    if (inventory.noDailyFocusLimit) {
        inventoryResponse.DailyFocus = Math.max(999_999, 250000 + inventoryResponse.PlayerLevel * 5000);
    }

    if (inventoryResponse.InfestedFoundry) {
        applyCheatsToInfestedFoundry(inventory, inventoryResponse.InfestedFoundry);
    }

    // Set 2FA enabled so trading post can be used
    inventoryResponse.HWIDProtectEnabled = true;

    if (buildLabel) {
        // Fix nemesis for older versions
        if (
            inventoryResponse.Nemesis &&
            version_compare(buildLabel, getNemesisManifest(inventoryResponse.Nemesis.manifest).minBuild) < 0
        ) {
            inventoryResponse.Nemesis = undefined;
        }

        if (version_compare(buildLabel, "2019.03.07.20.21") < 0) {
            // Builds before U24.4.0 handle equipment features differently
            for (const category of equipmentKeys) {
                for (const item of inventoryResponse[category]) {
                    if (item.Features && item.Features & EquipmentFeatures.DOUBLE_CAPACITY) {
                        item.UnlockLevel = 1;
                    }
                    if (item.Features && item.Features & EquipmentFeatures.UTILITY_SLOT) {
                        item.UtilityUnlocked = 1;
                    }
                    if (item.Features && item.Features & EquipmentFeatures.GILDED) {
                        item.Gild = true;
                    }
                }
            }

            if (version_compare(buildLabel, "2018.02.22.14.34") < 0) {
                const personalRoomsDb = await getPersonalRooms(inventory.accountOwnerId.toString());
                const personalRooms = personalRoomsDb.toJSON<IPersonalRoomsClient>();
                inventoryResponse.Ship = personalRooms.Ship;

                if (version_compare(buildLabel, "2016.12.21.19.13") <= 0) {
                    // U19.5 and below use $id instead of $oid
                    for (const category of equipmentKeys) {
                        for (const item of inventoryResponse[category]) {
                            toLegacyOid(item.ItemId);
                            if (version_compare(buildLabel, "2015.05.14.16.29") < 0) {
                                // Appearance config format is different for versions before U16.5
                                for (const config of item.Configs) {
                                    if (version_compare(buildLabel, "2015.03.21.08.17") < 0) {
                                        config.Customization = {
                                            Colors: convertIColorToLegacyColorsWithAtt(config.pricol, config.attcol),
                                            Skins: config.Skins ?? []
                                        };
                                    } else if (version_compare(buildLabel, "2015.03.21.08.17") >= 0) {
                                        config.Colors = convertIColorToLegacyColorsWithAtt(
                                            config.pricol,
                                            config.attcol
                                        );
                                    }
                                }
                            }
                        }
                    }

                    if (version_compare(buildLabel, "2014.02.05.00.00") < 0) {
                        // Pre-U12 builds store mods in an array called Cards, and have no concept of RawUpgrades
                        inventoryResponse.Cards = [];
                        for (const rawUpgrade of inventoryResponse.RawUpgrades) {
                            const id = inventory.RawUpgrades.find(x => x.ItemType == rawUpgrade.ItemType)?._id;
                            if (id) {
                                for (let i = 0; i < rawUpgrade.ItemCount; i++) {
                                    const card = {
                                        ItemType: rawUpgrade.ItemType,
                                        ItemId: toOid2(id, buildLabel),
                                        Rank: 0,
                                        AmountRemaining: rawUpgrade.ItemCount
                                    } as IUpgradeClient;
                                    // Client doesn't see the mods unless they are in both Cards and Upgrades
                                    inventoryResponse.Cards.push(card);
                                    inventoryResponse.Upgrades.push(card);
                                }
                            }
                        }

                        inventoryResponse.RawUpgrades = [];

                        for (const category of equipmentKeys) {
                            for (const item of inventoryResponse[category]) {
                                for (const config of item.Configs) {
                                    if (config.Upgrades) {
                                        // Convert installed upgrades for U10-U11
                                        const convertedUpgrades: { $id: string }[] = [];
                                        config.Upgrades.forEach(upgrade => {
                                            const upgradeId = upgrade as string;
                                            convertedUpgrades.push({ $id: upgradeId });
                                        });
                                        config.Upgrades = convertedUpgrades;
                                    }
                                }
                            }
                        }
                    }

                    for (const upgrade of inventoryResponse.Upgrades) {
                        toLegacyOid(upgrade.ItemId);
                        if (version_compare(buildLabel, "2016.08.19.17.12") < 0) {
                            // Pre-U18.18 builds use a different UpgradeFingerprint format
                            let rank: number = 0;
                            if (upgrade.UpgradeFingerprint) {
                                rank = Number.parseFloat(
                                    upgrade.UpgradeFingerprint.substring(
                                        upgrade.UpgradeFingerprint.indexOf(":") + 1,
                                        upgrade.UpgradeFingerprint.lastIndexOf("}")
                                    )
                                );
                            }
                            upgrade.UpgradeFingerprint = `lvl=${rank}|`;
                            if (version_compare(buildLabel, "2014.04.10.17.47") < 0) {
                                // Pre-U10 builds
                                if (
                                    !upgrade.AmountRemaining ||
                                    (upgrade.AmountRemaining && upgrade.AmountRemaining <= 0)
                                ) {
                                    upgrade.AmountRemaining = 1;
                                }
                                upgrade.Rank = rank;
                                if (inventoryResponse.Cards) {
                                    inventoryResponse.Cards.push(upgrade);
                                }
                            }
                        }
                    }

                    if (version_compare(buildLabel, "2014.02.05.00.00") < 0) {
                        // Convert installed mods for pre-U12 builds
                        for (const category of equipmentKeys) {
                            for (const item of inventoryResponse[category]) {
                                for (const config of item.Configs) {
                                    if (config.Upgrades) {
                                        for (let i = 0; i < config.Upgrades.length; i++) {
                                            const id = config.Upgrades[i] as { $id: string | undefined };
                                            const invUpgrade = inventoryResponse.Upgrades.find(
                                                x => x.ItemId.$id == id.$id
                                            );
                                            if (invUpgrade) {
                                                if (id.$id?.startsWith("/Lotus")) {
                                                    // Pre-U12 builds have no concept of RawUpgrades, have to convert the db entry to the closest id of an unranked copy
                                                    id.$id = inventoryResponse.Upgrades.find(
                                                        x => x.ItemType == id.$id
                                                    )?.ItemId.$id;
                                                }
                                                // Pre-U10
                                                invUpgrade.ParentId = item.ItemId;
                                                invUpgrade.Slot = i + 1;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (inventoryResponse.BrandedSuits) {
                        for (const id of inventoryResponse.BrandedSuits) {
                            toLegacyOid(id);
                        }
                    }
                    if (inventoryResponse.GuildId) {
                        toLegacyOid(inventoryResponse.GuildId);
                    }
                    for (const item of inventoryResponse.CurrentLoadOutIds) {
                        toLegacyOid(item);
                    }
                    if (
                        version_compare(buildLabel, "2015.03.19.00.00") <= 0 &&
                        inventoryResponse.CurrentLoadOutIds.length > 0 &&
                        inventoryResponse.LoadOutPresets.NORMAL.length > 0
                    ) {
                        if (version_compare(buildLabel, "2014.07.21.18.38") >= 0) {
                            // U14-U15 expect a different response than any other version, where the client is pulling loadout data from has not been found yet
                            // As such, loading loadouts is currently unsupported for these versions
                            logger.warn("Loadouts are currently unsupported in U14-U15, loadouts will be undefined");
                        } else {
                            // U13 and below
                            inventoryResponse.CurrentLoadout = mapLegacyLoadoutConfig(
                                inventory,
                                inventoryResponse.LoadOutPresets,
                                buildLabel
                            );
                        }
                    }
                    for (const category of loadoutKeysLegacy) {
                        for (const item of inventoryResponse.LoadOutPresets[category]) {
                            toLegacyOid(item.ItemId);
                            if (item.s) {
                                if (item.s.ItemId) {
                                    toLegacyOid(item.s.ItemId);
                                }
                            }
                            if (item.l) {
                                if (item.l.ItemId) {
                                    toLegacyOid(item.l.ItemId);
                                }
                            }
                            if (item.p) {
                                if (item.p.ItemId) {
                                    toLegacyOid(item.p.ItemId);
                                }
                            }
                            if (item.m) {
                                if (item.m.ItemId) {
                                    toLegacyOid(item.m.ItemId);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return inventoryResponse;
};

const mapLegacyLoadoutConfig = (
    inventory: TInventoryDatabaseDocument,
    loadoutPresets: ILoadOutPresets,
    buildLabel: string
): ILoadoutConfigClientLegacy | undefined => {
    // Loadout config mapping for U15 and below
    const normPreset = loadoutPresets.NORMAL.find(x => x.ItemId.$oid == inventory.CurrentLoadOutIds[0].toString());
    if (normPreset) {
        const s = normPreset.s?.ItemId?.$oid ? inventory.Suits.id(normPreset.s.ItemId.$oid) : null;
        const p = normPreset.p?.ItemId?.$oid ? inventory.Pistols.id(normPreset.p.ItemId.$oid) : null;
        const l = normPreset.l?.ItemId?.$oid ? inventory.LongGuns.id(normPreset.l.ItemId.$oid) : null;
        const m = normPreset.m?.ItemId?.$oid ? inventory.Melee.id(normPreset.m.ItemId.$oid) : null;
        const loadoutConfig = {
            ItemId: { $id: version_compare(buildLabel, "2014.07.21.18.38") < 0 ? "Current" : normPreset.ItemId.$oid },
            Name: normPreset.n ?? "Default Loadout",
            Presets: [
                {
                    ItemId: { $id: s?._id.toString() ?? "ffffffffffffffffffffffff" },
                    ModSlot: version_compare(buildLabel, "2013.09.13.00.00") < 0 ? 0 : (normPreset.s?.mod ?? 0),
                    CustSlot: normPreset.s?.cus ?? 0,
                    Customization: {
                        Emblem: "",
                        Colors: convertIColorToLegacyColors(s?.Configs[normPreset.s?.cus ?? 0].pricol),
                        Skins: s?.Configs[normPreset.s?.cus ?? 0].Skins ?? []
                    }
                },
                {
                    ItemId: { $id: p?._id.toString() ?? "ffffffffffffffffffffffff" },
                    ModSlot: version_compare(buildLabel, "2013.09.13.00.00") < 0 ? 0 : (normPreset.p?.mod ?? 0),
                    CustSlot: normPreset.p?.cus ?? 0,
                    Customization: {
                        Emblem: "",
                        Colors: convertIColorToLegacyColors(p?.Configs[normPreset.p?.cus ?? 0].pricol),
                        Skins: p?.Configs[normPreset.p?.cus ?? 0].Skins ?? []
                    }
                },
                {
                    ItemId: { $id: l?._id.toString() ?? "ffffffffffffffffffffffff" },
                    ModSlot: version_compare(buildLabel, "2013.09.13.00.00") < 0 ? 0 : (normPreset.l?.mod ?? 0),
                    CustSlot: normPreset.l?.cus ?? 0,
                    Customization: {
                        Emblem: "",
                        Colors: convertIColorToLegacyColors(l?.Configs[normPreset.l?.cus ?? 0].pricol),
                        Skins: l?.Configs[normPreset.l?.cus ?? 0].Skins ?? []
                    }
                },
                {
                    ItemId: { $id: m?._id.toString() ?? "ffffffffffffffffffffffff" },
                    ModSlot: version_compare(buildLabel, "2013.09.13.00.00") < 0 ? 0 : (normPreset.m?.mod ?? 0),
                    CustSlot: normPreset.m?.cus ?? 0,
                    Customization: {
                        Emblem: "",
                        Colors: convertIColorToLegacyColors(m?.Configs[normPreset.m?.cus ?? 0].pricol),
                        Skins: m?.Configs[normPreset.m?.cus ?? 0].Skins ?? []
                    }
                }
            ]
        };

        if (version_compare(buildLabel, "2013.03.18.00.00") >= 0) {
            if (inventory.CurrentLoadOutIds.length > 1 && loadoutPresets.SENTINEL.length > 0) {
                const compPreset = loadoutPresets.SENTINEL.find(
                    x => x.ItemId.$oid == inventory.CurrentLoadOutIds[1].toString()
                );
                if (compPreset) {
                    const s = compPreset.s?.ItemId?.$oid ? inventory.Sentinels.id(compPreset.s.ItemId.$oid) : null;
                    const l = compPreset.l?.ItemId?.$oid
                        ? inventory.SentinelWeapons.id(compPreset.l.ItemId.$oid)
                        : null;
                    loadoutConfig.Presets.push(
                        {
                            ItemId: { $id: s?._id.toString() ?? "ffffffffffffffffffffffff" },
                            ModSlot: version_compare(buildLabel, "2013.09.13.00.00") < 0 ? 0 : (compPreset.s?.mod ?? 0),
                            CustSlot: compPreset.s?.cus ?? 0,
                            Customization: {
                                Emblem: "",
                                Colors: convertIColorToLegacyColors(s?.Configs[compPreset.s?.cus ?? 0].pricol),
                                Skins: s?.Configs[compPreset.s?.cus ?? 0].Skins ?? []
                            }
                        },
                        {
                            ItemId: { $id: l?._id.toString() ?? "ffffffffffffffffffffffff" },
                            ModSlot: version_compare(buildLabel, "2013.09.13.00.00") < 0 ? 0 : (compPreset.l?.mod ?? 0),
                            CustSlot: compPreset.l?.cus ?? 0,
                            Customization: {
                                Emblem: "",
                                Colors: convertIColorToLegacyColors(l?.Configs[compPreset.l?.cus ?? 0].pricol),
                                Skins: l?.Configs[compPreset.l?.cus ?? 0].Skins ?? []
                            }
                        }
                    );
                }
            } else {
                logger.warn(
                    `Could not find SENTINEL loadout with id ${inventory.CurrentLoadOutIds[1].toString()}, this part of the loadout will be empty`
                );

                loadoutConfig.Presets.push(
                    {
                        ItemId: { $id: "ffffffffffffffffffffffff" },
                        ModSlot: 0,
                        CustSlot: 0,
                        Customization: {
                            Emblem: "",
                            Colors: [],
                            Skins: []
                        }
                    },
                    {
                        ItemId: { $id: "ffffffffffffffffffffffff" },
                        ModSlot: 0,
                        CustSlot: 0,
                        Customization: {
                            Emblem: "",
                            Colors: [],
                            Skins: []
                        }
                    }
                );
            }
        }

        if (version_compare(buildLabel, "2014.10.24.08.24") >= 0) {
            if (inventory.CurrentLoadOutIds.length > 2 && loadoutPresets.ARCHWING.length > 0) {
                const archPreset = loadoutPresets.ARCHWING.find(
                    x => x.ItemId.$oid == inventory.CurrentLoadOutIds[2].toString()
                );
                if (archPreset) {
                    const s = archPreset.s?.ItemId?.$oid ? inventory.SpaceSuits.id(archPreset.s.ItemId.$oid) : null;
                    const l = archPreset.l?.ItemId?.$oid ? inventory.SpaceGuns.id(archPreset.l.ItemId.$oid) : null;
                    const m = archPreset.m?.ItemId?.$oid ? inventory.SpaceMelee.id(archPreset.m.ItemId.$oid) : null;
                    loadoutConfig.Presets.push(
                        {
                            ItemId: { $id: s?._id.toString() ?? "ffffffffffffffffffffffff" },
                            ModSlot: archPreset.s?.mod ?? 0,
                            CustSlot: archPreset.s?.cus ?? 0,
                            Customization: {
                                Emblem: "",
                                Colors: convertIColorToLegacyColors(s?.Configs[archPreset.s?.cus ?? 0].pricol),
                                Skins: s?.Configs[0].Skins ?? []
                            }
                        },
                        {
                            ItemId: { $id: l?._id.toString() ?? "ffffffffffffffffffffffff" },
                            ModSlot: archPreset.l?.mod ?? 0,
                            CustSlot: archPreset.l?.cus ?? 0,
                            Customization: {
                                Emblem: "",
                                Colors: convertIColorToLegacyColors(l?.Configs[archPreset.l?.cus ?? 0].pricol),
                                Skins: l?.Configs[0].Skins ?? []
                            }
                        },
                        {
                            ItemId: { $id: m?._id.toString() ?? "ffffffffffffffffffffffff" },
                            ModSlot: archPreset.m?.mod ?? 0,
                            CustSlot: archPreset.m?.cus ?? 0,
                            Customization: {
                                Emblem: "",
                                Colors: convertIColorToLegacyColors(m?.Configs[archPreset.m?.cus ?? 0].pricol),
                                Skins: m?.Configs[0].Skins ?? []
                            }
                        }
                    );
                }
            } else {
                logger.warn(
                    `Could not find ARCHWING loadout with id ${inventory.CurrentLoadOutIds[2].toString()}, this part of the loadout will be empty`
                );

                loadoutConfig.Presets.push(
                    {
                        ItemId: { $id: "ffffffffffffffffffffffff" },
                        ModSlot: 0,
                        CustSlot: 0,
                        Customization: {
                            Emblem: "",
                            Colors: [],
                            Skins: []
                        }
                    },
                    {
                        ItemId: { $id: "ffffffffffffffffffffffff" },
                        ModSlot: 0,
                        CustSlot: 0,
                        Customization: {
                            Emblem: "",
                            Colors: [],
                            Skins: []
                        }
                    },
                    {
                        ItemId: { $id: "ffffffffffffffffffffffff" },
                        ModSlot: 0,
                        CustSlot: 0,
                        Customization: {
                            Emblem: "",
                            Colors: [],
                            Skins: []
                        }
                    }
                );
            }
        }

        return loadoutConfig;
    }

    logger.error(
        `Could not find NORMAL loadout with id ${inventory.CurrentLoadOutIds[0].toString()}, entire loadout will be undefined`
    );

    return undefined;
};

const getExpRequiredForMr = (rank: number): number => {
    if (rank <= 30) {
        return 2500 * rank * rank;
    }
    return 2_250_000 + 147_500 * (rank - 30);
};
