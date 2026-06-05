import mongoose from "mongoose";
import crypto from "crypto";

// Each member inside an inventory has a user reference and a role
const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // links to a User document
  role: { type: String, enum: ["manager", "viewer"], default: "viewer" },      // what they can do
}, { _id: false }); // _id: false means members don't get their own _id (they live inside inventory)

// Inventory schema — the main container that holds items and members
const inventorySchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: "" },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who created it
  inviteCode:  { type: String, unique: true, default: () => crypto.randomBytes(4).toString("hex") }, // random 8-char code
  members:     [memberSchema], // array of members embedded in this document
}, { timestamps: true });

export default mongoose.model("Inventory", inventorySchema);
