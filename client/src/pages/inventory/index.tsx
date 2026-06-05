import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getInventory, listItems, createItem, updateItem, deleteItem,
  deleteInventory, regenerateCode, updateMemberRole, removeMember,
  leaveInventory, updateInventory,
} from "../../services/api";
import type { Inventory, Item } from "../../types";
import { ArrowLeft, Plus, RefreshCw, Trash2, LogOut, Pencil } from "lucide-react";

// Inventory detail page — shows items and members for one inventory
export default function InventoryView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"items" | "members">("items");

  // State for "Add item" modal
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemDesc, setItemDesc] = useState("");

  // State for "Edit item" modal
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // State for "Edit inventory" modal (name + description)
  const [showEditInv, setShowEditInv] = useState(false);
  const [editInvName, setEditInvName] = useState("");
  const [editInvDesc, setEditInvDesc] = useState("");

  // Figure out the current user's role
  const isOwner = inventory?.owner === user?.id;
  const isManager = inventory?.members.some(m => m.user_id === user?.id && m.role === "manager");
  const isEditor = isOwner || isManager;

  // Fetch inventory details and items
  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [invRes, itemsRes] = await Promise.all([getInventory(id), listItems(id)]);
      setInventory(invRes.data);
      setItems(itemsRes.data);
    } catch { setError("Failed to load inventory"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Item handlers ---
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await createItem(id, { name: itemName, quantity: Number(itemQty) || 0, description: itemDesc || undefined });
      setShowAddItem(false); setItemName(""); setItemQty(""); setItemDesc("");
      fetchData();
    } catch { setError("Failed to add item"); }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editingItem) return;
    try {
      await updateItem(id, editingItem.id, { name: editName, quantity: Number(editQty) || 0, description: editDesc || undefined });
      setEditingItem(null);
      fetchData();
    } catch { setError("Failed to update item"); }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!id || !confirm("Delete this item?")) return;
    try { await deleteItem(id, itemId); fetchData(); }
    catch { setError("Failed to delete item"); }
  };

  const startEdit = (item: Item) => {
    setEditingItem(item); setEditName(item.name); setEditQty(String(item.quantity)); setEditDesc(item.description || "");
  };

  // --- Inventory edit handler ---
  const handleEditInv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const res = await updateInventory(id, { name: editInvName, description: editInvDesc });
      setInventory(res.data);
      setShowEditInv(false);
    } catch { setError("Failed to update inventory"); }
  };

  const openEditInv = () => {
    if (!inventory) return;
    setEditInvName(inventory.name);
    setEditInvDesc(inventory.description || "");
    setShowEditInv(true);
  };

  // --- Leave handler ---
  const handleLeave = async () => {
    if (!id) return;
    const msg = isOwner
      ? "You are the owner. Ownership will be transferred. Leave?"
      : "Leave this inventory?";
    if (!confirm(msg)) return;
    try {
      await leaveInventory(id);
      navigate("/dashboard");
    } catch { setError("Failed to leave"); }
  };

  // --- Member handlers ---
  async function handleRoleChange(userId: string, role: string) {
    if (!id) return;
    try { const res = await updateMemberRole(id, userId, role); setInventory(res.data); }
    catch { setError("Failed to update role"); }
  }

  async function handleRemoveMember(userId: string) {
    if (!id || !confirm("Remove this member?")) return;
    try { const res = await removeMember(id, userId); setInventory(res.data); }
    catch { setError("Failed to remove member"); }
  }

  if (loading) return <div className="center">Loading...</div>;
  if (!inventory) return <div className="center">Inventory not found</div>;

  return (
    <div className="page">
      {/* Header: back, title, edit button, leave/delete buttons */}
      <div className="flex between items-center wrap mb">
        <div>
          <button className="icon-text btn-sm" onClick={() => navigate("/dashboard")} style={{ marginBottom: "0.5rem" }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex gap items-center">
            <h2>{inventory.name}</h2>
            {/* Edit button — owners and managers can edit name/description */}
            {isEditor && (
              <button className="btn-sm" onClick={openEditInv} title="Edit inventory">
                <Pencil size={14} />
              </button>
            )}
          </div>
          {inventory.description && <p className="muted">{inventory.description}</p>}
        </div>
        <div className="flex gap">
          {/* Leave button — any member can leave */}
          <button className="icon-text btn-sm" onClick={handleLeave}>
            <LogOut size={14} /> Leave
          </button>
          {/* Delete button — owner only */}
          {isOwner && (
            <button className="btn-danger icon-text btn-sm" onClick={() => { if (confirm("Delete inventory and all items?")) { deleteInventory(id!); navigate("/dashboard"); } }}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Edit inventory modal */}
      {showEditInv && (
        <div className="modal-backdrop" onClick={() => setShowEditInv(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Inventory</h3>
            <form onSubmit={handleEditInv}>
              <div className="form-group"><label>Name</label><input value={editInvName} onChange={e => setEditInvName(e.target.value)} required /></div>
              <div className="form-group"><label>Description</label><input value={editInvDesc} onChange={e => setEditInvDesc(e.target.value)} /></div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditInv(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite code — only visible to the owner */}
      {isOwner && (
        <div className="card flex between items-center mb" style={{ padding: "0.75rem 1rem" }}>
          <span>Invite code: <code style={{ fontWeight: "bold", letterSpacing: "2px" }}>{inventory.invite_code}</code></span>
          <button className="icon-text btn-sm" onClick={() => { if (confirm("Regenerate code?")) regenerateCode(id!).then(r => setInventory(r.data)); }}>
            <RefreshCw size={14} /> Regenerate
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === "items" ? "active" : ""}`} onClick={() => setTab("items")}>Items ({items.length})</button>
        <button className={`tab ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>Members ({inventory.members.length + 1})</button>
      </div>

      {/* ========== ITEMS TAB ========== */}
      {tab === "items" && (
        <>
          {isEditor && (
            <button className="btn-primary icon-text mb" onClick={() => setShowAddItem(true)}>
              <Plus size={14} /> Add Item
            </button>
          )}

          {/* Add item modal */}
          {showAddItem && (
            <div className="modal-backdrop" onClick={() => setShowAddItem(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>Add Item</h3>
                <form onSubmit={handleAddItem}>
                  <div className="form-group"><label>Name</label><input value={itemName} onChange={e => setItemName(e.target.value)} required /></div>
                  <div className="form-group"><label>Quantity</label><input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} min={0} /></div>
                  <div className="form-group"><label>Description</label><input value={itemDesc} onChange={e => setItemDesc(e.target.value)} /></div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowAddItem(false)}>Cancel</button>
                    <button type="submit" className="btn-primary">Add</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit item modal */}
          {editingItem && (
            <div className="modal-backdrop" onClick={() => setEditingItem(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>Edit Item</h3>
                <form onSubmit={handleEditItem}>
                  <div className="form-group"><label>Name</label><input value={editName} onChange={e => setEditName(e.target.value)} required /></div>
                  <div className="form-group"><label>Quantity</label><input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} min={0} /></div>
                  <div className="form-group"><label>Description</label><input value={editDesc} onChange={e => setEditDesc(e.target.value)} /></div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setEditingItem(null)}>Cancel</button>
                    <button type="submit" className="btn-primary">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Items table */}
          {items.length === 0 ? (
            <p className="muted" style={{ textAlign: "center", marginTop: "2rem" }}>No items yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Qty</th><th>Description</th><th>Updated</th>
                  {isEditor && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.quantity}</td>
                    <td className="muted">{item.description || "—"}</td>
                    <td className="muted">{new Date(item.updated_at).toLocaleDateString()}</td>
                    {isEditor && (
                      <td>
                        <div className="flex gap">
                          <button className="btn-sm" onClick={() => startEdit(item)}>Edit</button>
                          <button className="btn-danger btn-sm" onClick={() => handleDeleteItem(item.id)}>Del</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ========== MEMBERS TAB ========== */}
      {tab === "members" && (
        <div>
          {/* Owner row */}
          <div className="flex between items-center" style={{ padding: "0.5rem 0", borderBottom: "1px solid #333" }}>
            <span>{isOwner ? "You (Owner)" : "Owner"}</span>
            <span className="badge badge-owner">owner</span>
          </div>

          {/* Member rows */}
          {inventory.members.map(m => (
            <div key={m.user_id} className="flex between items-center" style={{ padding: "0.5rem 0", borderBottom: "1px solid #333" }}>
              <span>{m.username} {m.user_id === user?.id ? "(You)" : ""}</span>
              <div className="flex gap items-center">
                {isOwner ? (
                  <>
                    {/* Owner can change roles and remove anyone */}
                    <select value={m.role} onChange={e => handleRoleChange(m.user_id, e.target.value)} style={{ width: "auto" }}>
                      <option value="viewer">Viewer</option>
                      <option value="manager">Manager</option>
                    </select>
                    <button className="btn-danger btn-sm" onClick={() => handleRemoveMember(m.user_id)}>Remove</button>
                  </>
                ) : isManager && m.role !== "manager" ? (
                  <>
                    {/* Managers can remove viewers (not other managers) */}
                    <span className={`badge badge-${m.role}`}>{m.role}</span>
                    <button className="btn-danger btn-sm" onClick={() => handleRemoveMember(m.user_id)}>Remove</button>
                  </>
                ) : (
                  <span className={`badge badge-${m.role}`}>{m.role}</span>
                )}
              </div>
            </div>
          ))}

          {inventory.members.length === 0 && (
            <p className="muted" style={{ textAlign: "center", marginTop: "2rem" }}>No members yet. Share the invite code.</p>
          )}
        </div>
      )}
    </div>
  );
}
