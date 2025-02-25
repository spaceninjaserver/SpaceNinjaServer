import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { InventoryDocumentProps } from "@/src/models/inventoryModels/inventoryModel";
import {
    addEquipment,
    addItem,
    combineInventoryChanges,
    getInventory,
    updateSlots
} from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IInventoryClient, IInventoryDatabase, InventorySlot } from "@/src/types/inventoryTypes/inventoryTypes";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { RequestHandler } from "express";
import { HydratedDocument } from "mongoose";

type TPartialStartingGear = Pick<IInventoryClient, "LongGuns" | "Suits" | "Pistols" | "Melee">;

export const giveStartingGearController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const startingGear = getJSONfromString<TPartialStartingGear>(String(req.body));
    const inventory = await getInventory(accountId);

    const inventoryChanges = await addStartingGear(inventory, startingGear);
    await inventory.save();

    res.send(inventoryChanges);
};

//TODO: RawUpgrades might need to return a LastAdded
const awakeningRewards = [
    "/Lotus/Types/StoreItems/AvatarImages/AvatarImageItem1",
    "/Lotus/Types/StoreItems/AvatarImages/AvatarImageItem2",
    "/Lotus/Types/StoreItems/AvatarImages/AvatarImageItem3",
    "/Lotus/Types/StoreItems/AvatarImages/AvatarImageItem4",
    "/Lotus/Types/Restoratives/LisetAutoHack",
    "/Lotus/Upgrades/Mods/Warframe/AvatarShieldMaxMod"
];

export const addStartingGear = async (
    inventory: HydratedDocument<IInventoryDatabase, InventoryDocumentProps>,
    startingGear: TPartialStartingGear | undefined = undefined
): Promise<IInventoryChanges> => {
    const { LongGuns, Pistols, Suits, Melee } = startingGear || {
        LongGuns: [{ ItemType: "/Lotus/Weapons/Tenno/Rifle/Rifle" }],
        Pistols: [{ ItemType: "/Lotus/Weapons/Tenno/Pistol/Pistol" }],
        Suits: [{ ItemType: "/Lotus/Powersuits/Excalibur/Excalibur" }],
        Melee: [{ ItemType: "/Lotus/Weapons/Tenno/Melee/LongSword/LongSword" }]
    };

    //TODO: properly merge weapon bin changes it is currently static here
    const inventoryChanges: IInventoryChanges = {};
    addEquipment(inventory, "LongGuns", LongGuns[0].ItemType, undefined, inventoryChanges);
    addEquipment(inventory, "Pistols", Pistols[0].ItemType, undefined, inventoryChanges);
    addEquipment(inventory, "Melee", Melee[0].ItemType, undefined, inventoryChanges);
    addEquipment(inventory, "Suits", Suits[0].ItemType, undefined, inventoryChanges, { Configs: Suits[0].Configs });
    addEquipment(
        inventory,
        "DataKnives",
        "/Lotus/Weapons/Tenno/HackingDevices/TnHackingDevice/TnHackingDeviceWeapon",
        undefined,
        inventoryChanges,
        { XP: 450_000 }
    );
    addEquipment(
        inventory,
        "Scoops",
        "/Lotus/Weapons/Tenno/Speedball/SpeedballWeaponTest",
        undefined,
        inventoryChanges
    );

    updateSlots(inventory, InventorySlot.SUITS, 0, 1);
    updateSlots(inventory, InventorySlot.WEAPONS, 0, 3);
    inventoryChanges.SuitBin = { count: 1, platinum: 0, Slots: -1 };
    inventoryChanges.WeaponBin = { count: 3, platinum: 0, Slots: -3 };

    await addItem(inventory, "/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain");
    inventory.ActiveQuest = "/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain";

    inventory.PremiumCredits = 50;
    inventory.PremiumCreditsFree = 50;
    inventoryChanges.PremiumCredits = 50;
    inventoryChanges.PremiumCreditsFree = 50;
    inventory.RegularCredits = 3000;
    inventoryChanges.RegularCredits = 3000;

    for (const item of awakeningRewards) {
        const inventoryDelta = await addItem(inventory, item);
        combineInventoryChanges(inventoryChanges, inventoryDelta.InventoryChanges);
    }

    inventory.PlayedParkourTutorial = true;
    inventory.ReceivedStartingGear = true;

    return inventoryChanges;
};
