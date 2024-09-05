export interface IOid {
    $id: string;
}

export interface IMongoDate {
    $date: {
        $numberLong: string;
    };
}
