/**
 * Migration script to drop the unique index on billNumber
 * 
 * This script should be run once to remove the old unique constraint on billNumber
 * and allow bills with the same date but different projects.
 * 
 * Run: npx ts-node src/scripts/drop-bill-number-unique-index.ts
 */

import mongoose from "mongoose";
import { config } from "dotenv";

config();

async function dropBillNumberUniqueIndex() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/guard-crm";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Get the bills collection
    const billsCollection = db.collection("bills");

    // List all indexes
    const indexes = await billsCollection.indexes();
    console.log("Current indexes:", indexes);

    // Drop the unique index on billNumber if it exists
    try {
      await billsCollection.dropIndex("billNumber_1");
      console.log("✓ Dropped unique index on billNumber");
    } catch (error: any) {
      if (error.code === 27 || error.codeName === "IndexNotFound") {
        console.log("ℹ Unique index on billNumber does not exist (already dropped)");
      } else {
        throw error;
      }
    }

    // Ensure the compound unique index on projectId, year, month exists
    try {
      await billsCollection.createIndex(
        { projectId: 1, year: 1, month: 1 },
        { unique: true, name: "projectId_1_year_1_month_1" }
      );
      console.log("✓ Created/verified compound unique index on projectId, year, month");
    } catch (error: any) {
      if (error.code === 85 || error.codeName === "IndexOptionsConflict") {
        console.log("ℹ Compound unique index already exists");
      } else {
        throw error;
      }
    }

    // List indexes after migration
    const indexesAfter = await billsCollection.indexes();
    console.log("\nIndexes after migration:", indexesAfter);

    console.log("\n✓ Migration completed successfully!");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the migration
dropBillNumberUniqueIndex();







