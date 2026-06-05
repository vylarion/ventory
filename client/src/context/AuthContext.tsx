import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "../types";
import { getMe, loginUser, registerUser } from "../services/api";

// Define what the auth context provides to the rest of the app
interface AuthContextType {
  user: User | null;       // the logged-in user, or null if not logged in
  token: string | null;    // the JWT token
  loading: boolean;        // true while we're checking if the user is logged in
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// AuthProvider wraps the entire app and manages authentication state
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token")); // check if token exists from a previous session
  const [loading, setLoading] = useState(true);

  // On mount (or when token changes), try to fetch the user's info
  // This is how we "remember" the user after a page refresh
  useEffect(() => {
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => { localStorage.removeItem("token"); setToken(null); }) // token expired or invalid
        .finally(() => setLoading(false));
    } else {
      setLoading(false); // no token, nothing to check
    }
  }, [token]);

  // Login: get a token from the server, save it, then fetch user info
  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password);
    localStorage.setItem("token", res.data.access_token);
    setToken(res.data.access_token);
    const me = await getMe();
    setUser(me.data);
  };

  // Register: create account, then immediately log in
  const register = async (email: string, username: string, password: string) => {
    // This will throw if registration fails — error goes to the Register page's catch block
    await registerUser(email, username, password);
    // If we get here, registration worked. Now log in.
    try {
      await login(email, password);
    } catch {
      // Registration succeeded but auto-login failed — not a big deal, just redirect to login page
      throw new Error("Account created! Please log in.");
    }
  };

  // Logout: clear everything
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // Provide the auth state and actions to all child components
  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — any component can call useAuth() to access the auth state
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
