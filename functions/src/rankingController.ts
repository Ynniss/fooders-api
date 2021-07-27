const functions = require("firebase-functions");
import {Response} from "express";
import {db} from "./config/firebase";


type EntryType = {
  username: string,
  photoStat: number,
  scanStat: number,
  textStat: number,
  rankingType: string
}

type Request = {
  body: EntryType,
  params: { entryId: string }
}

const getRankings = functions.https.onRequest(async (req: Request, res: Response) => {
  try {
    const allRankings: EntryType[] = [];
    const querySnapshot = await db.collection("users").get();
    querySnapshot.forEach((doc: any) => allRankings.push(
        doc.data()));

    let photoRanking: EntryType[] = [];
    allRankings.forEach((val) => photoRanking.push(Object.assign({}, val)));
    photoRanking = photoRanking.sort(function(a, b) {
      return b.photoStat - a.photoStat;
    });

    photoRanking.forEach((element) =>
      element.rankingType = "photo"
    );

    let textRanking : EntryType[] = [];
    allRankings.forEach((val) => textRanking.push(Object.assign({}, val)));

    textRanking = textRanking.sort(function(a, b) {
      return b.textStat - a.textStat;
    });

    textRanking.forEach((element) =>
      element.rankingType = "text"
    );


    let scanRanking : EntryType[] = [];
    allRankings.forEach((val) => scanRanking.push(Object.assign({}, val)));

    scanRanking = scanRanking.sort(function(a, b) {
      return b.scanStat - a.scanStat;
    });

    scanRanking.forEach((element) =>
      element.rankingType = "scan"
    );

    return res.status(200).json(
        {photoRanking: photoRanking, scanRanking: scanRanking, textRanking: textRanking});
  } catch (error) {
    return res.status(500).json(error.message);
  }
});


export {getRankings};
