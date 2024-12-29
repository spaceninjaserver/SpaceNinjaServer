import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory, addMiscItems } from "@/src/services/inventoryService";
import { IOid } from "@/src/types/commonTypes";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { ExportMisc } from "warframe-public-export-plus";

export const infestedFoundryController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    switch (req.query.mode) {
        case "s": {
            // shard installation
            const request = getJSONfromString(String(req.body)) as IShardInstallRequest;
            const inventory = await getInventory(accountId);
            const suit = inventory.Suits.find(suit => suit._id.toString() == request.SuitId.$oid)!;
            if (!suit.ArchonCrystalUpgrades || suit.ArchonCrystalUpgrades.length != 5) {
                suit.ArchonCrystalUpgrades = [{}, {}, {}, {}, {}];
            }
            suit.ArchonCrystalUpgrades[request.Slot] = {
                UpgradeType: request.UpgradeType,
                Color: request.Color
            };
            const miscItemChanges = [
                {
                    ItemType: colorToShard[request.Color],
                    ItemCount: -1
                }
            ];
            addMiscItems(inventory, miscItemChanges);
            await inventory.save();
            res.json({
                InventoryChanges: {
                    MiscItems: miscItemChanges
                }
            });
            break;
        }

        case "n": {
            // name the beast
            const request = getJSONfromString(String(req.body)) as IHelminthNameRequest;
            const inventory = await getInventory(accountId);
            inventory.InfestedFoundry ??= {};
            inventory.InfestedFoundry.Name = request.newName;
            await inventory.save();
            res.json({
                InventoryChanges: {
                    InfestedFoundry: {
                        Name: inventory.InfestedFoundry.Name
                    }
                }
            });
            break;
        }

        case "c": {
            // consume items
            const request = getJSONfromString(String(req.body)) as IHelminthFeedRequest;
            const inventory = await getInventory(accountId);
            inventory.InfestedFoundry ??= {};
            inventory.InfestedFoundry.Resources ??= [];
            inventory.InfestedFoundry.XP ??= 0;

            const miscItemChanges: IMiscItem[] = [];
            let totalPercentagePointsGained = 0;

            for (const contribution of request.ResourceContributions) {
                const snack = ExportMisc.helminthSnacks[contribution.ItemType];

                // Note: Currently ignoring loss of apetite
                totalPercentagePointsGained += snack.gain / 0.01;
                const resource = inventory.InfestedFoundry.Resources.find(x => x.ItemType == snack.type);
                if (resource) {
                    resource.Count += Math.trunc(snack.gain * 1000);
                } else {
                    inventory.InfestedFoundry.Resources.push({
                        ItemType: snack.type,
                        Count: Math.trunc(snack.gain * 1000)
                    });
                }

                // tally items for removal
                const change = miscItemChanges.find(x => x.ItemType == contribution.ItemType);
                if (change) {
                    change.ItemCount -= snack.count;
                } else {
                    miscItemChanges.push({ ItemType: contribution.ItemType, ItemCount: snack.count * -1 });
                }
            }

            inventory.InfestedFoundry.XP += 666 * totalPercentagePointsGained;
            addMiscItems(inventory, miscItemChanges);
            await inventory.save();

            res.json({
                InventoryChanges: {
                    InfestedFoundry: {
                        XP: inventory.InfestedFoundry.XP,
                        Resources: inventory.InfestedFoundry.Resources
                    }
                },
                MiscItems: miscItemChanges
            });
            break;
        }

        case "o": // offerings update
            // {"OfferingsIndex":540,"SuitTypes":["/Lotus/Powersuits/PaxDuviricus/PaxDuviricusBaseSuit","/Lotus/Powersuits/Nezha/NezhaBaseSuit","/Lotus/Powersuits/Devourer/DevourerBaseSuit"],"Extra":false}
            res.status(404).end();
            break;

        default:
            throw new Error(`unhandled infestedFoundry mode: ${String(req.query.mode)}`);
    }
};

interface IShardInstallRequest {
    SuitId: IOid;
    Slot: number;
    UpgradeType: string;
    Color: string;
}

interface IHelminthNameRequest {
    newName: string;
}

interface IHelminthFeedRequest {
    ResourceContributions: {
        ItemType: string;
        Date: number; // unix timestamp
    }[];
}

const colorToShard: Record<string, string> = {
    ACC_RED: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalAmar",
    ACC_RED_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalAmarMythic",
    ACC_YELLOW: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalNira",
    ACC_YELLOW_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalNiraMythic",
    ACC_BLUE: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalBoreal",
    ACC_BLUE_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalBorealMythic",
    ACC_GREEN: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalGreen",
    ACC_GREEN_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalGreenMythic",
    ACC_ORANGE: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalOrange",
    ACC_ORANGE_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalOrangeMythic",
    ACC_PURPLE: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalViolet",
    ACC_PURPLE_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalVioletMythic"
};
