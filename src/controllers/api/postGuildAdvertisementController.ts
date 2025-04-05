import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { GuildAd, GuildMember } from "@/src/models/guildModel";
import {
    addGuildMemberMiscItemContribution,
    addVaultMiscItems,
    getGuildForRequestEx,
    getVaultMiscItemCount,
    hasGuildPermissionEx
} from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getVendorManifestByTypeName } from "@/src/services/serversideVendorsService";
import { GuildPermission } from "@/src/types/guildTypes";
import { IPurchaseParams } from "@/src/types/purchaseTypes";
import { RequestHandler } from "express";

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
