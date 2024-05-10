import { RequestHandler } from "express";

export const createGuildDojoController: RequestHandler = (_req, res) => {
    // _req.body.toString() -> {"SpawnComponent":{"id":{"$oid":"000000000000000000000000"},"pf":"/Lotus/Levels/ClanDojo/DojoHall.level","ppf":""}}

    // I'm guessing the response is same as getGuildDojo.php, but I have yet to log one of those for a fresh clan.
    // This works to make the client load in, but can't build new rooms.
    res.json({
        DojoComponents: [{ pf: "/Lotus/Levels/ClanDojo/DojoHall.level", ppf: "" }]
    });
};
