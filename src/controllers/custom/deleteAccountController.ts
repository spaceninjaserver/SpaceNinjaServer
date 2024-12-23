import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { Account } from "@/src/models/loginModel";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { PersonalRooms } from "@/src/models/personalRoomsModel";
import { Ship } from "@/src/models/shipModel";

export const deleteAccountController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    await Promise.all([
        Account.deleteOne({ _id: accountId }),
        Inventory.deleteOne({ accountOwnerId: accountId }),
        Loadout.deleteOne({ loadoutOwnerId: accountId }),
        PersonalRooms.deleteOne({ personalRoomsOwnerId: accountId }),
        Ship.deleteOne({ ShipOwnerId: accountId })
    ]);
    res.end();
};
