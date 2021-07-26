const functions = require("firebase-functions");
import {Response} from "express";
import {db} from "./config/firebase";


type Request = {
  params: { username: string }
}

const getUserSuccess = functions.https.onRequest(async (req: Request, res: Response) => {
  if (!req.params.username) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({
      message: "Missing parameter",
    });
  }

  const userSuccessRequest = db.collection("success").doc(req.params.username);
  const userSuccessResponse = (await userSuccessRequest.get()).data() || {};

  return res.status(200).json({
    data: userSuccessResponse,
  });
});

export {getUserSuccess};
