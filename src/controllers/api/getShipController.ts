import { RequestHandler } from "express";

import { Account } from "@/src/models/loginModel";
import { Ship } from "@/src/models/shipModel";

import { createShip } from "@/src/services/shipService";

import config from "@/config.json";
import testShipFeature from "@/static/fixed_responses/testShipFeature.json";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const getShipController: RequestHandler = async (_req, res) => {
    const accountId = _req.query.accountId;
    const ship = await Ship.findOne({ ShipOwnerId: accountId });
    if (!ship) {
        const account = await Account.findOne({ _id: accountId });
        if (account) {
            await createShip(account._id);
            const new_ship = await Ship.findOne({ ShipOwnerId: accountId });
            res.json(new_ship);
            return;
        }
    }

    if (ship) {
        const new_ship = ship;
        if (config.testMission) new_ship.Ship.Features = testShipFeature;
        res.json(new_ship);
        return;
    }
    res.json(ship);
};

export { getShipController };
