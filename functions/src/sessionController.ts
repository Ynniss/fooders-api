const functions = require("firebase-functions");
const cors = require("cors")({origin: true});
import {Response} from "express";
import * as rp from "request-promise";
import {db} from "./config/firebase";
import {triggerFcmNotification} from "./NotificationHelper";

type EntryType = {
  username: string,
  password: string,
  fcmToken: string,
}

type Request = {
  body: EntryType,
  params: { entryId: string }
}

const login = functions.https.onRequest((req: Request, res: Response) => {
  cors(req, res, () => {
    if (!req.body.username || !req.body.password || !req.body.fcmToken) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({
        message: "Missing parameter(s)",
      });
    }

    rp({
      uri: `https://world.openfoodfacts.org/cgi/product_jqm2.pl//?code=0048151623426&user_id=${req.body.username}&password=${req.body.password}&product_name=KIRI%20GOUTER%20280G%208%20PORTIONS&quantity=282%20g&stores=Intermarche&nutriment_energy=500&nutriment_energy_unit=kJ&nutrition_data_per=serving`,
      qs: {
        format: "json",
      },
      headers: {
        "User-Agent": "Request-Promise",
        "Connection": "keep-alive",
        "Content-Type": "application/json",
      },
      json: true, // Automatically parses the JSON string in the response
    })
        .then(async (data) => {
          console.log(data);
          if (data.status_verbose) {
          // We store the user in database, or just update timestamp, if already stored

            const userCollection = db.collection("users").doc(req.body.username);
            const userEntry = {
              id: req.body.username,
              last_updated_at: Date.now(),
              fcm_token: req.body.fcmToken,
            };


            const searchForUser = db.collection("users").doc(req.body.username);
            const currentData = (await searchForUser.get()).data() || {};

            if (currentData.id != req.body.username) {
              const successEntry = {
                unlocked: [
                  "welcome",
                ],
                last_updated_at: Date.now(),
              };

              const successCollection = db.collection("success").doc(req.body.username);
              triggerFcmNotification(req.body.fcmToken, "Bienvenue !");
              successCollection.set(successEntry);
            }

            userCollection.set(userEntry);

            res.setHeader("Content-Type", "application/json");
            return res.status(200).json({
              message: "login successful",
            });
          }

          res.setHeader("Content-Type", "application/json");
          return res.status(401).json({
            message: "Login failed. Check your credentials.",
          });
        })
        .catch((err) => {
          res.setHeader("Content-Type", "application/json");
          return res.status(500).json({
            error: err,
          });
        });
    return;
  });
});

export {login};
