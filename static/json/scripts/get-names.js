/* eslint-disable */
import mods from './Arch-Melee.json' assert { type: "json" };
import fs from 'fs';

const formatedMods = {};
for (let index = 0; index < mods.length; index++) {
    const {name, uniqueName} = mods[index];
    formatedMods[name] = uniqueName;
}

const fileBody =  JSON.stringify(formatedMods);
fs.writeFile("./arch-melee-names.json", fileBody, err => {
    if (err) {
        console.log(err.message);

        throw err;
    }

    console.log('data written to file');
});