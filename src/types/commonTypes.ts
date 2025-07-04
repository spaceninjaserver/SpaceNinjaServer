export interface IOid {
    $oid: string;
}

export interface IOidWithLegacySupport {
    $oid?: string;
    $id?: string;
}

export interface IMongoDate {
    $date: {
        $numberLong: string;
    };
}

export interface ITypeCount {
    ItemType: string;
    ItemCount: number;
}

export interface IReward {
    items: ITypeCount[];
    credits: number;
}

export type IJunctionRewards = Record<string, IReward>;
