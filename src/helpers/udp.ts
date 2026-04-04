import dgram from "node:dgram";
import { getNrsAddresses } from "../services/configService.ts";
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

export const sendCustomMessageToNrs = async (message: string): Promise<void> => {
    const msgbuf = Buffer.from("\x00" + message, "utf8");
    const msg = addCompressionAndIntegrityToDatagram(msgbuf);
    for (const [nrsAddr, nrsPort] of getNrsAddresses()) {
        await sendUdpMessage(nrsAddr, nrsPort, msg);
    }
};

const SALT_BUF = Buffer.from("b471e49539930dc9b5a131e6247c7387A", "utf8");

const addCompressionAndIntegrityToDatagram = (msg: Buffer): Buffer => {
    const crc = crc32(SALT_BUF, crc32(msg));
    return Buffer.concat([Buffer.from([0x00, crc >> 24, crc >> 16, crc >> 8, crc]), msg]);
};

export const packHubDatagram = (msg: Buffer): Buffer => {
    const header = Buffer.alloc(6);
    header.writeUInt32LE(0x80000000, 0);
    header.writeUInt16LE(msg.length, 4);
    return addCompressionAndIntegrityToDatagram(Buffer.concat([header, msg]));
};
