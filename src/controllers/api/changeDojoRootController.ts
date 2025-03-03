import { RequestHandler } from "express";
import { getDojoClient, getGuildForRequest } from "@/src/services/guildService";
import { logger } from "@/src/utils/logger";
import { IDojoComponentDatabase } from "@/src/types/guildTypes";
import { Types } from "mongoose";

export const changeDojoRootController: RequestHandler = async (req, res) => {
    const guild = await getGuildForRequest(req);
    // At this point, we know that a member of the guild is making this request. Assuming they are allowed to change the root.

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

    // Don't even ask me why this is needed because I don't know either
    const stack: INode[] = [newRoot];
    let i = 0;
    const idMap: Record<string, Types.ObjectId> = {};
    while (stack.length != 0) {
        const top = stack.shift()!;
        idMap[top.component._id.toString()] = new Types.ObjectId(
            (++i).toString(16).padStart(8, "0") + top.component._id.toString().substr(8)
        );
        top.children.forEach(x => stack.push(x));
    }
    guild.DojoComponents.forEach(x => {
        x._id = idMap[x._id.toString()];
        if (x.pi) {
            x.pi = idMap[x.pi.toString()];
        }
    });

    logger.debug("New tree:\n" + treeToString(newRoot));

    await guild.save();

    res.json(getDojoClient(guild, 0));
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
