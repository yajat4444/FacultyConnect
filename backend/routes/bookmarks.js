import { Router } from "express";
import db from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("student"));

const KINDS = ["professor", "course"];

function targetExists(kind, id) {
  if (kind === "professor") return !!db.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'professor'").get(id);
  return !!db.prepare("SELECT 1 FROM courses WHERE id = ?").get(id);
}

function parseTarget(req, res) {
  const kind = req.params.kind;
  const id = Number(req.params.id);
  if (!KINDS.includes(kind) || !Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Unknown bookmark type." });
    return null;
  }
  if (!targetExists(kind, id)) {
    res.status(404).json({ error: kind === "professor" ? "Professor not found." : "Course not found." });
    return null;
  }
  return { kind, id };
}

// Everything the signed-in student has saved, newest first.
router.get("/", (req, res) => {
  const professors = db
    .prepare(
      `SELECT u.id, u.name, u.designation, u.department, u.photo_url, u.research_interests, b.created_at AS saved_at
       FROM bookmarks b JOIN users u ON u.id = b.target_id AND u.role = 'professor'
       WHERE b.user_id = ? AND b.kind = 'professor'
       ORDER BY b.created_at DESC, b.id DESC`
    )
    .all(req.user.id);
  const courses = db
    .prepare(
      `SELECT c.id, c.code, c.title, c.semester, c.user_id AS professor_id, u.name AS professor_name, b.created_at AS saved_at
       FROM bookmarks b
       JOIN courses c ON c.id = b.target_id
       JOIN users u ON u.id = c.user_id
       WHERE b.user_id = ? AND b.kind = 'course'
       ORDER BY b.created_at DESC, b.id DESC`
    )
    .all(req.user.id);
  res.json({ professors, courses });
});

// Saving twice is not an error: the request just says "make sure it is saved".
router.put("/:kind/:id", (req, res) => {
  const t = parseTarget(req, res);
  if (!t) return;
  db.prepare("INSERT OR IGNORE INTO bookmarks (user_id, kind, target_id) VALUES (?, ?, ?)").run(req.user.id, t.kind, t.id);
  res.json({ saved: true });
});

router.delete("/:kind/:id", (req, res) => {
  const kind = req.params.kind;
  const id = Number(req.params.id);
  if (!KINDS.includes(kind) || !Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Unknown bookmark type." });
  }
  db.prepare("DELETE FROM bookmarks WHERE user_id = ? AND kind = ? AND target_id = ?").run(req.user.id, kind, id);
  res.json({ saved: false });
});

export default router;
