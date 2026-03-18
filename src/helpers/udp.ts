import dgram from "node:dgram";
import { getNrsAddress } from "../services/configService.ts";
import { crc32 } from "node:zlib";

export const sendUdpMessage = (host: string, port: number, message: Buffer | string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        const socket = dgram.createSocket("udp4");
        socket.send(message, port, host, err => {
            socket.close();
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

export const sendCustomMessageToNrs = (message: string): Promise<void> => {
    const [nrsAddr, nrsPort] = getNrsAddress();
    const msgbuf = Buffer.from("\x00" + message, "utf8");
    const crc = crc32(Buffer.from("b471e49539930dc9b5a131e6247c7387A", "utf8"), crc32(msgbuf));
    return sendUdpMessage(
        nrsAddr,
        nrsPort,
        Buffer.concat([Buffer.from([0x00, crc >> 24, crc >> 16, crc >> 8, crc]), msgbuf])
    );
};
