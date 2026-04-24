import { packHubDatagram } from "../helpers/udp.ts";
import { config, type IHubServer, type TRegionId } from "./configService.ts";
import dgram from "node:dgram";

export interface IHubInstance {
    Players: number;
    Hub: string;
}

export const hubInstances: Record<string, IHubInstance> = {};

export interface IHubServerStats {
    Players: number;
    Instances: number;
}

export const getAllHubServerStats = (): Record<string, IHubServerStats> => {
    const stats: Record<string, IHubServerStats> = {};
    for (const level of Object.values(hubInstances)) {
        stats[level.Hub] ??= { Players: 0, Instances: 0 };
        stats[level.Hub].Players += level.Players;
        stats[level.Hub].Instances += 1;
    }
    return stats;
};

export const pickHubServer = (regionId: TRegionId): IHubServer => {
    let bestServer = { address: "%THIS_MACHINE%:6952" };
    let bestServerScore = Number.MAX_SAFE_INTEGER;
    const allStats = getAllHubServerStats();
    for (const server of config.hubServers!) {
        const stats = allStats[server.address] as IHubServerStats | undefined;
        const score = (stats?.Players ?? 0) + (stats?.Instances ?? 0) + (server.regions?.includes(regionId) ? 0 : 1000);
        if (score < bestServerScore) {
            bestServer = server;
            bestServerScore = score;
        }
    }
    return bestServer;
};

export const broadcastControlMessages = (level: string, msgs: string[]): void => {
    const instance = hubInstances[level] as IHubInstance | undefined;
    if (instance) {
        instance.Players += 1; // to account for the hubDropped that we will cause here

        const [host, port] = instance.Hub.replaceAll("%THIS_MACHINE%", "127.0.0.1").split(":");
        const socket = dgram.createSocket("udp4");

        socket.send(
            packHubDatagram(
                Buffer.concat([
                    Buffer.from([0xb4, 0x03, 0x18, 0x00, 0x00, 0x00]),
                    Buffer.from("000000000000000000000000", "utf8"),
                    Buffer.alloc(8),
                    Buffer.from([0x03, 0x00, 0x00, 0x00]),
                    Buffer.from("SNS", "utf8"),
                    Buffer.alloc(4),
                    Buffer.from([level.length, 0x00, 0x00, 0x00]),
                    Buffer.from(level, "utf8")
                ])
            ),
            parseInt(port),
            host
        );
        socket.once("message", msg => {
            const peerId = msg.readUInt16LE(13);
            for (const msg of msgs) {
                const header = Buffer.alloc(8);
                header.writeUInt8(0xb4, 0);
                header.writeUInt8(0x07, 1);
                header.writeUInt16LE(peerId, 2);
                header.writeUInt32LE(msg.length, 4);
                socket.send(packHubDatagram(Buffer.concat([header, Buffer.from(msg, "utf8")])), parseInt(port), host);
            }
        });
    }
};
