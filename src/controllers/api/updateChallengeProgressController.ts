import { RequestHandler } from "express";

const updateChallengeProgressController: RequestHandler = (_request, response) => {
  response.sendStatus(200);
};

export { updateChallengeProgressController };
