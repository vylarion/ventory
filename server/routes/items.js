import { Router } from "express";
import Item from "../models/Item.js";
import Inventory from "../models/Inventory.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth); // all item routes require login

// Helper: check if a user is a member of an inventory and return their role
// Returns null if they're not a member at all
async function checkAccess(inventoryId, userId) {
  const inv = await Inventory.findById(inventoryId);
  if (!inv) return null;
  if (inv.owner.toString() === userId) return "owner";
  const m = inv.members.find(m => {
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId;
  });
  return m ? m.role : null;
}

// Shape the item data the way the frontend expects
function format(item) {
  return {
    id: item._id,
    name: item.name,
    quantity: item.quantity,
    description: item.description,
    inventory_id: item.inventory,
    added_by: item.addedBy,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

// GET /api/inventories/:inventoryId/items — list all items in an inventory
router.get("/:inventoryId/items", async (req, res) => {
  try {
    // Must be a member to see items
    const role = await checkAccess(req.params.inventoryId, req.userId);
    if (!role) return res.status(403).json({ detail: "Not a member" });

    const items = await Item.find({ inventory: req.params.inventoryId });
    res.json(items.map(format));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/inventories/:inventoryId/items — add a new item
router.post("/:inventoryId/items", async (req, res) => {
  try {
    // Viewers can't add items — only owners and managers can
    const role = await checkAccess(req.params.inventoryId, req.userId);
    if (!role || role === "viewer") return res.status(403).json({ detail: "Not allowed" });

    const { name, quantity, description } = req.body;
    if (!name) return res.status(400).json({ detail: "Name required" });

    const item = await Item.create({
      name, quantity, description,
      inventory: req.params.inventoryId,
      addedBy: req.userId, // track who added this item
    });

    res.status(201).json(format(item));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// PUT /api/inventories/:inventoryId/items/:itemId — update an item
router.put("/:inventoryId/items/:itemId", async (req, res) => {
  try {
    const role = await checkAccess(req.params.inventoryId, req.userId);
    if (!role || role === "viewer") return res.status(403).json({ detail: "Not allowed" });

    // Find the item — make sure it belongs to this inventory
    const item = await Item.findOne({ _id: req.params.itemId, inventory: req.params.inventoryId });
    if (!item) return res.status(404).json({ detail: "Item not found" });

    // Only update the fields that were sent in the request
    if (req.body.name !== undefined) item.name = req.body.name;
    if (req.body.quantity !== undefined) item.quantity = req.body.quantity;
    if (req.body.description !== undefined) item.description = req.body.description;
    await item.save();

    res.json(format(item));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// DELETE /api/inventories/:inventoryId/items/:itemId — delete an item
router.delete("/:inventoryId/items/:itemId", async (req, res) => {
  try {
    const role = await checkAccess(req.params.inventoryId, req.userId);
    if (!role || role === "viewer") return res.status(403).json({ detail: "Not allowed" });

    const item = await Item.findOneAndDelete({ _id: req.params.itemId, inventory: req.params.inventoryId });
    if (!item) return res.status(404).json({ detail: "Item not found" });

    res.json({ detail: "Deleted" });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

export default router;
