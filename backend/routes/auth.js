import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { str, isEmail } from "../lib/validate.js";

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// Compared against when the email is unknown, so a missing account takes about
// as long to reject as a wrong password (avoids revealing which emails exist).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

router.post("/register", (req, res) => {
  const name = str(req.body?.name, 100);
  const email = str(req.body?.email, 254).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const role = req.body?.role;
  const designation = str(req.body?.designation, 100);
  const department = str(req.body?.department, 100);

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Name, email, password, and role are all required." });
  }
  if (!["professor", "student"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'professor' or 'student'." });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }
  // bcrypt only uses the first 72 bytes, so longer passwords would silently be cut.
  if (Buffer.byteLength(password) > 72) {
    return res.status(400).json({ error: "Password must be 72 bytes or fewer." });
  }

  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const password_hash = bcrypt.hashSync(password, 12);
  let info;
  try {
    info = db
      .prepare(
        `INSERT INTO users (role, name, email, password_hash, designation, department)
         VALUES (@role, @name, @email, @password_hash, @designation, @department)`
      )
      .run({
        role,
        name,
        email,
        password_hash,
        designation: role === "professor" ? designation || null : null,
        department: role === "professor" ? department || null : null,
      });
  } catch (err) {
    // Two sign-ups with the same email racing each other.
    if (String(err.code).startsWith("SQLITE_CONSTRAINT")) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }
    throw err;
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const email = str(req.body?.email, 254).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  const ok = bcrypt.compareSync(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(user) });
});

export default router;
