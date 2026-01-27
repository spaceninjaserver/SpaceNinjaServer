import type { RequestHandler } from "express";

// Arbiter Dojo endpoints, not really used by us as we don't provide a ContentURL.

export const dojoController: RequestHandler = (_req, res) => {
    res.json("-1"); // Tell client to use authorised request.
};

export const setDojoURLController: RequestHandler = (_req, res) => {
    res.end();
};
