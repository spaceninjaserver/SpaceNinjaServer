import type { RequestHandler } from "express";
import { getDojoClient, getGuildForRequestEx, hasAccessToDojo, hasGuildPermission } from "@/src/services/guildService";
import { logger } from "@/src/utils/logger";
import type { IDojoComponentDatabase } from "@/src/types/guildTypes";
import { GuildPermission } from "@/src/types/guildTypes";
import { Types } from "mongoose";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

export const changeDojoRootController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Architect))) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }

    // Example POST body: {"pivot":[0, 0, -64],"components":"{\"670429301ca0a63848ccc467\":{\"R\":[0,0,0],\"P\":[0,3,32]},\"6704254a1ca0a63848ccb33c\":{\"R\":[0,0,0],\"P\":[0,9.25,-32]},\"670429461ca0a63848ccc731\":{\"R\":[-90,0,0],\"P\":[-47.999992370605,3,16]}}"}
    if (req.body) {
        logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        throw new Error("dojo reparent operation should not need deco repositioning"); // because we always provide SortId
    }

    const idToNode: Record<string, INode> = {};
    guild.DojoComponents.forEach(x => {
        idToNode[x._id.toString()] = {
            component: x,
            parent: undefined,
            children: []
        };
    });

    let oldRoot: INode | undefined;
    guild.DojoComponents.forEach(x => {
        const node = idToNode[x._id.toString()];
        if (x.pi) {
            idToNode[x.pi.toString()].children.push(node);
            node.parent = idToNode[x.pi.toString()];
        } else {
            oldRoot = node;
        }
    });
    logger.debug("Old tree:\n" + treeToString(oldRoot!));

    const newRoot = idToNode[req.query.newRoot as string];
    recursivelyTurnParentsIntoChildren(newRoot);
    newRoot.component.pi = undefined;
    newRoot.component.op = undefined;
    newRoot.component.pp = undefined;
    newRoot.parent = undefined;

    // Set/update SortId in top-to-bottom order
    const stack: INode[] = [newRoot];
    while (stack.length != 0) {
        const top = stack.shift()!;
        top.component.SortId = new Types.ObjectId();
        top.children.forEach(x => stack.push(x));
    }

    logger.debug("New tree:\n" + treeToString(newRoot));

    await guild.save();

    res.json(await getDojoClient(guild, 0));
};

interface INode {
    component: IDojoComponentDatabase;
    parent: INode | undefined;
    children: INode[];
}

const treeToString = (root: INode, depth: number = 0): string => {
    let str = " ".repeat(depth * 4) + root.component.pf + " (" + root.component._id.toString() + ")\n";
    root.children.forEach(x => {
        str += treeToString(x, depth + 1);
    });
    return str;
};

const recursivelyTurnParentsIntoChildren = (node: INode): void => {
    if (node.parent!.parent) {
        recursivelyTurnParentsIntoChildren(node.parent!);
    }

    node.parent!.component.pi = node.component._id;
    node.parent!.component.op = node.component.pp;
    node.parent!.component.pp = node.component.op;

    node.parent!.parent = node;
    node.parent!.children.splice(node.parent!.children.indexOf(node), 1);
    node.children.push(node.parent!);
};
