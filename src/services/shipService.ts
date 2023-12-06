import { Ship } from "@/src/models/shipModel";
import new_ship from "@/static/fixed_responses/ship.json";
import { Types } from "mongoose";

const createShip = async (accountOwnerId: Types.ObjectId, loadoutId: Types.ObjectId) => {
    try {
        const ship = new Ship({
            ...new_ship,
            ShipOwnerId: accountOwnerId,
            LoadOutInventory: { LoadOutPresets: loadoutId }
        });
        await ship.save();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`error creating ship" ${error.message}`);
        }
        throw new Error("error creating ship that is not of instance Error");
    }
};

export { createShip };
