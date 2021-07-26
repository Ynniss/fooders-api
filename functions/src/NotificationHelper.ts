import {Response} from "express";
const admin = require("firebase-admin");

function triggerFcmNotification(FCMToken: string, message: string) {
  const payload = {
    token: FCMToken,
    notification: {
      title: "Nouveau succès débloqué !",
      body: message,
    },
    data: {
      body: message,
    },
  };

  admin.messaging().send(payload).then((response: Response) => {
    // Response is a message ID string.
    console.log("Successfully sent message:", response);
    return {success: true};
  }).catch((error: Error) => {
    return {error: "An error occured"};
  });
}

export {triggerFcmNotification};
