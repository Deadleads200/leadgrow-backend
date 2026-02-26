const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
dotenv.config(); 
const uri = process.env.MONGODB_URl;

async function exportAllCollections() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(); 

    const dbName = "exportdatabase";
    const exportDir = path.join(__dirname, dbName);

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    const collections = await db.listCollections().toArray();

    for (const col of collections) {
      const data = await db.collection(col.name).find({}).toArray();

      fs.writeFileSync(
        path.join(exportDir, `${col.name}.json`), 
        JSON.stringify(data, null, 2),
        "utf-8"
      );

      console.log(`Exported: ${col.name}.json`);
    }

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.close();
  }
}

exportAllCollections();
