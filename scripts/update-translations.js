// Based on https://onlyg.it/OpenWF/Translations/src/branch/main/update.php
// Converted via ChatGPT-4o

/* eslint-disable */
const fs = require("fs");

function extractStrings(content) {
    const regex = /([a-zA-Z0-9_]+): `([^`]*)`,/g;
    let matches;
    const strings = {};
    while ((matches = regex.exec(content)) !== null) {
        strings[matches[1]] = matches[2];
    }
    return strings;
}

const source = fs.readFileSync("../static/webui/translations/en.js", "utf8");
const sourceStrings = extractStrings(source);
const sourceLines = source.substring(0, source.length - 1).split("\n");

fs.readdirSync("../static/webui/translations").forEach(file => {
    if (fs.lstatSync(`../static/webui/translations/${file}`).isFile() && file !== "en.js") {
        const content = fs.readFileSync(`../static/webui/translations/${file}`, "utf8");
        const targetStrings = extractStrings(content);
        const contentLines = content.split("\n");

        const fileHandle = fs.openSync(`../static/webui/translations/${file}`, "w");
        fs.writeSync(fileHandle, contentLines[0] + "\n");

        sourceLines.forEach(line => {
            const strings = extractStrings(line);
            if (Object.keys(strings).length > 0) {
                Object.entries(strings).forEach(([key, value]) => {
                    if (targetStrings.hasOwnProperty(key) && !targetStrings[key].startsWith("[UNTRANSLATED] ")) {
                        fs.writeSync(fileHandle, `    ${key}: \`${targetStrings[key]}\`,\n`);
                    } else {
                        fs.writeSync(fileHandle, `    ${key}: \`[UNTRANSLATED] ${value}\`,\n`);
                    }
                });
            } else {
                fs.writeSync(fileHandle, line + "\n");
            }
        });

        fs.closeSync(fileHandle);
    }
});
