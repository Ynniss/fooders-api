import * as functions from "firebase-functions";
import * as express from "express";
import {
  addEntry, getAllEntries, deleteEntry,
  updateEntry,
} from "./entryController";
import {login} from "./sessionController";

const endpointRoot = "/fooders/api";
const app = express();
// app.get("/", (req, res) => res.status(200).send("Hey there!"));
app.get(`${ endpointRoot }/ping`, (req, res) => res.status(200).send("pong"));
app.post(`${ endpointRoot }/entries`, addEntry);
app.get(`${ endpointRoot }/entries`, getAllEntries);
app.patch(`${ endpointRoot }/entries/:entryId`, updateEntry);
app.delete(`${ endpointRoot }/entries/:entryId`, deleteEntry);

// session controller
app.post(`${ endpointRoot }/login`, login);

exports.app = functions.https.onRequest(app);
