import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listInventories, createInventory, joinInventory } from "../../services/api";
import type { InventoryListItem } from "../../types";
import { Plus, Link as LinkIcon } from "lucide-react";

// Dashboard — shows all inventories the user owns or is a member of
// Also has modals to create a new inventory or join one with an invite code
export default function Dashboard() {
  const [inventories, setInventories] = useState<InventoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for the "Create" modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // State for the "Join" modal
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  // Fetch the user's inventories from the backend
  const fetchInventories = async () => {
    try {
      const res = await listInventories();
      setInventories(res.data);
    } catch { setError("Failed to load inventories"); }
    finally { setLoading(false); }
  };

  // Fetch on first render
  useEffect(() => { fetchInventories(); }, []);

  // Handle creating a new inventory
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInventory(newName, newDesc || undefined);
      setShowCreate(false); setNewName(""); setNewDesc("");
      fetchInventories(); // refresh the list
    } catch { setError("Failed to create inventory"); }
  };

  // Handle joining an inventory via invite code
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinInventory(inviteCode.trim());
      setShowJoin(false); setInviteCode("");
      fetchInventories(); // refresh the list
    } catch { setError("Invalid invite code or already a member"); }
  };

  if (loading) return <div className="center">Loading...</div>;

  return (
    <div className="page">
      {/* Header with title and action buttons */}
      <div className="flex between items-center wrap mb">
        <h2>My Inventories</h2>
        <div className="flex gap">
          <button className="btn-primary icon-text" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create
          </button>
          <button className="icon-text" onClick={() => setShowJoin(true)}>
            <LinkIcon size={14} /> Join
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Create inventory modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create Inventory</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join inventory modal */}
      {showJoin && (
        <div className="modal-backdrop" onClick={() => setShowJoin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Join Inventory</h3>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label>Invite Code</label>
                <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} required />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowJoin(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory list — shows cards in a grid, or an empty message */}
      {inventories.length === 0 ? (
        <p className="muted" style={{ textAlign: "center", marginTop: "3rem" }}>
          No inventories yet. Create one or join with an invite code.
        </p>
      ) : (
        <div className="grid">
          {inventories.map(inv => (
            <Link to={`/inventory/${inv.id}`} key={inv.id} style={{ color: "inherit", textDecoration: "none" }}>
              <div className="card">
                <div className="flex between items-center">
                  <strong>{inv.name}</strong>
                  <span className={`badge badge-${inv.role}`}>{inv.role}</span>
                </div>
                {inv.description && <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{inv.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
