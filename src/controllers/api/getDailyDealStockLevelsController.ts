import { DailyDeal } from "../../models/worldStateModel.ts";
import type { RequestHandler } from "express";

export const getDailyDealStockLevelsController: RequestHandler = async (req, res) => {
    const dailyDeal = (await DailyDeal.findOne({ StoreItem: req.query.productName }, "AmountSold"))!;
    res.json({
        StoreItem: req.query.productName,
        AmountSold: dailyDeal.AmountSold
    });
};
