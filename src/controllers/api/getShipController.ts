import { Account } from "@/src/models/loginModel";
import { Ship } from "@/src/models/shipModel";
import { createShip } from "@/src/services/shipService";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const getShipController: RequestHandler = async (req, res) => {
    const accountId = req.query.accountId;
    const ship = await Ship.findOne({ ShipOwnerId: accountId });
    if (!ship) {
        // previously registered account
        const account = await Account.findOne({ _id: accountId });
        if (account) {
            await createShip(account._id);
            const new_ship = await Ship.findOne({ ShipOwnerId: accountId });
            res.json(new_ship);
            return;
        }
    }
    res.json(ship);
};

export { getShipController };
