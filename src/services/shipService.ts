import { Ship } from "@/src/models/shipModel";
import { ILoadoutDatabase } from "@/src/types/saveLoadoutTypes";
import { logger } from "@/src/utils/logger";
import { Types } from "mongoose";

export const createShip = async (accountOwnerId: Types.ObjectId) => {
    try {
        const ship = new Ship({
            ItemType: "/Lotus/Types/Items/Ships/DefaultShip",
            ShipOwnerId: accountOwnerId,
            ShipInteriorColors: {
                t0: 3828063,
                t1: 2502747
            },
            ShipAttachments: { HOOD_ORNAMENT: "" },
            SkinFlavourItem: "/Lotus/Upgrades/Skins/Liset/LisetSkinFlavourItemDefault"
        });
        const newShip = await ship.save();
        console.log(newShip);
        return newShip._id;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`error creating ship" ${error.message}`);
        }
        throw new Error("error creating ship that is not of instance Error");
    }
};

export const getShip = async (shipOwnerId: string, fieldSelection: string = "") => {
    const ship = await Ship.findOne({ ShipOwnerId: shipOwnerId }, fieldSelection);

    if (!ship) {
        logger.error(`error finding a ship for account ${shipOwnerId}`);
        throw new Error(`error finding a ship for account ${shipOwnerId}`);
    }

    return ship;
};

export const getShipLean = async (shipOwnerId: string) => {
    const ship = await Ship.findOne({ ShipOwnerId: shipOwnerId }).lean().populate<{
        LoadOutInventory: { LoadOutPresets: ILoadoutDatabase };
    }>("LoadOutInventory.LoadOutPresets");

    if (!ship) {
        logger.error(`error finding a ship for account ${shipOwnerId}`);
        throw new Error(`error finding a ship for account ${shipOwnerId}`);
    }

    return ship;
};
