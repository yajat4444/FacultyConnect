import { Router } from "express";
import db from "../db/index.js";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth.js";
import { str, isHttpUrl, skillList } from "../lib/validate.js";

const router = Router();

const APP_STATUSES = ["pending", "shortlisted", "accepted", "rejected"];

const SLOT_SELECT = `
  SELECT p.*,
    u.name AS professor_name,
    u.designation AS professor_designation,
    u.department AS professor_department,
    u.photo_url AS professor_photo,
    (SELECT COUNT(*) FROM applications a WHERE a.slot_id = p.id AND a.status = 'accepted') AS accepted_count
  FROM project_slots p JOIN users u ON u.id = p.user_id
`;

function withSkills(row) {
  return { ...row, skills: skillList(row.required_skills) };
}

function loadSlot(id) {
  const row = db.prepare(`${SLOT_SELECT} WHERE p.id = ?`).get(id);
  return row ? withSkills(row) : null;
}

// ---- Public: browse ------------------------------------------------------------

router.get("/", (req, res) => {
  const q = str(req.query.q, 100);
  const professor = Number(req.query.professor) || null;
  const skill = str(req.query.skill, 40).toLowerCase();
  const department = str(req.query.department, 100);
  const scope = req.query.status === "all" ? "all" : "open";

  const where = [];
  const params = [];
  if (scope === "open") where.push("p.status = 'open'");
  if (q) {
    const like = `%${q}%`;
    where.push("(p.title LIKE ? OR p.description LIKE ? OR p.required_skills LIKE ? OR u.name LIKE ?)");
    params.push(like, like, like, like);
  }
  if (professor) {
    where.push("p.user_id = ?");
    params.push(professor);
  }
  if (department) {
    where.push("u.department = ?");
    params.push(department);
  }

  let projects = db
    .prepare(
      `${SLOT_SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY (p.status = 'open') DESC, p.created_at DESC, p.id DESC`
    )
    .all(...params)
    .map(withSkills);

  if (skill) {
    projects = projects.filter((p) => p.skills.some((s) => s.toLowerCase() === skill));
  }

  // Filter options are built from the whole scope (not the filtered result)
  // so choosing one filter doesn't make the other options disappear.
  const scoped = db
    .prepare(`${SLOT_SELECT} ${scope === "open" ? "WHERE p.status = 'open'" : ""}`)
    .all()
    .map(withSkills);
  const skills = new Map();
  const departments = new Set();
  const professors = new Map();
  for (const p of scoped) {
    p.skills.forEach((s) => !skills.has(s.toLowerCase()) && skills.set(s.toLowerCase(), s));
    if (p.professor_department) departments.add(p.professor_department);
    professors.set(p.user_id, p.professor_name);
  }

  res.json({
    projects,
    facets: {
      skills: [...skills.values()].sort((a, b) => a.localeCompare(b)),
      departments: [...departments].sort(),
      professors: [...professors.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
    },
  });
});

// ---- Professor: own slots, with application counts --------------------------------

router.get("/mine", requireAuth, requireRole("professor"), (req, res) => {
  const rows = db
    .prepare(
      `${SLOT_SELECT} WHERE p.user_id = ? ORDER BY (p.status = 'open') DESC, p.created_at DESC, p.id DESC`
    )
    .all(req.user.id)
    .map(withSkills);
  const counts = db
    .prepare(
      `SELECT slot_id,
         COUNT(*) AS total,
         SUM(status = 'pending') AS pending
       FROM applications WHERE slot_id IN (SELECT id FROM project_slots WHERE user_id = ?)
       GROUP BY slot_id`
    )
    .all(req.user.id);
  const byId = new Map(counts.map((c) => [c.slot_id, c]));
  res.json({
    projects: rows.map((r) => ({
      ...r,
      application_count: byId.get(r.id)?.total || 0,
      pending_count: byId.get(r.id)?.pending || 0,
    })),
  });
});

router.get("/applications/received", requireAuth, requireRole("professor"), (req, res) => {
  const applications = db
    .prepare(
      `SELECT a.*, p.title AS project_title, p.status AS project_status
       FROM applications a JOIN project_slots p ON p.id = a.slot_id
       WHERE p.user_id = ?
       ORDER BY a.created_at DESC, a.id DESC`
    )
    .all(req.user.id);
  res.json({ applications });
});

router.get("/applications/mine", requireAuth, requireRole("student"), (req, res) => {
  const applications = db
    .prepare(
      `SELECT a.*, p.title AS project_title, p.status AS project_status, p.user_id AS professor_id,
         u.name AS professor_name
       FROM applications a
       JOIN project_slots p ON p.id = a.slot_id
       JOIN users u ON u.id = p.user_id
       WHERE a.student_id = ?
       ORDER BY a.created_at DESC, a.id DESC`
    )
    .all(req.user.id);
  res.json({ applications });
});

router.put("/applications/:appId", requireAuth, requireRole("professor"), (req, res) => {
  const status = str(req.body.status, 20);
  if (!APP_STATUSES.includes(status)) return res.status(400).json({ error: "Unknown status." });

  const app = db
    .prepare(
      `SELECT a.*, p.user_id AS owner_id FROM applications a
       JOIN project_slots p ON p.id = a.slot_id WHERE a.id = ?`
    )
    .get(req.params.appId);
  if (!app || app.owner_id !== req.user.id) return res.status(404).json({ error: "Application not found." });

  db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, app.id);

  // Accepting the last open place closes the slot automatically.
  let slot = db.prepare("SELECT * FROM project_slots WHERE id = ?").get(app.slot_id);
  if (status === "accepted" && slot.status === "open") {
    const accepted = db
      .prepare("SELECT COUNT(*) AS n FROM applications WHERE slot_id = ? AND status = 'accepted'")
      .get(slot.id).n;
    if (accepted >= slot.openings) {
      db.prepare("UPDATE project_slots SET status = 'filled' WHERE id = ?").run(slot.id);
      slot = { ...slot, status: "filled" };
    }
  }
  res.json({ application: db.prepare("SELECT * FROM applications WHERE id = ?").get(app.id), project_status: slot.status });
});

