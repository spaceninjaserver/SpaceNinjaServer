import path from "path";
import fs from "fs";

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

const rootDir = path.join(__dirname, "../..");
const repoDir = path.basename(rootDir) == "build" ? path.join(rootDir, "..") : rootDir;
const buildConfigPath = path.join(repoDir, "static/data/buildConfig.json");
if (fs.existsSync(buildConfigPath)) {
    Object.assign(buildConfig, JSON.parse(fs.readFileSync(buildConfigPath, "utf-8")) as IBuildConfig);
}
