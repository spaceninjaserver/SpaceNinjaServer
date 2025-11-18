import path from "path";
import fs from "fs";
import { repoDir } from "../helpers/pathHelper.ts";

interface IBuildConfig {
    version: string;
    buildLabel: string;
}

export const buildConfig: IBuildConfig = {
    version: "",
    buildLabel: ""
};

const buildConfigPath = path.join(repoDir, "static/data/buildConfig.json");
if (fs.existsSync(buildConfigPath)) {
    Object.assign(buildConfig, JSON.parse(fs.readFileSync(buildConfigPath, "utf-8")) as IBuildConfig);
}
