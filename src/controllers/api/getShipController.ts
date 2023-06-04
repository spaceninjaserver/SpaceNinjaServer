import { Ship } from "@/src/models/shipModel";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const getShipController: RequestHandler = async (req, res) => {
    const accountId = req.query.accountId;
    const ship = await Ship.findOne({ ShipOwnerId: accountId });
    if (!ship) {
        res.status(500).json({ error: "error finding a corresponding ship" });
        return;
    }
    res.json(ship);
};

export { getShipController };
