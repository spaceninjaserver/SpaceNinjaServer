import { IMongoDate, IOid } from "@/src/types/commonTypes";
import { Types } from "mongoose";

export const toOid = (objectId: Types.ObjectId): IOid => {
    return { $oid: objectId.toString() } satisfies IOid;
};

export const toMongoDate = (date: Date): IMongoDate => {
    return { $date: { $numberLong: date.getTime().toString() } };
};
