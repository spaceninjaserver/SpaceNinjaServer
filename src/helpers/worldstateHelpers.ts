import { ExportRegions } from "warframe-public-export-plus";
import { unixTimesInMs } from "@/src/constants/timeConstants";

export const getRandomNodes = (n: number): string[] => {
    const nodes = Object.entries(ExportRegions)
        .filter(([_, node]) => {
            return (
                node.missionIndex &&
                (node.nodeType === 0 || node.nodeType === 4) &&
                node.systemIndex &&
                node.missionName &&
                (!node.missionName.includes("Archwing") || !node.missionName.includes("Railjack"))
            );
        })
        .map(([key]) => {
            return {
                nodeKey: key
            };
        });
    const output: string[] = [];
    for (let i = 0; i < n; i++) {
        const randomIndex = Math.floor(Math.random() * nodes.length);
        output[i] = nodes[randomIndex].nodeKey;
    }
    return output;
};

export const getCurrentRotation = (): string => {
    const intervalMilliseconds = 2.5 * unixTimesInMs.hour;
    const rotations = ["A", "B", "C"];

    const now = new Date();
    const currentTimeMs = now.getTime();

    const intervalIndex = Math.floor(currentTimeMs / intervalMilliseconds) % 3;

    return rotations[intervalIndex];
};

export const getRandomRotation = (): string => {
    const rotations = ["A", "B", "C"];
    const randomIndex = Math.floor(Math.random() * rotations.length);
    return rotations[randomIndex];
};
