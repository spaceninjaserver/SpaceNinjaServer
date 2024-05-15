import { RequestHandler } from "express";

export const getGuildLogController: RequestHandler = (_req, res) => {
    res.json({
        RoomChanges: [],
        TechChanges: [],
        RosterActivity: [],
        StandingsUpdates: [],
        ClassChanges: []
    });
};
