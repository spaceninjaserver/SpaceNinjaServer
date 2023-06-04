/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Item, Misc, Skin, Warframe, Weapon } from "warframe-items";
import { InventoryChanges, StoreItem } from "../types/commonTypes";
import { generateOid, parseString } from "../helpers/general";
import { UpdateInventory } from "./inventoryService";

const PurchaseItem = async (
    accountId: string,
    item: Item,
    quantity: number,
    usePremium: boolean,
    price: number
): Promise<InventoryChanges> => {
    // {"InventoryChanges":{"WishlistChanges":["/Lotus/Types/StoreItems/SuitCustomizations/ColourPickerItem"],"FlavourItems":[{"ItemType":"/Lotus/Types/StoreItems/SuitCustomizations/ColourPickerItem"}],"PremiumCredits":-75}}
    const newInventoryChanges: InventoryChanges = {};
    if ((item as Warframe).productCategory == "Suits") {
        const newSuits: StoreItem[] = [
            {
                ItemType: item.uniqueName,
                Cofigs: [],
                ItemId: generateOid()
            }
        ];
        newInventoryChanges.Suits = newSuits;
    } else if ((item as Weapon).productCategory == "LongGuns") {
        const newLongGuns: StoreItem[] = [
            {
                ItemType: item.uniqueName,
                Cofigs: [],
                ItemId: generateOid()
            }
        ];
        newInventoryChanges.LongGuns = newLongGuns;
    } else if ((item as Weapon).productCategory == "Pistols") {
        const newPistols: StoreItem[] = [
            {
                ItemType: item.uniqueName,
                Cofigs: [],
                ItemId: generateOid()
            }
        ];
        newInventoryChanges.Pistols = newPistols;
    } else if ((item as Weapon).productCategory == "Melee") {
        const newMelee: StoreItem[] = [
            {
                ItemType: item.uniqueName,
                Cofigs: [],
                ItemId: generateOid()
            }
        ];
        newInventoryChanges.Melee = newMelee;
    } else if (item as Skin) {
        newInventoryChanges.WishlistChanges = [];
        newInventoryChanges.WishlistChanges.push(parseString(item.uniqueName));
        const newFlavourItem: StoreItem[] = [
            {
                ItemType: item.uniqueName
            }
        ];
        newInventoryChanges.FlavourItems = newFlavourItem;
    } else if (item as Misc) {
        const newMisc: StoreItem[] = [
            {
                ItemType: item.uniqueName,
                ItemCount: quantity
            }
        ];
        newInventoryChanges.MiscItems = newMisc;
    }
    if (usePremium) {
        newInventoryChanges.PremiumCredits = -price;
    }
    if (!usePremium) {
        newInventoryChanges.RegularCredits = -price;
    }
    await UpdateInventory(accountId, newInventoryChanges);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return newInventoryChanges;
};

export { PurchaseItem };
