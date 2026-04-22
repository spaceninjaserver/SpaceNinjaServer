import { toOid } from "../helpers/inventoryHelpers.ts";
import type { IPendingTradeClient, IPendingTradeDatabase } from "../types/tradingTypes.ts";

export const exportTrade = (trade: IPendingTradeDatabase, us: "a" | "b"): IPendingTradeClient => {
    const them = us == "a" ? "b" : "a";
    return {
        ItemId: toOid(trade[them]),
        Giving: trade[`${us}Offer`],
        Getting: trade[`${them}Offer`],
        SelfReady: trade[`${us}Ready`],
        BuddyReady: trade[`${them}Ready`],
        State: trade[`${us}Accepted`] ? (trade[`${them}Accepted`] ? 4 : 3) : 2,
        Revision: trade.revision,
        ClanTax: trade.clanTax
    };
};
