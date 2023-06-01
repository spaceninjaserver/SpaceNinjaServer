import { RequestHandler } from "express";
import getShip from "@/static/fixed_responses/getShip.json";

const getShipController: RequestHandler = (_req, res) => {
  res.json(getShip);
};

export { getShipController };
