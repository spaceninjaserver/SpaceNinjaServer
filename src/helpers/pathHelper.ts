import path from "path";

export const rootDir = path.join(import.meta.dirname, "../..");
export const repoDir = path.basename(rootDir) != "build" ? rootDir : path.join(rootDir, "..");
