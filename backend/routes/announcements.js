import { Router } from "express";
import db from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { str } from "../lib/validate.js";

const router = Router();

router.get("/", (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.id, a.body, a.created_at, a.user_id, u.name AS author_name
       FROM announcements a LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC, a.id DESC LIMIT 10`
    )
    .all();
  res.json({ announcements: rows });
});

router.post("/", requireAuth, requireRole("professor"), (req, res) => {
  const body = str(req.body.body, 280);
  if (body.length < 3) return res.status(400).json({ error: "Write a short announcement first." });
  const info = db.prepare("INSERT INTO announcements (user_id, body) VALUES (?, ?)").run(req.user.id, body);
  res.status(201).json(
    db
      .prepare(
        `SELECT a.id, a.body, a.created_at, a.user_id, u.name AS author_name
         FROM announcements a LEFT JOIN users u ON u.id = a.user_id WHERE a.id = ?`
      )
      .get(info.lastInsertRowid)
  );
});

router.delete("/:id", requireAuth, requireRole("professor"), (req, res) => {
  const info = db.prepare("DELETE FROM announcements WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: "Announcement not found." });
  res.status(204).send();
});

export default router;
