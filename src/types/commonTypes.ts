export interface Oid {
    $oid: string;
}

export interface IMongoDate {
    $date: {
        $numberLong: string;
    };
}