// ---- Single project ----------------------------------------------------------------

router.get("/:id", optionalAuth, (req, res) => {
  const project = loadSlot(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found." });

  let my_application = null;
  if (req.user?.role === "student") {
    my_application =
      db.prepare("SELECT * FROM applications WHERE slot_id = ? AND student_id = ?").get(project.id, req.user.id) || null;
  }
  res.json({ project, my_application });
});

router.get("/:id/applications", requireAuth, requireRole("professor"), (req, res) => {
  const slot = db.prepare("SELECT * FROM project_slots WHERE id = ?").get(req.params.id);
  if (!slot || slot.user_id !== req.user.id) return res.status(404).json({ error: "Project not found." });
  const applications = db
    .prepare("SELECT * FROM applications WHERE slot_id = ? ORDER BY created_at DESC, id DESC")
    .all(slot.id);
  res.json({ applications });
});

// ---- Professor: create / edit / close ------------------------------------------------

function readSlotBody(body) {
  const title = str(body.title, 140);
  const description = str(body.description, 4000);
  if (!title) return { error: "A project title is required." };
  if (!description) return { error: "Please describe the project." };

  const openings = Number(body.openings ?? 1);
  if (!Number.isInteger(openings) || openings < 1 || openings > 50) {
    return { error: "Openings must be a whole number between 1 and 50." };
  }
  const status = body.status === "filled" ? "filled" : "open";
  return {
    value: {
      title,
      description,
      required_skills: skillList(body.required_skills).join(", ") || null,
      duration: str(body.duration, 60) || null,
      openings,
      status,
    },
  };
}

function ownSlot(req, res) {
  const slot = db.prepare("SELECT * FROM project_slots WHERE id = ?").get(req.params.id);
  if (!slot || slot.user_id !== req.user.id) {
    res.status(404).json({ error: "Project not found." });
    return null;
  }
  return slot;
}

router.post("/", requireAuth, requireRole("professor"), (req, res) => {
  const { error, value } = readSlotBody(req.body);
  if (error) return res.status(400).json({ error });
  const info = db
    .prepare(
      `INSERT INTO project_slots (user_id, title, description, required_skills, duration, openings, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, value.title, value.description, value.required_skills, value.duration, value.openings, value.status);
  res.status(201).json({ project: loadSlot(info.lastInsertRowid) });
});

router.put("/:id", requireAuth, requireRole("professor"), (req, res) => {
  const slot = ownSlot(req, res);
  if (!slot) return;
  const { error, value } = readSlotBody(req.body);
  if (error) return res.status(400).json({ error });
  db.prepare(
    `UPDATE project_slots SET title = ?, description = ?, required_skills = ?, duration = ?, openings = ?, status = ?
     WHERE id = ?`
  ).run(value.title, value.description, value.required_skills, value.duration, value.openings, value.status, slot.id);
  res.json({ project: loadSlot(slot.id) });
});

router.delete("/:id", requireAuth, requireRole("professor"), (req, res) => {
  const slot = ownSlot(req, res);
  if (!slot) return;
  db.prepare("DELETE FROM project_slots WHERE id = ?").run(slot.id);
  res.status(204).send();
});

// ---- Student: apply ---------------------------------------------------------------------

router.post("/:id/apply", requireAuth, requireRole("student"), (req, res) => {
  const slot = db.prepare("SELECT * FROM project_slots WHERE id = ?").get(req.params.id);
  if (!slot) return res.status(404).json({ error: "Project not found." });
  if (slot.status !== "open") return res.status(400).json({ error: "This project is no longer taking applications." });

  const name = str(req.body.name, 100);
  const roll_no = str(req.body.roll_no, 30);
  const message = str(req.body.message, 2000);
  const resume_link = str(req.body.resume_link, 500);

  if (name.length < 2) return res.status(400).json({ error: "Please enter your full name." });
  if (roll_no.length < 3) return res.status(400).json({ error: "Please enter your roll number." });
  if (message.length < 20) {
    return res.status(400).json({ error: "Tell the professor a little more — at least 20 characters." });
  }
  if (resume_link && !isHttpUrl(resume_link)) {
    return res.status(400).json({ error: "The resume link must start with http:// or https://" });
  }

  const student = db.prepare("SELECT email FROM users WHERE id = ?").get(req.user.id);
  try {
    const info = db
      .prepare(
        `INSERT INTO applications (slot_id, student_id, student_name, student_email, roll_no, message, resume_link)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(slot.id, req.user.id, name, student.email, roll_no, message, resume_link || null);
    res.status(201).json({ application: db.prepare("SELECT * FROM applications WHERE id = ?").get(info.lastInsertRowid) });
  } catch (err) {
    if (String(err.code).startsWith("SQLITE_CONSTRAINT")) {
      return res.status(409).json({ error: "You have already applied to this project." });
    }
    throw err;
  }
});

export default router;
