import { ITypeCount } from "@/src/types/inventoryTypes/inventoryTypes";

export interface IOid {
    $oid: string;
}

export interface IMongoDate {
    $date: {
        $numberLong: string;
    };
}

export interface IReward {
    items: ITypeCount[];
    credits: number;
}

export type IJunctionRewards = Record<string, IReward>;
