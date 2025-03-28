import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import {
    getInventory,
    updateCurrency,
    addEquipment,
    addMiscItems,
    applyDefaultUpgrades,
    occupySlot,
    productCategoryToInventoryBin,
    combineInventoryChanges,
    addSpecialItem
} from "@/src/services/inventoryService";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { getDefaultUpgrades } from "@/src/services/itemDataService";
import { modularWeaponTypes } from "@/src/helpers/modularWeaponHelper";
import { IEquipmentDatabase } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { getRandomInt } from "@/src/services/rngService";
import { ExportSentinels } from "warframe-public-export-plus";
import { Status } from "@/src/types/inventoryTypes/inventoryTypes";

interface IModularCraftRequest {
    WeaponType: string;
    Parts: string[];
}

export const modularWeaponCraftingController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IModularCraftRequest>(String(req.body));
    if (!(data.WeaponType in modularWeaponTypes)) {
        throw new Error(`unknown modular weapon type: ${data.WeaponType}`);
    }
    const category = modularWeaponTypes[data.WeaponType];
    const inventory = await getInventory(accountId);

    const defaultUpgrades = getDefaultUpgrades(data.Parts);
    const defaultOverwrites: Partial<IEquipmentDatabase> = {
        Configs: applyDefaultUpgrades(inventory, defaultUpgrades)
    };
    const inventoryChanges: IInventoryChanges = {};
    if (category == "KubrowPets") {
        const traits =
            data.WeaponType.indexOf("Catbrow") != -1
                ? {
                      BaseColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorRareBase",
                      SecondaryColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorRareSecondary",
                      TertiaryColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorRareTertiary",
                      AccentColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorRareAccent",
                      EyeColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorRareEyes",
                      FurPattern: "/Lotus/Types/Game/InfestedKavatPet/Patterns/InfestedCritterPatternDefault",
                      Personality: data.WeaponType,
                      BodyType: "/Lotus/Types/Game/CatbrowPet/BodyTypes/InfestedCatbrowPetRegularBodyType",
                      Head: {
                          "/Lotus/Types/Friendly/Pets/CreaturePets/ArmoredInfestedCatbrowPetPowerSuit":
                              "/Lotus/Types/Game/InfestedKavatPet/Heads/InfestedCritterHeadC",
                          "/Lotus/Types/Friendly/Pets/CreaturePets/HornedInfestedCatbrowPetPowerSuit":
                              "/Lotus/Types/Game/InfestedKavatPet/Heads/InfestedCritterHeadB",
                          "/Lotus/Types/Friendly/Pets/CreaturePets/VulpineInfestedCatbrowPetPowerSuit":
                              "/Lotus/Types/Game/InfestedKavatPet/Heads/InfestedCritterHeadA"
                      }[data.WeaponType]
                  }
                : {
                      BaseColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorRareBase",
                      SecondaryColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorRareSecondary",
                      TertiaryColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorRareTertiary",
                      AccentColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorRareAccent",
                      EyeColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorRareEyes",
                      FurPattern: "/Lotus/Types/Game/InfestedPredatorPet/Patterns/InfestedPredatorPatternDefault",
                      Personality: data.WeaponType,
                      BodyType: "/Lotus/Types/Game/KubrowPet/BodyTypes/InfestedKubrowPetBodyType",
                      Head: {
                          "/Lotus/Types/Friendly/Pets/CreaturePets/MedjayPredatorKubrowPetPowerSuit":
                              "/Lotus/Types/Game/InfestedPredatorPet/Heads/InfestedPredatorHeadA",
                          "/Lotus/Types/Friendly/Pets/CreaturePets/PharaohPredatorKubrowPetPowerSuit":
                              "/Lotus/Types/Game/InfestedPredatorPet/Heads/InfestedPredatorHeadB",
                          "/Lotus/Types/Friendly/Pets/CreaturePets/VizierPredatorKubrowPetPowerSuit":
                              "/Lotus/Types/Game/InfestedPredatorPet/Heads/InfestedPredatorHeadC"
                      }[data.WeaponType]
                  };
        defaultOverwrites.Details = {
            HasCollar: true,
            Status: Status.StatusStasis,
            IsMale: !!getRandomInt(0, 1),
            Size: 0.7 + Math.random() * 0.3,
            DominantTraits: traits,
            RecessiveTraits: traits
        };

        // Only save mutagen & antigen in the ModularParts.
        defaultOverwrites.ModularParts = [data.Parts[1], data.Parts[2]];

        for (const specialItem of ExportSentinels[data.WeaponType].exalted!) {
            addSpecialItem(inventory, specialItem, inventoryChanges);
        }
    }
    addEquipment(inventory, category, data.WeaponType, data.Parts, inventoryChanges, defaultOverwrites);
    combineInventoryChanges(inventoryChanges, occupySlot(inventory, productCategoryToInventoryBin(category)!, false));
    if (defaultUpgrades) {
        inventoryChanges.RawUpgrades = defaultUpgrades.map(x => ({ ItemType: x.ItemType, ItemCount: 1 }));
    }

    // Remove credits & parts
    const miscItemChanges = [];
    for (const part of data.Parts) {
        miscItemChanges.push({
            ItemType: part,
            ItemCount: -1
        });
    }
    const currencyChanges = updateCurrency(
        inventory,
        category == "Hoverboards" ||
            category == "MoaPets" ||
            category == "LongGuns" ||
            category == "Pistols" ||
            category == "KubrowPets"
            ? 5000
            : 4000, // Definitely correct for Melee & OperatorAmps
        false
    );
    addMiscItems(inventory, miscItemChanges);
    await inventory.save();

    // Tell client what we did
    res.json({
        InventoryChanges: {
            ...inventoryChanges,
            ...currencyChanges,
            MiscItems: miscItemChanges
        }
    });
};
