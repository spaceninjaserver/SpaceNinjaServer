import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { GuildAd, GuildMember } from "../../models/guildModel.ts";
import {
    addGuildMemberMiscItemContribution,
    addVaultMiscItems,
    getGuildForRequestEx,
    getVaultMiscItemCount,
    hasGuildPermissionEx
} from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getVendorManifestByTypeName } from "../../services/serversideVendorsService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { IPurchaseParams } from "../../types/purchaseTypes.ts";
import type { RequestHandler } from "express";

export const postGuildAdvertisementController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId MiscItems");
    const guild = await getGuildForRequestEx(req, inventory);
    const guildMember = (await GuildMember.findOne({ accountId, guildId: guild._id }))!;
    if (!hasGuildPermissionEx(guild, guildMember, GuildPermission.Advertiser)) {
        res.status(400).end();
        return;
    }
    const payload = getJSONfromString<IPostGuildAdvertisementRequest>(String(req.body));

    // Handle resource cost
    const vendor = getVendorManifestByTypeName(
        "/Lotus/Types/Game/VendorManifests/Hubs/GuildAdvertisementVendorManifest"
    )!;
    const offer = vendor.VendorInfo.ItemManifest.find(x => x.StoreItem == payload.PurchaseParams.StoreItem)!;
    if (getVaultMiscItemCount(guild, offer.ItemPrices![0].ItemType) >= offer.ItemPrices![0].ItemCount) {
        addVaultMiscItems(guild, [
            {
                ItemType: offer.ItemPrices![0].ItemType,
                ItemCount: offer.ItemPrices![0].ItemCount * -1
            }
        ]);
    } else {
        const miscItem = inventory.MiscItems.find(x => x.ItemType == offer.ItemPrices![0].ItemType);
        if (!miscItem || miscItem.ItemCount < offer.ItemPrices![0].ItemCount) {
            res.status(400).json("Insufficient funds");
            return;
        }
        miscItem.ItemCount -= offer.ItemPrices![0].ItemCount;
        addGuildMemberMiscItemContribution(guildMember, offer.ItemPrices![0]);
        await guildMember.save();
        await inventory.save();
    }

    // Create or update ad
    await GuildAd.findOneAndUpdate(
        { GuildId: guild._id },
        {
            Emblem: guild.Emblem,
            Expiry: new Date(Date.now() + 12 * 3600 * 1000),
            Features: payload.Features,
            GuildName: guild.Name,
            MemberCount: await GuildMember.countDocuments({ guildId: guild._id, status: 0 }),
            RecruitMsg: payload.RecruitMsg,
            Tier: guild.Tier
        },
        { upsert: true }
    );

    res.end();
};

interface IPostGuildAdvertisementRequest {
    Features: number;
    RecruitMsg: string;
    Languages: string[];
    PurchaseParams: IPurchaseParams;
}
