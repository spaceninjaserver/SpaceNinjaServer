import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { TInventoryDatabaseDocument } from "../../models/inventoryModels/inventoryModel.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { ICrewMemberClient } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";
import { Types } from "mongoose";

export const crewMembersController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "CrewMembers NemesisHistory");
    const data = getJSONfromString<ICrewMembersRequest>(String(req.body));
    if (data.crewMember.SecondInCommand) {
        clearOnCall(inventory);
    }
    if (data.crewMember.ItemId.$oid == "000000000000000000000000") {
        const convertedNemesis = inventory.NemesisHistory!.find(x => x.fp == data.crewMember.NemesisFingerprint)!;
        convertedNemesis.SecondInCommand = data.crewMember.SecondInCommand;
    } else {
        const dbCrewMember = inventory.CrewMembers.id(data.crewMember.ItemId.$oid)!;
        dbCrewMember.AssignedRole = data.crewMember.AssignedRole;
        dbCrewMember.SkillEfficiency = data.crewMember.SkillEfficiency;
        dbCrewMember.WeaponConfigIdx = data.crewMember.WeaponConfigIdx;
        dbCrewMember.WeaponId = new Types.ObjectId(data.crewMember.WeaponId.$oid);
        dbCrewMember.Configs = data.crewMember.Configs;
        dbCrewMember.SecondInCommand = data.crewMember.SecondInCommand;
    }
    await inventory.save();
    res.json({
        crewMemberId: data.crewMember.ItemId.$oid,
        NemesisFingerprint: data.crewMember.NemesisFingerprint
    });
};

interface ICrewMembersRequest {
    crewMember: ICrewMemberClient;
}

const clearOnCall = (inventory: TInventoryDatabaseDocument): void => {
    for (const cm of inventory.CrewMembers) {
        if (cm.SecondInCommand) {
            cm.SecondInCommand = false;
            return;
        }
    }
    if (inventory.NemesisHistory) {
        for (const cm of inventory.NemesisHistory) {
            if (cm.SecondInCommand) {
                cm.SecondInCommand = false;
                return;
            }
        }
    }
};
