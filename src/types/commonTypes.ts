export interface IOid {
    $oid: string;
}

export interface IMongoDate {
    $date: {
        $numberLong: string;
    };
}
