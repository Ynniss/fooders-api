const functions = require("firebase-functions");
const cors = require("cors")({origin: true});
import {Response} from "express";
import * as rp from "request-promise";
import {db} from "./config/firebase";
import {triggerFcmNotification} from "./NotificationHelper";

enum SuccessStatusEnum {
  done = "Terminé",
  todo = "Non commencée",
  doing = "En cours"
}

const successEntries = {
  success: [
    {
      slug: "welcome",
      name: "Bienvenue sur Fooders !",
      description: "Se connecter pour la première fois à Fooders",
      status: SuccessStatusEnum.done,
    },
    {
      slug: "barcode1",
      name: "Aventurier du code-barre",
      description: "Saisir manuellement un code-barre pour la première fois",
      status: SuccessStatusEnum.todo,
    },
    {
      slug: "manualbarcode1",
      name: "C'est ta première fois, c'est ça ?",
      description: "scanner un produit pour la première fois",
      status: SuccessStatusEnum.todo,
    },
    {
      slug: "barcode5",
      name: "La vache, t'enchaine.",
      description: "Scanner 5 produits",
      status: SuccessStatusEnum.todo,
    },
    {
      slug: "text",
      name: "Innarrêtable.",
      description: "Scanner 10 produits",
      status: SuccessStatusEnum.todo,
    },
    {
      slug: "theme",
      name: "C'est beau, le changement.",
      description: "Changer le thème de l'application",
      status: SuccessStatusEnum.todo,
    },
  ],
  last_updated_at: Date.now(),
};

type EntryType = {
  username: string,
  password: string,
  fcmToken: string,
  statName: string,
  successEventType: string
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
              scanStat: 0,
              textStat: 0,
              photoStat: 0,
            };


            const searchForUser = db.collection("users").doc(req.body.username);
            const currentData = (await searchForUser.get()).data() || {};

            if (currentData.id != req.body.username) {
              const successCollection = db.collection("success").doc(req.body.username);
              triggerFcmNotification(req.body.fcmToken, successEntries.success[0].name);
              successCollection.set(successEntries);
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


const updateStat = functions.https.onRequest(async (req: Request, res: Response) => {
  if (!req.body.statName || !req.body.username) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({
      message: "Missing parameter",
    });
  }

  const userStatRequest = db.collection("users").doc(req.body.username);
  const userRetrievedEntry = (await userStatRequest.get()).data() || {};

  if (req.body.statName == "scanStat") {
    userRetrievedEntry.scanStat += 1;

    if (userRetrievedEntry.scanStat == 1) {
      const userSuccess = db.collection("success").doc(req.body.username);
      const userSuccessData = (await userSuccess.get()).data() || {};

      userSuccessData.success[2].status = SuccessStatusEnum.done;
      userSuccessData.success[3].status = SuccessStatusEnum.doing;
      userSuccessData.success[4].status = SuccessStatusEnum.doing;
      userSuccess.set(userSuccessData);

      triggerFcmNotification(userRetrievedEntry.fcm_token, userSuccessData.success[2].name);
    }
    if (userRetrievedEntry.scanStat == 5) {
      const userSuccess = db.collection("success").doc(req.body.username);
      const userSuccessData = (await userSuccess.get()).data() || {};

      userSuccessData.success[3].status = SuccessStatusEnum.done;
      userSuccess.set(userSuccessData);

      triggerFcmNotification(userRetrievedEntry.fcm_token, userSuccessData.success[3].name);
    }
    if (userRetrievedEntry.scanStat == 10) {
      const userSuccess = db.collection("success").doc(req.body.username);
      const userSuccessData = (await userSuccess.get()).data() || {};

      userSuccessData.success[4].status = SuccessStatusEnum.done;
      userSuccess.set(userSuccessData);

      triggerFcmNotification(userRetrievedEntry.fcm_token, userSuccessData.success[4].name);
    }
  } else if (req.body.statName == "photoStat") {
    userRetrievedEntry.photoStat += 1;
  } else if (req.body.statName == "textStat") {
    userRetrievedEntry.textStat += 1;
  }


  userStatRequest.set(userRetrievedEntry);

  return res.status(200).json({
    message: "stat updated",
  });
});


export {login, updateStat};
