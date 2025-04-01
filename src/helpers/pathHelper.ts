import path from "path";

export const rootDir = path.join(__dirname, "../..");
export const repoDir = path.basename(rootDir) == "build" ? path.join(rootDir, "..") : rootDir;
