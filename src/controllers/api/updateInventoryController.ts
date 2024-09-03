import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";
import { getInventory } from "@/src/services/inventoryService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const updateInventoryController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const body: any = JSON.parse(req.body as string);

    const inventory = await getInventory(accountId);
    inventory.Missions.push({ Tag: body.Missions.Tag, Completes: body.Missions.Completes, BestRating: 0.2 });

    await inventory.save();
    console.log(body);
    res.json({});
};

/*
{
    "LongGuns" : [
        {
            "ItemType" : "",
            "ItemId" : {
                "$id" : ""
            },
            "XP" : 882,
            "UpgradeVer" : 0,
            "UnlockLevel" : 0,
            "ExtraCapacity" : 4,
            "ExtraRemaining" : 4
        }
    ],
    "Pistols" : [
        {
            "ItemType" : "",
            "ItemId" : {
                "$id" : ""
            },
            "XP" : 0,
            "UpgradeVer" : 0,
            "UnlockLevel" : 0,
            "ExtraCapacity" : 4,
            "ExtraRemaining" : 4
        }
    ],
    "Suits" : [
        {
            "ItemType" : "",
            "ItemId" : {
                "$id" : ""
            },
            "XP" : 982,
            "UpgradeVer" : 101,
            "UnlockLevel" : 0,
            "ExtraCapacity" : 4,
            "ExtraRemaining" : 4
        }
    ],
    "Melee" : [
        {
            "ItemType" : "",
            "ItemId" : {
                "$id" : ""
            },
            "XP" : 0,
            "UpgradeVer" : 0,
            "UnlockLevel" : 0,
            "ExtraCapacity" : 4,
            "ExtraRemaining" : 4
        }
    ],
    "WeaponSkins" : [],
    "Upgrades" : [],
    "Boosters" : [],
    "Robotics" : [],
    "Consumables" : [],
    "FlavourItems" : [],
    "MiscItems" : [],
    "Cards" : [],
    "Recipes" : [],
    "XPInfo" : [],
    "Sentinels" : [],
    "SentinelWeapons" : [],
    "SuitBin" : {
        "Slots" : 0,
        "Extra" : 0
    },
    "WeaponBin" : {
        "Slots" : 0,
        "Extra" : 0
    },
    "MiscBin" : {
        "Slots" : 0,
        "Extra" : 0
    },
    "SentinelBin" : {
        "Slots" : 0,
        "Extra" : 0
    },
    "RegularCredits" : 1304,
    "PremiumCredits" : 0,
    "PlayerXP" : 784,
    "AdditionalPlayerXP" : 0,
    "Rating" : 15,
    "PlayerLevel" : 0,
    "TrainingDate" : {
        "sec" : "",
        "usec" : ""
    },
    "AliveTime" : 193.78572,
    "Missions" : {
        "Tag" : "SolNode103",
        "Completes" : 1,
        "BestRating" : 0.2
    },
    "AssignedMissions" : [],
    "CompletedAlerts" : [],
    "DeathMarks" : [],
    "MissionReport" : {
        "HostId" : "",
        "MishStartTime" : "1725359860",
        "MishName" : "SolNode103",
        "PlayerReport" : {
            "ReporterId" : "",
            "FullReport" : true,
            "PlayerMishInfos" : [
                {
                    "Pid" : "",
                    "Creds" : 304,
                    "CredBonus" : 1000,
                    "Xp" : 784,
                    "XpBonus" : 0,
                    "SuitXpBonus" : 590,
                    "PistolXpBonus" : 0,
                    "RfileXpBonus" : 490,
                    "MeleeXpBonus" : 0,
                    "SentnlXPBonus" : 0,
                    "SentnlWepXpBonus" : 0,
                    "Rating" : 0.2,
                    "Upgrades" : []
                }
            ]
        }
    }
}
*/
