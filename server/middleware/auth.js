import jwt from "jsonwebtoken";

// This middleware checks if the request has a valid JWT token.
// If yes, it adds the user's ID to req.userId so routes can use it.
// If no, it rejects the request with 401.
export default function auth(req, res, next) {
  const header = req.headers.authorization; // e.g. "Bearer eyJhbG..."
  if (!header) return res.status(401).json({ detail: "No token" });

  const token = header.split(" ")[1]; // grab the token part after "Bearer "
  try {
    // Verify the token using your secret key. If valid, payload contains { sub: userId }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub; // attach user ID to the request
    next(); // continue to the actual route handler
  } catch {
    res.status(401).json({ detail: "Invalid token" });
  }
}
