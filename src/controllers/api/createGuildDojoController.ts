import { RequestHandler } from "express";

export const createGuildDojoController: RequestHandler = (req, res) => {
    // req.body.toString() -> {"SpawnComponent":{"id":{"$oid":"000000000000000000000000"},"pf":"/Lotus/Levels/ClanDojo/DojoHall.level","ppf":""}}

    // I'm guessing the response is same as getGuildDojo.php, which responds like this for a fresh dojo:
    res.json({
        _id: { $oid: req.params.guildId },
        Name: "If you can read this in-game, tell me I need to fetch the clan name from the DB, lol.",
        Tier: 1,
        FixedContributions: true,
        DojoRevision: 1,
        RevisionTime: Math.round(Date.now() / 1000),
        Energy: 5,
        Capacity: 100,
        DojoRequestStatus: 0,
        DojoComponents: [
            {
                pf: "/Lotus/Levels/ClanDojo/DojoHall.level",
                ppf: "",
                id: { $oid: "000000000000000000000000" },
                CompletionTime: { $date: { $numberLong: "" + Date.now() } },
                DecoCapacity: 600
            }
        ]
    });
};
