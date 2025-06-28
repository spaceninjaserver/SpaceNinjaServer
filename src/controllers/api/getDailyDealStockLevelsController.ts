import { DailyDeal } from "@/src/models/worldStateModel";
import { RequestHandler } from "express";

export const getDailyDealStockLevelsController: RequestHandler = async (req, res) => {
    const dailyDeal = (await DailyDeal.findOne({ StoreItem: req.query.productName }, "AmountSold"))!;
    res.json({
        StoreItem: req.query.productName,
        AmountSold: dailyDeal.AmountSold
    });
};
