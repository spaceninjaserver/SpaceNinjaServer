export interface Oid {
    $oid: string;
}

export interface BSONDate {
    $date: {
        $numberLong: string;
    };
}
