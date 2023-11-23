import { Inventory } from "@/src/models/inventoryModel";
import { RequestHandler } from "express";
import util from "util";
import {
    EquipmentCategories,
    IConfigEntry,
    ILoadout,
    ISaveLoadoutRequest,
    ISaveLoadoutRequestNoUpgradeVer
} from "@/src/types/saveLoadoutTypes";

export const isObjectEmpty = (obj: Record<string, unknown>) => {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

type EquipmentChangeEntry = IConfigEntry | ILoadout;

export const handleInventoryItemConfigChange = (equipmentChanges: ISaveLoadoutRequestNoUpgradeVer) => {
    for (const [_equipmentName, _equipment] of Object.entries(equipmentChanges)) {
        const equipment = _equipment as ISaveLoadoutRequestNoUpgradeVer[keyof ISaveLoadoutRequestNoUpgradeVer];
        const equipmentName = _equipmentName as keyof ISaveLoadoutRequestNoUpgradeVer;

        if (isObjectEmpty(equipment)) {
            continue;
        }
        // non-empty is a change in loadout(or suit...)

        switch (equipmentName) {
            case "LoadOuts": {
                console.log("loadout received");
                const _loadout = equipment as unknown as ILoadout;

                for (const [loadoutName, loadout] of Object.entries(_loadout)) {
                    console.log(loadoutName, loadout);
                    //const loadout = _loadout as ILoadoutEntry;

                    // console.log(loadoutName, loadout);
                    // if (isObjectEmpty(loadout)) {
                    //     continue;
                    // }
                }
                break;
            }
            case "LongGuns": {
                const longGun = equipment as IConfigEntry;
                //   longGun["key"].PvpUpgrades;
                break;
            }
            case "OperatorAmps":
            case "Pistols":
            case "Suits":
            case "Melee":
            case "Sentinels":
            case "SentinelWeapons":
            case "KubrowPets":
            case "SpaceSuits":
            case "SpaceGuns":
            case "SpaceMelee":
            case "Scoops":
            case "SpecialItems":
            case "MoaPets":
            case "Hoverboards":
            case "DataKnives":
            case "MechSuits":
            case "CrewShipHarnesses":
            case "Horses":
            case "DrifterMelee":
            case "OperatorLoadOuts":
            case "AdultOperatorLoadOuts":
            case "KahlLoadOuts":
            case "CrewShips":

            default: {
                console.log("category not implemented", equipmentName);
            }
        }
        // Object.keys(value).forEach(element => {
        //     console.log("name of inner objects keys", element);
        // });
        // for (const innerValue of Object.values(value)) {
        //     console.log(innerValue);
        // }

        // console.log(innerObjects);
        // if (isObjectEmpty(innerObjects)) {
        //     console.log(innerObjects, "is empty");
        // }
    }
};

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const saveLoadoutController: RequestHandler = async (req, res) => {
    //validate here
    const body: ISaveLoadoutRequest = JSON.parse(req.body as string) as ISaveLoadoutRequest;
    // console.log(util.inspect(body, { showHidden: false, depth: null, colors: true }));

    const { UpgradeVer, ...equipmentChanges } = body;
    handleInventoryItemConfigChange(equipmentChanges);

    res.status(200).end();
};

export { saveLoadoutController };
