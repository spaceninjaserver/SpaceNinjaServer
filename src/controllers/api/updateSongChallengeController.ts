import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addShipDecorations, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { IInventoryChanges } from "@/src/types/purchaseTypes";
import type { RequestHandler } from "express";

export const updateSongChallengeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = getJSONfromString<IUpdateSongChallengeRequest>(String(req.body));
    inventory.SongChallenges ??= [];
    let songChallenge = inventory.SongChallenges.find(x => x.Song == request.Song);
    if (!songChallenge) {
        songChallenge =
            inventory.SongChallenges[inventory.SongChallenges.push({ Song: request.Song, Difficulties: [] }) - 1];
    }
    songChallenge.Difficulties.push(request.Difficulty);

    const response: IUpdateSongChallengeResponse = {
        Song: request.Song,
        Difficulty: request.Difficulty
    };

    // Handle all songs being completed on all difficulties
    if (inventory.SongChallenges.length == 12 && !inventory.SongChallenges.find(x => x.Difficulties.length != 2)) {
        response.Reward = "/Lotus/StoreItems/Types/Items/ShipDecos/LisetPropShawzinDuviri";
        const shipDecorationChanges = [
            { ItemType: "/Lotus/Types/Items/ShipDecos/LisetPropShawzinDuviri", ItemCount: 1 }
        ];
        response.InventoryChanges = {
            ShipDecorations: shipDecorationChanges
        };
        addShipDecorations(inventory, shipDecorationChanges);
    }

    await inventory.save();
    res.json(response);
};

interface IUpdateSongChallengeRequest {
    Song: string;
    Difficulty: number;
}

interface IUpdateSongChallengeResponse {
    Song: string;
    Difficulty: number;
    Reward?: string;
    InventoryChanges?: IInventoryChanges;
}
