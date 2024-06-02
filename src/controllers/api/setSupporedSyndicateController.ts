import { updateSyndicate } from "@/src/services/inventoryService";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const setSupportedSyndicateController: RequestHandler = async (request, response) => {
    const accountId = request.query.accountId as string;
    const syndicate = request.query.syndicate as string;

    await updateSyndicate(syndicate, accountId);

    response.json({});
};

export { setSupportedSyndicateController };
