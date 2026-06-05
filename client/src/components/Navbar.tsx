import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Package } from "lucide-react";

// Navbar — shown on every page
// Shows different links depending on whether the user is logged in or not
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav>
      <Link to={user ? "/dashboard" : "/"} className="nav-brand">
        <Package size={18} /> Venotory
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <span className="muted">{user.username}</span>
            <button onClick={() => { logout(); navigate("/"); }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
