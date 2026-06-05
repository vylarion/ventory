import { Router } from "express";
import crypto from "crypto";
import Inventory from "../models/Inventory.js";
import Item from "../models/Item.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth); // all inventory routes require login

// Helper: figure out what role a user has in an inventory
// Works whether members are populated (objects) or not (ObjectIds)
function getRole(inv, userId) {
  const ownerId = inv.owner._id ? inv.owner._id.toString() : inv.owner.toString();
  if (ownerId === userId) return "owner";
  const m = inv.members.find(m => {
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId;
  });
  return m ? m.role : null;
}

// GET /api/inventories — list all inventories the logged-in user belongs to
router.get("/", async (req, res) => {
  try {
    const invs = await Inventory.find({
      $or: [{ owner: req.userId }, { "members.user": req.userId }],
    });

    const result = invs.map(inv => ({
      id: inv._id,
      name: inv.name,
      description: inv.description,
      role: getRole(inv, req.userId),
      created_at: inv.createdAt,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/inventories — create a new inventory
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ detail: "Name required" });

    const inv = await Inventory.create({ name, description, owner: req.userId });
    res.status(201).json(formatInventory(inv));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/inventories/:id — get details of one inventory
router.get("/:id", async (req, res) => {
  try {
    const inv = await Inventory.findById(req.params.id).populate("members.user", "username email");
    if (!inv) return res.status(404).json({ detail: "Not found" });
    if (!getRole(inv, req.userId)) return res.status(403).json({ detail: "Not a member" });

    res.json(formatPopulated(inv));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// PUT /api/inventories/:id — update name or description (owner or manager)
router.put("/:id", async (req, res) => {
  try {
    const inv = await Inventory.findById(req.params.id);
    if (!inv) return res.status(404).json({ detail: "Not found" });

    const role = getRole(inv, req.userId);
    if (role !== "owner" && role !== "manager")
      return res.status(403).json({ detail: "Not allowed" });

    if (req.body.name) inv.name = req.body.name;
    if (req.body.description !== undefined) inv.description = req.body.description;
    await inv.save();

    // Re-fetch with populated members so frontend gets full data
    const populated = await Inventory.findById(inv._id).populate("members.user", "username email");
    res.json(formatPopulated(populated));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// DELETE /api/inventories/:id — delete an inventory (owner only)
router.delete("/:id", async (req, res) => {
  try {
    const inv = await Inventory.findById(req.params.id);
    if (!inv) return res.status(404).json({ detail: "Not found" });
    if (inv.owner.toString() !== req.userId) return res.status(403).json({ detail: "Owner only" });

    // Delete the inventory and all its items
    await Item.deleteMany({ inventory: inv._id });
    await inv.deleteOne();
    res.json({ detail: "Deleted" });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/inventories/join — join via invite code
router.post("/join", async (req, res) => {
  try {
    const { invite_code } = req.body;
    const inv = await Inventory.findOne({ inviteCode: invite_code });
    if (!inv) return res.status(404).json({ detail: "Invalid invite code" });
    if (getRole(inv, req.userId)) return res.status(400).json({ detail: "Already a member" });

    inv.members.push({ user: req.userId, role: "viewer" });
    await inv.save();

    res.json(formatInventory(inv));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/inventories/:id/leave — leave an inventory
// If the owner leaves, ownership transfers to a manager, then a viewer.
// If nobody is left, the inventory is deleted.
router.post("/:id/leave", async (req, res) => {
  try {
    const inv = await Inventory.findById(req.params.id);
    if (!inv) return res.status(404).json({ detail: "Not found" });

    const role = getRole(inv, req.userId);
    if (!role) return res.status(403).json({ detail: "Not a member" });

    if (role === "owner") {
      // Owner is leaving — need to transfer ownership
      if (inv.members.length === 0) {
        // Nobody else in the inventory — delete it and its items
        await Item.deleteMany({ inventory: inv._id });
        await inv.deleteOne();
        return res.json({ detail: "Inventory deleted (no members left)" });
      }

      // Find a manager to promote, otherwise pick any viewer
      const newOwner = inv.members.find(m => m.role === "manager") || inv.members[0];

      // Transfer ownership to that person and remove them from members list
      inv.owner = newOwner.user;
      inv.members = inv.members.filter(m => m.user.toString() !== newOwner.user.toString());
      await inv.save();

      return res.json({ detail: "Left. Ownership transferred." });
    }

    // Regular member leaving — just remove them from the list
    inv.members = inv.members.filter(m => m.user.toString() !== req.userId);
    await inv.save();

    res.json({ detail: "Left the inventory" });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/inventories/:id/regenerate-code — new invite code (owner only)
router.post("/:id/regenerate-code", async (req, res) => {
  try {
    const inv = await Inventory.findById(req.params.id).populate("members.user", "username email");
    if (!inv) return res.status(404).json({ detail: "Not found" });
    if (inv.owner.toString() !== req.userId) return res.status(403).json({ detail: "Owner only" });

    inv.inviteCode = crypto.randomBytes(4).toString("hex");
    await inv.save();

    res.json(formatPopulated(inv));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// PUT /api/inventories/:id/members/:userId — change a member's role (owner only)
router.put("/:id/members/:userId", async (req, res) => {
  try {
    const inv = await Inventory.findById(req.params.id).populate("members.user", "username email");
    if (!inv) return res.status(404).json({ detail: "Not found" });
    if (inv.owner.toString() !== req.userId) return res.status(403).json({ detail: "Owner only" });

    const member = inv.members.find(m => m.user._id.toString() === req.params.userId);
    if (!member) return res.status(404).json({ detail: "Member not found" });

    member.role = req.body.role;
    await inv.save();

    res.json(formatPopulated(inv));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// DELETE /api/inventories/:id/members/:userId — remove a member (owner or manager)
router.delete("/:id/members/:userId", async (req, res) => {
  try {
    const inv = await Inventory.findById(req.params.id).populate("members.user", "username email");
    if (!inv) return res.status(404).json({ detail: "Not found" });

    // Only owners and managers can remove members
    const role = getRole(inv, req.userId);
    if (role !== "owner" && role !== "manager")
      return res.status(403).json({ detail: "Not allowed" });

    // Managers can't remove other managers — only owners can
    const target = inv.members.find(m => m.user._id.toString() === req.params.userId);
    if (!target) return res.status(404).json({ detail: "Member not found" });
    if (role === "manager" && target.role === "manager")
      return res.status(403).json({ detail: "Managers can't remove other managers" });

    inv.members = inv.members.filter(m => m.user._id.toString() !== req.params.userId);
    await inv.save();

    res.json(formatPopulated(inv));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// --- Format helpers ---
// Shape data the way the frontend expects

// When members are NOT populated (just ObjectIds)
function formatInventory(inv) {
  return {
    id: inv._id,
    name: inv.name,
    description: inv.description,
    owner: inv.owner,
    invite_code: inv.inviteCode,
    members: inv.members.map(m => ({
      user_id: m.user.toString(),
      role: m.role,
    })),
    created_at: inv.createdAt,
  };
}

// When members ARE populated (full user objects)
function formatPopulated(inv) {
  return {
    id: inv._id,
    name: inv.name,
    description: inv.description,
    owner: inv.owner._id || inv.owner,
    invite_code: inv.inviteCode,
    members: inv.members.map(m => ({
      user_id: m.user._id.toString(),
      username: m.user.username,
      role: m.role,
    })),
    created_at: inv.createdAt,
  };
}

export default router;
