import * as functions from "firebase-functions";
import * as express from "express";
import {
  addEntry, getAllEntries, deleteEntry,
  updateEntry,
} from "./entryController";
import {login} from "./sessionController";
import {getProductInformations} from "./productController";
import {getUserSuccess} from "./successController";

const endpointRoot = "/fooders/api";
const app = express();
// app.get("/", (req, res) => res.status(200).send("Hey there!"));
app.get(`${endpointRoot}/ping`, (req, res) => res.status(200).send("pong"));
app.post(`${endpointRoot}/entries`, addEntry);
app.get(`${endpointRoot}/entries`, getAllEntries);
app.patch(`${endpointRoot}/entries/:entryId`, updateEntry);
app.delete(`${endpointRoot}/entries/:entryId`, deleteEntry);

// session controller
app.post(`${endpointRoot}/login`, login);

// product controller
app.get(`${endpointRoot}/product/:barcode`, getProductInformations);

// success controller
app.get(`${endpointRoot}/user/success/:username`, getUserSuccess);


exports.app = functions.https.onRequest(app);
