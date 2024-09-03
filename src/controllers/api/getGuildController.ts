import { RequestHandler } from "express";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Guild } from "@/src/models/guildModel";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { toOid } from "@/src/helpers/inventoryHelpers";

const getGuildController: RequestHandler = async (_, res) => {
    res.json({});
};

export { getGuildController };
