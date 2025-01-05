import { Ship } from "@/src/models/shipModel";
import { ILoadoutDatabase } from "@/src/types/saveLoadoutTypes";
import { Types } from "mongoose";

export const createShip = async (
    accountOwnerId: Types.ObjectId,
    typeName: string = "/Lotus/Types/Items/Ships/DefaultShip"
) => {
    try {
        const ship = new Ship({
            ItemType: typeName,
            ShipOwnerId: accountOwnerId
        });
        const newShip = await ship.save();
        return newShip._id;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`error creating ship" ${error.message}`);
        }
        throw new Error("error creating ship that is not of instance Error");
    }
};

export const getShip = async (shipId: Types.ObjectId, fieldSelection: string = "") => {
    const ship = await Ship.findOne({ _id: shipId }, fieldSelection);

    if (!ship) {
        throw new Error(`error finding a ship with id ${shipId.toString()}`);
    }

    return ship;
};

export const getShipLean = async (shipOwnerId: string) => {
    const ship = await Ship.findOne({ ShipOwnerId: shipOwnerId }).lean().populate<{
        LoadOutInventory: { LoadOutPresets: ILoadoutDatabase };
    }>("LoadOutInventory.LoadOutPresets");

    if (!ship) {
        throw new Error(`error finding a ship for account ${shipOwnerId}`);
    }

    return ship;
};
