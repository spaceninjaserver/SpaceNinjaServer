import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { ICrewMemberClient } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";
import { Types } from "mongoose";

export const crewMembersController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "CrewMembers");
    const data = getJSONfromString<ICrewMembersRequest>(String(req.body));
    const dbCrewMember = inventory.CrewMembers.id(data.crewMember.ItemId.$oid)!;
    dbCrewMember.AssignedRole = data.crewMember.AssignedRole;
    dbCrewMember.SkillEfficiency = data.crewMember.SkillEfficiency;
    dbCrewMember.WeaponConfigIdx = data.crewMember.WeaponConfigIdx;
    dbCrewMember.WeaponId = new Types.ObjectId(data.crewMember.WeaponId.$oid);
    dbCrewMember.Configs = data.crewMember.Configs;
    dbCrewMember.SecondInCommand = data.crewMember.SecondInCommand;
    await inventory.save();
    res.json({
        crewMemberId: data.crewMember.ItemId.$oid,
        NemesisFingerprint: data.crewMember.NemesisFingerprint
    });
};

interface ICrewMembersRequest {
    crewMember: ICrewMemberClient;
}
