import { RequestHandler } from "express";
import path from "path";
import fs from "fs";
const rootDir = path.join(__dirname, "../../..");

const updateConfigData: RequestHandler = (req) => {
    const updateSettingsData = req.body;
    
    fs.writeFile(path.join(rootDir, "config.json"), updateSettingsData, function(err:any) {
        if(err) {
            return console.log(err);
        }
    });
};

export { updateConfigData };
