import type { RequestHandler } from "express";
import { getAccountForRequest, getUnicodeName, stripUnicodeSuffix } from "../../services/loginService.ts";
import type { IOid } from "../../types/commonTypes.ts";
import { Account } from "../../models/loginModel.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import type { IEquipmentClient } from "../../types/equipmentTypes.ts";
import { Loadout } from "../../models/inventoryModels/loadoutModel.ts";
import { eLoadoutIndex } from "../../types/inventoryTypes/inventoryTypes.ts";
import { toObjectId } from "../../helpers/inventoryHelpers.ts";

export const asyncMissionAssistController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const payload = JSON.parse(String(req.body)) as IAsyncMissionAssistRequest;
    const excludedOwnerIds = [account._id];
    const accounts = await Account.find(
        { DisplayName: { $in: payload.ExcludedNames.map(stripUnicodeSuffix) } },
        { _id: 1 }
    );
    for (const acc of accounts) {
        excludedOwnerIds.push(acc._id);
    }
    const candidateIds = payload.Candidates.map(c => toObjectId(c.$oid));
    let inventories = await Inventory.find(
        {
            accountOwnerId: { $in: candidateIds, $nin: excludedOwnerIds },
            QuestKeys: {
                $elemMatch: { ItemType: "/Lotus/Types/Keys/OrokinMoonQuest/OrokinMoonQuestKeyChain", Completed: true }
            },
            OperatorSuits: { $elemMatch: { ItemType: "/Lotus/Powersuits/Operator/ChildOperatorSuitRemaster" } }
        },
        { _id: 0, accountOwnerId: 1, FocusAbility: 1, OperatorSuits: 1, CurrentLoadOutIds: 1 }
    ).limit(payload.Count);
    if (inventories.length < payload.Count) {
        const remaining = payload.Count - inventories.length;
        const otherInventories = await Inventory.aggregate([
            {
                $match: {
                    accountOwnerId: { $nin: [...excludedOwnerIds, ...inventories.map(i => i.accountOwnerId)] },
                    QuestKeys: {
                        $elemMatch: {
                            ItemType: "/Lotus/Types/Keys/OrokinMoonQuest/OrokinMoonQuestKeyChain",
                            Completed: true
                        }
                    },
                    OperatorSuits: { $elemMatch: { ItemType: "/Lotus/Powersuits/Operator/ChildOperatorSuitRemaster" } }
                }
            },
            { $sample: { size: remaining } },
            { $project: { _id: 0, accountOwnerId: 1, FocusAbility: 1, OperatorSuits: 1, CurrentLoadOutIds: 1 } }
        ]);
        inventories = inventories.concat(otherInventories);
    }
    const ownerIds = inventories.map(i => i.accountOwnerId);

    const accountsRaw = await Account.find({ _id: { $in: ownerIds } });
    const accountsMap = new Map(accountsRaw.map(a => [a._id.toString(), a]));
    const loadoutsRaw = await Loadout.find(
        { loadoutOwnerId: { $in: ownerIds } },
        { _id: 0, loadoutOwnerId: 1, OPERATOR: 1 }
    );
    const loadoutMap = new Map(loadoutsRaw.map(l => [l.loadoutOwnerId.toString(), l]));
    const resp: IAsyncMissionAssistResponce = {
        Results: []
    };

    for (const inventory of inventories) {
        const operatorDb = inventory.OperatorSuits.find(
            o => o.ItemType == "/Lotus/Powersuits/Operator/ChildOperatorSuitRemaster"
        );
        const loadout = loadoutMap.get(inventory.accountOwnerId.toString());
        const configNum =
            loadout?.OPERATOR.find(l => l._id == inventory.CurrentLoadOutIds[eLoadoutIndex.OPERATOR])?.s?.cus || 0;
        const operator: Omit<IEquipmentClient, "ItemId"> = {
            ItemType: operatorDb?.ItemType || "/Lotus/Powersuits/Operator/ChildOperatorSuitRemaster",
            Configs: operatorDb?.Configs.slice(configNum, configNum + 1) || [],
            UpgradeVer: 101
        };
        const a = accountsMap.get(inventory.accountOwnerId.toString())!;
        const focusAbility = inventory.FocusAbility || "/Lotus/Upgrades/Focus/Power/PowerFocusAbility";
        const result: IAsyncMissionAssistResult = {
            DeploymentType: focusAbilityToDeploymentType[focusAbility],
            FocusAbility: focusAbility,
            Location: payload.MissionTag, // not faithful, but game doesn't complain?
            Name: getUnicodeName(a, undefined) || "cat\uE000",
            Operator: operator
        };
        resp.Results.push(result);
    }

    while (resp.Results.length < payload.Count) {
        const focusAbilities = Object.keys(focusAbilityToDeploymentType);
        const focusAbility = focusAbilities[Math.floor(Math.random() * focusAbilities.length)];
        resp.Results.push({
            DeploymentType: focusAbilityToDeploymentType[focusAbility],
            FocusAbility: focusAbility,
            Location: payload.MissionTag,
            Name: "cat" + resp.Results.length + "\uE000",
            Operator: {
                ItemType: "/Lotus/Powersuits/Operator/ChildOperatorSuitRemaster",
                Configs: [],
                UpgradeVer: 101
            }
        });
    }

    res.json(resp);
};

interface IAsyncMissionAssistRequest {
    MissionTag: string;
    Count: number;
    Candidates: IOid[];
    ExcludedNames: string[];
}

interface IAsyncMissionAssistResult {
    DeploymentType: TDeploymentType;
    FocusAbility: string;
    Location: string;
    Name: string;
    Operator: Omit<IEquipmentClient, "ItemId">;
}

interface IAsyncMissionAssistResponce {
    Results: IAsyncMissionAssistResult[];
}

type TDeploymentType = "MADURAI" | "VAZARIN" | "ZENURIK" | "NARAMON" | "UNAIRU";

const focusAbilityToDeploymentType: Record<string, TDeploymentType> = {
    "/Lotus/Upgrades/Focus/Attack/AttackFocusAbility": "MADURAI",
    "/Lotus/Upgrades/Focus/Defense/DefenseFocusAbility": "VAZARIN",
    "/Lotus/Upgrades/Focus/Power/PowerFocusAbility": "ZENURIK",
    "/Lotus/Upgrades/Focus/Tactic/TacticFocusAbility": "NARAMON",
    "/Lotus/Upgrades/Focus/Ward/WardFocusAbility": "UNAIRU"
};
