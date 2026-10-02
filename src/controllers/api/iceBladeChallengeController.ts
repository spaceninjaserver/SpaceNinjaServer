import type { RequestHandler } from "express";
import gameToBuildVersionInt from "../../constants/gameToBuildVersionInt.ts";
import { fromOid, getMasteryRank, toOid } from "../../helpers/inventoryHelpers.ts";
import { Inbox } from "../../models/inboxModel.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { Loadout } from "../../models/inventoryModels/loadoutModel.ts";
import { Account } from "../../models/loginModel.ts";
import { IceBladeChampion } from "../../models/worldStateModel.ts";
import { addCustomization, addSkin, getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IOid } from "../../types/commonTypes.ts";
import { eLoadoutIndex } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { ILoadoutConfigClient } from "../../types/saveLoadoutTypes.ts";
import type { IIceBladeLoadout } from "../../types/worldStateTypes.ts";

export const iceBladeChallengeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(
        accountId,
        "PlayerLevel spoofMasteryRank Suits EquippedGear TitleType LoadOutPresets CurrentLoadOutIds WeaponSkins BountyScore FlavourItems BlessingCooldown"
    );

    const loadout = (await Loadout.findById(inventory.LoadOutPresets, "NORMAL"))!;
    const preset = inventory.CurrentLoadOutIds.length
        ? loadout.NORMAL.id(inventory.CurrentLoadOutIds[eLoadoutIndex.NORMAL])?.toJSON<ILoadoutConfigClient>()
        : undefined;
    const suit = preset?.s?.ItemId ? inventory.Suits.id(fromOid(preset.s.ItemId)) : null;
    const shards = (suit?.ArchonCrystalUpgrades ?? []).filter(x => x.UpgradeType && x.Color);

    const champion = await IceBladeChampion.findOne({});

    const completed =
        inventory.WeaponSkins.some(x => x.ItemType == "/Lotus/Upgrades/Skins/Weapons/Rapier/IcebladeRapierSkin") &&
        inventory.FlavourItems.some(x => x.ItemType == "/Lotus/Types/Items/Titles/IcebladeTitle");

    // https://wiki.warframe.com/w/Yuvan_Peak#The_Iceblade
    if (
        !(completed && champion) &&
        (getMasteryRank(inventory) < 31 || // Legendary Rank 1 or higher
            !suit ||
            suit.ItemType != "/Lotus/Powersuits/Duelist/Duelist" ||
            shards.length < 5 || // Five Archon Shards must be equipped on Narin
            shards.filter(x => x.Color!.startsWith("ACC_BLUE")).length < 4 || // Four Azure Shards as a minimum (They do not need to be Tauforged)
            ![
                "/Lotus/Types/Restoratives/Upgraded/DamageDebuffKey",
                "/Lotus/Types/Restoratives/Upgraded/HealthDebuffKey",
                "/Lotus/Types/Restoratives/Upgraded/ShieldDebuffKey",
                "/Lotus/Types/Restoratives/Upgraded/SpeedDebuffKey"
            ].every(x => inventory.EquippedGear.includes(x)) || // All four Dragon Keys must be equipped on the Gear wheel
            inventory.TitleType != "/Lotus/Types/Items/Titles/NarinTitle") // "On Wings of Ice" Honoria must be equipped
    ) {
        res.json({});
        return;
    }

    const response: IIceBladeChallengeResponse = {};

    if (!completed) {
        addSkin(inventory, "/Lotus/Upgrades/Skins/Weapons/Rapier/IcebladeRapierSkin");
        addCustomization(inventory, "/Lotus/Types/Items/Titles/IcebladeTitle");
        response.Rewards = [
            "/Lotus/StoreItems/Upgrades/Skins/Weapons/Rapier/IcebladeRapierSkin",
            "/Lotus/StoreItems/Types/Items/Titles/IcebladeTitle"
        ];
    }

    if (!inventory.BlessingCooldown || inventory.BlessingCooldown.getTime() <= Date.now()) {
        response.GrantBlessing = true;
    }

    if (response.Rewards || response.GrantBlessing) {
        response.Validated = true;
        if (champion) {
            response.PlayerId = toOid(champion.PlayerId);
            response.Loadout = champion.Loadout;
            response.Completed = true;
        } else {
            const date = new Date();
            response.Loadout = {
                ItemType: suit!.ItemType,
                Skins: suit!.Configs[preset!.s!.cus ?? 0]?.Skins ?? []
            };
            response.PlayerId = { $oid: accountId };
            await IceBladeChampion.create({ PlayerId: accountId, Loadout: response.Loadout, Date: date });

            const account = (await Account.findById(accountId, "DisplayName"))!;
            const inventories = await Inventory.find(
                {
                    QuestKeys: {
                        $elemMatch: { ItemType: "/Lotus/Types/Keys/ZarimanQuest/ZarimanQuestKeyChain", Completed: true }
                    }
                },
                "accountOwnerId"
            );
            await Inbox.insertMany(
                inventories.map(({ accountOwnerId }) => ({
                    ownerId: accountOwnerId,
                    sndr: "/Lotus/Language/Iceblade/MelicaName",
                    sub: "/Lotus/Language/Iceblade/IcebladeChallengeInboxSubject",
                    msg: "/Lotus/Language/Iceblade/IcebladeChallengeInboxBody",
                    icon: "/Lotus/Interface/Icons/Npcs/Melica.png",
                    startDate: date,
                    CrossPlatform: true,
                    arg: [
                        {
                            Key: "PLAYER_NAME",
                            Tag: account.DisplayName
                        }
                    ],
                    date: date,
                    minBuildVersion: gameToBuildVersionInt["44.0.0"]
                }))
            );
        }
    }

    await inventory.save();
    res.json(response);
};

interface IIceBladeChallengeResponse {
    Validated?: boolean;
    PlayerId?: IOid; // champion
    Rewards?: string[];
    Loadout?: IIceBladeLoadout;
    GrantBlessing?: boolean;
    Completed?: boolean;
}
