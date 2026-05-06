import mongoose from "mongoose";
import { ask } from "../utils/prompt.util.js";

async function getUri(name, envValue) {
    if (envValue) return envValue;
    return await ask(`🔑 Enter ${name} MongoDB URI: `);
}

export async function migrateDatabase() {
    const sourceUri = await getUri("SOURCE", process.env.SOURCE_MONGO_URI);
    const targetUri = await getUri("TARGET", process.env.TARGET_MONGO_URI);

    console.log("\n==================================================");
    console.log("🚀 STARTING MONGO DB MIGRATION — SAFE MODE");
    console.log("==================================================");
    console.log("✔ Source DB is READ-ONLY");
    console.log("✔ Target DB collections will be replaced\n");

    const sourceConn = mongoose.createConnection(sourceUri);
    const targetConn = mongoose.createConnection(targetUri);

    try {
        await Promise.all([sourceConn.asPromise(), targetConn.asPromise()]);

        const collections = await sourceConn.db.listCollections().toArray();
        const names = collections.map(c => c.name).filter(n => !n.startsWith("system."));

        let totalCopied = 0;

        for (const name of names) {
            const sourceColl = sourceConn.collection(name);
            const targetColl = targetConn.collection(name);

            const exists = await targetConn.db.listCollections({ name }).toArray();
            if (exists.length) await targetColl.drop();

            const docs = await sourceColl.find({}).toArray();
            if (!docs.length) continue;

            const batchSize = 500;
            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = docs.slice(i, i + batchSize);
                const result = await targetColl.insertMany(batch, { ordered: false });
                totalCopied += result.insertedCount;
            }
        }

        console.log(`\n🎉 Migration completed. Total docs copied: ${totalCopied}\n`);
    } finally {
        await sourceConn.close();
        await targetConn.close();
    }
}
