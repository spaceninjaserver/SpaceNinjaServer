import fsPromises from "fs/promises";
import { config, configPath } from "./configService.ts";

let amnesia = false;

export const saveConfig = async (): Promise<void> => {
    amnesia = true;
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2));
};

export const shouldReloadConfig = (): boolean => {
    if (amnesia) {
        amnesia = false;
        return false;
    }
    return true;
};
