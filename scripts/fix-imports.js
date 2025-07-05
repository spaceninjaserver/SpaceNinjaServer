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
    const fixedContent = content.replaceAll(/} from "([^"]+)";/g, (sub, importPath) => {
        if (!importPath.startsWith("@/")) {
            const fullImportPath = path.resolve(dir, importPath);
            if (fs.existsSync(fullImportPath + ".ts")) {
                const relative = path.relative(root, fullImportPath).replace(/\\/g, "/");
                const fixedPath = "@/" + relative;
                console.log(`${importPath} -> ${fixedPath}`);
                return sub.split(importPath).join(fixedPath);
            }
        }
        return sub;
    });
    if (content != fixedContent) {
        fs.writeFileSync(file, fixedContent, "utf8");
    }
}
