// One-time script to clear all data from the database
// Run: node clear-db.js
import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URL);
const db = mongoose.connection.db;
const users = await db.collection("users").deleteMany({});
const inventories = await db.collection("inventories").deleteMany({});
const items = await db.collection("items").deleteMany({});
console.log(`Deleted ${users.deletedCount} users, ${inventories.deletedCount} inventories, ${items.deletedCount} items`);
process.exit(0);
