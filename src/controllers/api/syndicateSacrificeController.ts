import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { syndicateSacrifice } from "@/src/services/inventoryService";
import { ISyndicateSacrifice } from "@/src/types/syndicateTypes";
import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const syndicateSacrificeController: RequestHandler = async (request, response) => {
    const accountId = await getAccountIdForRequest(request);
    const update = getJSONfromString(String(request.body)) as ISyndicateSacrifice;
    let reply = {};
    try {
        if (typeof update !== "object") {
            throw new Error("Invalid data format");
        }

        reply = await syndicateSacrifice(update, accountId);
    } catch (err) {
        console.error("Error parsing JSON data:", err);
    }

    response.json(reply);
};

export { syndicateSacrificeController };
