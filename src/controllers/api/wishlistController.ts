import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const wishlistController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "Wishlist");
    const body = getJSONfromString<IWishlistRequest>(String(req.body));
    for (const item of body.WishlistItems) {
        const i = inventory.Wishlist.findIndex(x => x == item);
        if (i == -1) {
            inventory.Wishlist.push(item);
        } else {
            inventory.Wishlist.splice(i, 1);
        }
    }
    await inventory.save();
    res.end();
};

interface IWishlistRequest {
    WishlistItems: string[];
}
