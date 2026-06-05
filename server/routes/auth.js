import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();

// POST /api/auth/register — create a new user account
router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Make sure all fields are provided
    if (!email || !username || !password)
      return res.status(400).json({ detail: "All fields required" });

    // Lowercase the email to match how Mongoose stores it
    const emailLower = email.toLowerCase();

    // Check if someone already registered with this email
    if (await User.findOne({ email: emailLower }))
      return res.status(400).json({ detail: "Email already registered" });

    // Hash the password before saving (never store plain text passwords)
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, password: hashed });

    // Return the new user (without the password)
    res.status(201).json({ id: user._id, email: user.email, username: user.username });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/auth/login — check credentials and return a JWT token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Lowercase email to match stored format
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ detail: "Invalid credentials" });

    // Create a JWT token with the user's ID inside it
    // "sub" is a standard JWT claim meaning "subject" (who this token is for)
    const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
      expiresIn: `${process.env.JWT_EXPIRY_HOURS || 24}h`,
    });

    // Return the token — the frontend will store this and send it with every request
    res.json({ access_token: token, token_type: "bearer" });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/auth/me — return the currently logged-in user's info
// The "auth" middleware runs first and puts the user ID on req.userId
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password"); // exclude password field
    if (!user) return res.status(404).json({ detail: "User not found" });

    res.json({ id: user._id, email: user.email, username: user.username });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

export default router;
