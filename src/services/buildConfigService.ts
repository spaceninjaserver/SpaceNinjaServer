import path from "path";
import fs from "fs";

const rootDir = path.join(__dirname, "../..");
const repoDir = path.basename(rootDir) == "build" ? path.join(rootDir, "..") : rootDir;
const buildConfigPath = path.join(repoDir, "static/data/buildConfig.json");
export const buildConfig = JSON.parse(fs.readFileSync(buildConfigPath, "utf-8")) as IBuildConfig;

interface IBuildConfig {
    version: string;
    buildLabel: string;
    matchmakingBuildId: string;
}
