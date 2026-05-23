import fs from "fs";
import path from "path";

const availableLangs = ["en", "de", "es", "fr", "it", "ja", "ko", "pl", "pt", "ru", "tc", "th", "tr", "uk", "zh"];
const inputDir = path.join("../../warframe-languages-bin-data/");
const outputDir = path.join("../static/fixed_responses/supplementalDict/");
const indexPath = path.join(outputDir, "index.json");
const keys = JSON.parse(fs.readFileSync(indexPath, "utf8")).sort();

function extractLocalizedStrings(langs) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    if (!fs.existsSync(inputDir)) {
        console.error(`Missing directory: ${inputDir}`);
        process.exit(1);
    }

    for (const lang of langs) {
        const filename = path.join(inputDir, `${lang}.json`);
        if (!fs.existsSync(filename)) {
            console.warn(`Missing file: ${filename}`);
            continue;
        }

        const content = fs.readFileSync(filename, "utf8");
        const data = JSON.parse(content);
        const output = {};
        for (const key of keys) {
            if (data[key]) {
                output[key] = data[key];
            }
        }
        const outputFile = path.join(outputDir, `${lang}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(output, null, "  ") + "\n", "utf8");
        console.log(`Saved: ${outputFile}`);
    }
}

extractLocalizedStrings(availableLangs);
