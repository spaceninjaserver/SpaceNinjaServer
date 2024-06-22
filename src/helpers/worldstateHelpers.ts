import { ExportRegions } from "warframe-public-export-plus";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import { logger } from "../utils/logger";

export const getRandomNodes = (n: number) => {
    const nodes = Object.entries(ExportRegions).map(([key]) => {
        return {
            nodeKey: key
        };
    }); // may be filter that?
    const output: string[] = [];
    for (let i = 0; i < n; i++) {
        logger.debug(i);
        const randomIndex = Math.floor(Math.random() * nodes.length);
        output[i] = nodes[randomIndex].nodeKey;
    }
    return output;
};

export const getCurrentRotation = () => {
    const intervalMilliseconds = 2.5 * unixTimesInMs.hour;
    const rotations = ["A", "B", "C"];

    const now = new Date();
    const currentTimeMs = now.getTime();

    const intervalIndex = Math.floor(currentTimeMs / intervalMilliseconds) % 3;

    return rotations[intervalIndex];
};
