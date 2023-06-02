import { RequestHandler } from "express";
import modularWeaponSale from "@/static/fixed_responses/modularWeaponSale.json";

const modularWeaponSaleController: RequestHandler = (_req, res) => {
    res.json(modularWeaponSale);
};

export { modularWeaponSaleController };
