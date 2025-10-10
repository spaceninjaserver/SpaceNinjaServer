import { ExportCustoms } from "warframe-public-export-plus";
import { catBreadHash } from "./stringHelpers.ts";

export const skinLookupTable: Record<number, string> = {};

for (const key of Object.keys(ExportCustoms)) {
    skinLookupTable[catBreadHash(key)] = key;
}
