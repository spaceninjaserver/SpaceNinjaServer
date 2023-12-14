import { updateGeneric } from "@/src/services/inventoryService";
import { IGenericUpdate } from "@/src/types/genericUpdate";
import { RequestHandler } from "express";

// TODO: Nightwave evidence submission support is the only thing missing.
// TODO: this was added by someone without testing.  It may not work.
// eslint-disable-next-line @typescript-eslint/no-misused-promises
const genericUpdateController: RequestHandler = async (_request, response) => {
    // const accountId = request.query.accountId as string;

    // const [body] = String(request.body).split("\n");

    // let reply = {};
    // try {
    //     const update = JSON.parse(body) as IGenericUpdate;
    //     if (typeof update !== "object") {
    //         throw new Error("Invalid data format");
    //     }

    //     reply = await updateGeneric(update, accountId);
    // } catch (err) {
    //     console.error("Error parsing JSON data:", err);
    // }

    response.json({});
};

export { genericUpdateController };
