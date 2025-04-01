import path from "path";
import fs from "fs";
import { repoDir } from "@/src/helpers/pathHelper";

interface IBuildConfig {
    version: string;
    buildLabel: string;
    matchmakingBuildId: string;
}

export const buildConfig: IBuildConfig = {
    version: "",
    buildLabel: "",
    matchmakingBuildId: ""
};

const buildConfigPath = path.join(repoDir, "static/data/buildConfig.json");
if (fs.existsSync(buildConfigPath)) {
    Object.assign(buildConfig, JSON.parse(fs.readFileSync(buildConfigPath, "utf-8")) as IBuildConfig);
}
