import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { Account } from "@/src/models/loginModel";
import { Inbox } from "@/src/models/inboxModel";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { PersonalRooms } from "@/src/models/personalRoomsModel";
import { Ship } from "@/src/models/shipModel";
import { Stats } from "@/src/models/statsModel";

export const deleteAccountController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    await Promise.all([
        Account.deleteOne({ _id: accountId }),
        Inbox.deleteMany({ ownerId: accountId }),
        Inventory.deleteOne({ accountOwnerId: accountId }),
        Loadout.deleteOne({ loadoutOwnerId: accountId }),
        PersonalRooms.deleteOne({ personalRoomsOwnerId: accountId }),
        Ship.deleteOne({ ShipOwnerId: accountId }),
        Stats.deleteOne({ accountOwnerId: accountId })
    ]);
    res.end();
};
