const functions = require("firebase-functions");
const cors = require("cors")({origin: true});
import {Response} from "express";
import * as rp from "request-promise";
// import { db } from "./config/firebase";


type Request = {
  params: { barcode: string }
}

const getProductInformations = functions.https.onRequest((req: Request, res: Response) => {
  cors(req, res, () => {
    if (!req.params.barcode) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({
        message: "Missing parameter(s)",
      });
    }

    rp({
      uri: `https://world.openfoodfacts.org/api/v0/product/${req.params.barcode}.json`,
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
        .then((data) => {
          console.log(data);
          if (data.status_verbose == "product found") {
            res.setHeader("Content-Type", "application/json");
            return res.status(200).json({
              data: {
                code: data.code,
                properties: data.product.category_properties["ciqual_food_name:en"],
                generic_name: data.product.generic_name,
                image_front_url: data.product.image_front_url,
                image_ingredients_url: data.product.image_ingredients_url,
                image_nutrition_url: data.product.image_nutrition_url,
                ingredients_text: data.product.ingredients_text,
                nutriments: data.product.nutriments,
                product_name: data.product.product_name,
                nova_group: data.product.nova_group,
                nutriscore_grade: data.product.nutriscore_grade,
                ecoscore_grade: data.product.ecoscore_grade,
                packaging: data.product.packaging,
              },
              message: "Product found",
            });
          }

          res.setHeader("Content-Type", "application/json");
          return res.status(400).json({
            message: "Product not found. You might want to add it.",
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

export {getProductInformations};
