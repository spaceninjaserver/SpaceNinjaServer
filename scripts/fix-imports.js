/* eslint-disable */
const fs = require("fs");
const path = require("path");

const root = path.join(process.cwd(), "..");

function listFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let results = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(listFiles(fullPath));
        } else {
            results.push(fullPath);
        }
    }
    return results;
}

const files = listFiles(path.join(root, "src"));

for (const file of files) {
    let content;
    try {
        content = fs.readFileSync(file, "utf8");
    } catch (e) {
        continue;
    }
    const dir = path.dirname(file);
    const fixedContent = content.replaceAll(/from "([^"]+)";/g, (sub, importPath) => {
        if (importPath.startsWith("@/") || importPath.startsWith(".")) {
            const base = importPath.startsWith("@/")
                ? path.join(root, importPath.slice(2))
                : path.resolve(dir, importPath);
            let target = base;

            if (fs.existsSync(target)) {
                const stat = fs.statSync(target);
                if (stat.isDirectory()) {
                    if (fs.existsSync(path.join(target, "index.ts"))) {
                        target = path.join(target, "index.ts");
                    } else {
                        return sub;
                    }
                } else {
                    const ext = path.extname(target);
                    if (!ext) {
                        target += ".ts";
                    }
                }
            } else if (fs.existsSync(target + ".ts")) {
                target += ".ts";
            } else if (fs.existsSync(path.join(target, "index.ts"))) {
                target = path.join(target, "index.ts");
            } else {
                return sub;
            }

            let relative = path.relative(dir, target).replace(/\\/g, "/");
            if (!path.extname(relative)) {
                relative += ".ts";
            }
            if (!relative.startsWith(".")) {
                relative = "./" + relative;
            }
            console.log(`${importPath} -> ${relative}`);
            return sub.split(importPath).join(relative);
        }
        return sub;
    });
    if (content != fixedContent) {
        fs.writeFileSync(file, fixedContent, "utf8");
    }
}
