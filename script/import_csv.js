import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import csv from "csv-parser";

const serviceAccount = JSON.parse(
  fs.readFileSync("./script/serviceAccountKey.json", "utf8"),
);

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = getFirestore(app);

const results = [];

fs.createReadStream("./script/pokemon_card_price_data.csv")
  .pipe(csv())
  .on("data", (data) => results.push(data))
  .on("end", async () => {
    console.log(
      `Parsed ${results.length} rows from CSV, uploading to Firestore...`,
    );

    let batch = firestore.batch();
    let count = 0;

    for (const row of results) {
      const docRef = firestore.collection("pokemon_cards").doc(); // auto-generated ID
      const data = {
        cardSet: row.Card_Set,
        cardName: row.Card_Name,
        ungradedPrice: row.Ungraded_Price
          ? parseFloat(row.Ungraded_Price)
          : null,
        psa9Price: row.PSA9_Price ? parseFloat(row.PSA9_Price) : null,
        psa10Price: row.PSA10_Price ? parseFloat(row.PSA10_Price) : null,
        cardImageUrl: row.Card_Image_URL,
      };
      batch.set(docRef, data);
      count++;

      if (count % 500 === 0) {
        await batch.commit();
        console.log(`Committed batch of 500 documents (total: ${count})`);
        batch = firestore.batch();
      }
    }

    if (count % 500 !== 0) {
      await batch.commit();
      console.log(`Committed final batch of ${count % 500} documents`);
    }

    console.log("Upload complete!");
    process.exit(0);
  })
  .on("error", (error) => {
    console.error("Error reading CSV:", error);
    process.exit(1);
  });
