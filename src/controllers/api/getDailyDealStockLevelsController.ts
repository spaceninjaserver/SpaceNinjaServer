import { RequestHandler } from "express";

export const getDailyDealStockLevelsController: RequestHandler = (req, res) => {
    res.json({
        StoreItem: req.query.productName,
        AmountSold: 0
    });
};
