import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Package } from "lucide-react";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="center">
      <div style={{ textAlign: "center" }}>
        <Package size={40} style={{ marginBottom: "0.5rem" }} />
        <h1>Venotory</h1>
        <p className="muted" style={{ margin: "0.5rem 0 1.5rem" }}>
          Shared inventory management. Create, collaborate, track.
        </p>
        {user ? (
          <Link to="/dashboard"><button className="btn-primary">Go to Dashboard</button></Link>
        ) : (
          <div className="flex gap" style={{ justifyContent: "center" }}>
            <Link to="/register"><button className="btn-primary">Get Started</button></Link>
            <Link to="/login"><button>Sign In</button></Link>
          </div>
        )}
      </div>
    </div>
  );
}