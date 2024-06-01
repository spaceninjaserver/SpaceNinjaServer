// Hooks node to support require from "@/" paths for `npm run build && npm run start`.
// Based on https://github.com/dividab/tsconfig-paths

/* eslint-disable */
const Module = require("module");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request: string, _parent: any): string {
    if (request.substring(0, 2) == "@/") {
        const modifiedArguments = [process.cwd() + "/build/" + request.substr(2), ...[].slice.call(arguments, 1)]; // Passes all arguments. Even those that is not specified above.
        return originalResolveFilename.apply(this, modifiedArguments);
    }
    return originalResolveFilename.apply(this, arguments);
};
