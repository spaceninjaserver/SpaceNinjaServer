import { RequestHandler } from "express";
import inbox from "@/static/fixed_responses/inbox.json";

const inboxController: RequestHandler = (_req, res) => {
    res.json(inbox);
};

export { inboxController };
