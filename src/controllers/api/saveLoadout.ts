import { Inventory } from "@/src/models/inventoryModel";
import { RequestHandler } from "express";
import util from "util";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const saveLoadoutController: RequestHandler = async (req, res) => {
    const body = JSON.parse(req.body);
    console.log(util.inspect(body, { showHidden: false, depth: null, colors: true }));

    res.sendStatus(200);
};

export { saveLoadoutController };
