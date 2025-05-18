import path from "path";

export const rootDir = path.join(__dirname, "../..");
export const isDev = path.basename(rootDir) != "build";
export const repoDir = isDev ? rootDir : path.join(rootDir, "..");
