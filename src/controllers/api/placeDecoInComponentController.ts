import {
    getDojoClient,
    getGuildForRequestEx,
    getVaultMiscItemCount,
    hasAccessToDojo,
    hasGuildPermission,
    processDojoBuildMaterialsGathered,
    scaleRequiredCount
} from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { RequestHandler } from "express";
import { Types } from "mongoose";
import { ExportDojoRecipes, ExportResources } from "warframe-public-export-plus";

export const placeDecoInComponentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Decorator))) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
    const request = JSON.parse(String(req.body)) as IPlaceDecoInComponentRequest;
    const component = guild.DojoComponents.id(request.ComponentId)!;

    if (component.DecoCapacity === undefined) {
        component.DecoCapacity = Object.values(ExportDojoRecipes.rooms).find(
            x => x.resultType == component.pf
        )!.decoCapacity;
    }

    component.Decos ??= [];
    if (request.MoveId) {
        const deco = component.Decos.find(x => x._id.equals(request.MoveId))!;
        deco.Pos = request.Pos;
        deco.Rot = request.Rot;
    } else {
        const deco =
            component.Decos[
                component.Decos.push({
                    _id: new Types.ObjectId(),
                    Type: request.Type,
                    Pos: request.Pos,
                    Rot: request.Rot,
                    Name: request.Name,
                    Sockets: request.Sockets
                }) - 1
            ];
        const meta = Object.values(ExportDojoRecipes.decos).find(x => x.resultType == request.Type);
        if (meta) {
            if (meta.capacityCost) {
                component.DecoCapacity -= meta.capacityCost;
            }
        } else {
            const itemType = Object.entries(ExportResources).find(arr => arr[1].deco == deco.Type)![0];
            if (deco.Sockets !== undefined) {
                guild.VaultFusionTreasures!.find(x => x.ItemType == itemType && x.Sockets == deco.Sockets)!.ItemCount -=
                    1;
            } else {
                guild.VaultShipDecorations!.find(x => x.ItemType == itemType)!.ItemCount -= 1;
            }
        }
        if (!meta || (meta.price == 0 && meta.ingredients.length == 0)) {
            deco.CompletionTime = new Date();
        } else if (guild.AutoContributeFromVault && guild.VaultRegularCredits && guild.VaultMiscItems) {
            if (guild.VaultRegularCredits >= scaleRequiredCount(guild.Tier, meta.price)) {
                let enoughMiscItems = true;
                for (const ingredient of meta.ingredients) {
                    if (
                        getVaultMiscItemCount(guild, ingredient.ItemType) <
                        scaleRequiredCount(guild.Tier, ingredient.ItemCount)
                    ) {
                        enoughMiscItems = false;
                        break;
                    }
                }
                if (enoughMiscItems) {
                    guild.VaultRegularCredits -= meta.price;
                    deco.RegularCredits = meta.price;

                    deco.MiscItems = [];
                    for (const ingredient of meta.ingredients) {
                        guild.VaultMiscItems.find(x => x.ItemType == ingredient.ItemType)!.ItemCount -=
                            scaleRequiredCount(guild.Tier, ingredient.ItemCount);
                        deco.MiscItems.push({
                            ItemType: ingredient.ItemType,
                            ItemCount: scaleRequiredCount(guild.Tier, ingredient.ItemCount)
                        });
                    }

                    deco.CompletionTime = new Date(Date.now() + meta.time * 1000);
                    processDojoBuildMaterialsGathered(guild, meta);
                }
            }
        }
    }

    await guild.save();
    res.json(await getDojoClient(guild, 0, component._id));
};

interface IPlaceDecoInComponentRequest {
    ComponentId: string;
    Revision: number;
    Type: string;
    Pos: number[];
    Rot: number[];
    Name?: string;
    Sockets?: number;
    Scale?: number; // only provided alongside MoveId and seems to always be 1
    MoveId?: string;
    ShipDeco?: boolean;
    VaultDeco?: boolean;
}
