const functions = require("firebase-functions");
import {Response} from "express";
import {db} from "./config/firebase";
import {triggerFcmNotification} from "./NotificationHelper";

enum SuccessStatusEnum {
  done = "Terminé",
  todo = "Non commencée",
  doing = "En cours"
}


type EntryType = {
  username: string,
  password: string,
  fcmToken: string,
  statName: string,
  successEventType: string
}

type Request = {
  body: EntryType,
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

const miscSuccessEvent = functions.https.onRequest(async (req: Request, res: Response) => {
  if (!req.body.successEventType || !req.body.username) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({
      message: "Missing parameter",
    });
  }

  const userStatRequest = db.collection("users").doc(req.body.username);
  const userRetrievedEntry = (await userStatRequest.get()).data() || {};

  if (req.body.successEventType == "manualScan") {
    const userSuccess = db.collection("success").doc(req.body.username);
    const userSuccessData = (await userSuccess.get()).data() || {};


    if (userSuccessData.success[1].status != SuccessStatusEnum.done) {
      userSuccessData.success[1].status = SuccessStatusEnum.done;
      userSuccess.set(userSuccessData);

      triggerFcmNotification(userRetrievedEntry.fcm_token, userSuccessData.success[1].name);
    }
  } else if (req.body.successEventType == "theme") {
    const userSuccess = db.collection("success").doc(req.body.username);
    const userSuccessData = (await userSuccess.get()).data() || {};

    if (userSuccessData.success[5].status != SuccessStatusEnum.done) {
      userSuccessData.success[5].status = SuccessStatusEnum.done;
      userSuccess.set(userSuccessData);
      triggerFcmNotification(userRetrievedEntry.fcm_token, userSuccessData.success[5].name);
    }
  }


  return res.status(200).json({
    message: "stat updated",
  });
});

export {getUserSuccess, miscSuccessEvent};
