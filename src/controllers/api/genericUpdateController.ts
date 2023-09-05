import { updateGeneric } from "@/src/services/inventoryService";
import { IGenericUpdate } from "@/src/types/genericUpdate";
import { RequestHandler } from "express";

// TODO: Nightwave evidence submission support is the only thing missing.
// TODO: Also, you might want to test this, because I definitely didn't.
const genericUpdateController: RequestHandler = async (request, response) => {
    const accountId = request.query.accountId as string;

    const [body] = String(request.body).split("\n");

    let reply = {};
    try {
        const update = JSON.parse(body) as IGenericUpdate;
        if (typeof update !== "object") {
            throw new Error("Invalid data format");
        }

        reply = await updateGeneric(update, accountId);
    } catch (err) {
        console.error("Error parsing JSON data:", err);
    }

    // Response support added for when Nightwave is supported below.
    // response.json(reply);

    response.json({});
};

export { genericUpdateController };
