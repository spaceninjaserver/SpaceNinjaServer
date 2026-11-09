export interface IDbListData {
    names: string[];
    entries: { name: string; value?: string }[]; // what's in the list now
}

export type TDbListUpdate = { name: string; value?: string } | { name: string; remove: true };
