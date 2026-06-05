import mongoose from "mongoose";

// Item schema — each item belongs to one inventory
// Items are in a separate collection (not embedded) so inventories with lots of items don't hit size limits
const itemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  quantity:    { type: Number, default: 0 },
  description: { type: String, default: "" },
  inventory:   { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true }, // which inventory this belongs to
  addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },      // who added it
}, { timestamps: true }); // createdAt and updatedAt

export default mongoose.model("Item", itemSchema);
