import { Router } from "express";
import fs from "fs";
import path from "path";
import db from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { materialUpload, MATERIALS_DIR, hasValidSignature } from "../middleware/upload.js";
import { str, isHttpUrl, isIsoDate, isTime } from "../lib/validate.js";

const router = Router();

const EVENT_KINDS = ["exam", "quiz", "assignment", "date"];
const MATERIAL_CATEGORIES = ["notes", "slides", "reading", "syllabus", "other"];

const COURSE_SELECT = `
  SELECT c.*,
    u.name AS professor_name,
    u.designation AS professor_designation,
    u.department AS professor_department,
    u.photo_url AS professor_photo,
    (SELECT COUNT(*) FROM syllabus_topics t WHERE t.course_id = c.id) AS topic_count,
    (SELECT COUNT(*) FROM course_materials m WHERE m.course_id = c.id) AS material_count
  FROM courses c JOIN users u ON u.id = c.user_id
`;

function loadCourse(id) {
  const course = db.prepare(`${COURSE_SELECT} WHERE c.id = ?`).get(id);
  if (!course) return null;
  course.topics = db
    .prepare("SELECT * FROM syllabus_topics WHERE course_id = ? ORDER BY sort_order ASC, id ASC")
    .all(id);
  course.materials = db
    .prepare("SELECT * FROM course_materials WHERE course_id = ? ORDER BY created_at DESC, id DESC")
    .all(id)
    .map((m) => ({ ...m, file_url: m.stored_name ? `/uploads/materials/${m.stored_name}` : null }));
  course.events = db
    .prepare("SELECT * FROM course_events WHERE course_id = ? ORDER BY event_date ASC, event_time ASC, id ASC")
    .all(id);
  return course;
}

// Every mutating /:id route goes through this: signed in, a professor, and
// the owner of that exact course. Anything else gets a 404 so we don't
// reveal which course ids exist.
function ownsCourse(req, res, next) {
  const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(req.params.id);
  if (!course || course.user_id !== req.user.id) {
    return res.status(404).json({ error: "Course not found." });
  }
  req.course = course;
  next();
}
const guard = [requireAuth, requireRole("professor"), ownsCourse];

function removeStoredFile(storedName) {
  if (!storedName) return;
  const full = path.join(MATERIALS_DIR, path.basename(storedName));
  try { fs.unlinkSync(full); } catch { /* already gone */ }
}

// ---- Public: list & detail --------------------------------------------------

router.get("/", (req, res) => {
  const q = str(req.query.q, 100);
  const semester = str(req.query.semester, 40);
  const professor = Number(req.query.professor) || null;

  const where = [];
  const params = [];
  if (q) {
    const like = `%${q}%`;
    where.push("(c.code LIKE ? OR c.title LIKE ? OR c.description LIKE ? OR u.name LIKE ?)");
    params.push(like, like, like, like);
  }
  if (semester) {
    where.push("c.semester = ?");
    params.push(semester);
  }
  if (professor) {
    where.push("c.user_id = ?");
    params.push(professor);
  }

  const courses = db
    .prepare(`${COURSE_SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY c.code ASC, c.id ASC`)
    .all(...params);

  const semesters = db
    .prepare("SELECT DISTINCT semester FROM courses WHERE semester IS NOT NULL AND semester != '' ORDER BY semester DESC")
    .all()
    .map((r) => r.semester);
  const professors = db
    .prepare("SELECT DISTINCT u.id, u.name FROM courses c JOIN users u ON u.id = c.user_id ORDER BY u.name ASC")
    .all();

  res.json({ courses, semesters, professors });
});

// Next dated items (exams, deadlines...) across every course, for the explore page.
router.get("/upcoming", (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 20);
  const events = db
    .prepare(
      `SELECT e.id, e.kind, e.title, e.event_date, e.event_time, e.marks,
              e.course_id, c.code AS course_code, c.title AS course_title
       FROM course_events e JOIN courses c ON c.id = e.course_id
       WHERE e.event_date >= date('now', 'localtime')
       ORDER BY e.event_date ASC, e.event_time ASC, e.id ASC
       LIMIT ?`
    )
    .all(limit);
  res.json({ events });
});

router.get("/mine", requireAuth, requireRole("professor"), (req, res) => {
  const courses = db
    .prepare(`${COURSE_SELECT} WHERE c.user_id = ? ORDER BY c.created_at DESC, c.id DESC`)
    .all(req.user.id);
  res.json({ courses });
});

router.get("/materials/:mid/download", (req, res) => {
  const m = db.prepare("SELECT * FROM course_materials WHERE id = ?").get(req.params.mid);
  if (!m || !m.stored_name) return res.status(404).json({ error: "File not found." });
  const full = path.join(MATERIALS_DIR, path.basename(m.stored_name));
  if (!fs.existsSync(full)) return res.status(404).json({ error: "File not found." });
  res.download(full, m.file_name || path.basename(full));
});

router.get("/:id", (req, res) => {
  const course = loadCourse(req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found." });
  res.json({ course });
});

// ---- Course CRUD --------------------------------------------------------------

function readCourseBody(body) {
  const code = str(body.code, 20);
  const title = str(body.title, 140);
  if (!code || !title) return { error: "Course code and title are required." };
  let credits = null;
  if (body.credits !== undefined && body.credits !== null && body.credits !== "") {
    credits = Number(body.credits);
    if (!Number.isInteger(credits) || credits < 0 || credits > 30) {
      return { error: "Credits must be a whole number between 0 and 30." };
    }
  }
  return {
    value: {
      code,
      title,
      description: str(body.description, 3000) || null,
      semester: str(body.semester, 40) || null,
      credits,
    },
  };
}

router.post("/", requireAuth, requireRole("professor"), (req, res) => {
  const { error, value } = readCourseBody(req.body);
  if (error) return res.status(400).json({ error });
  const info = db
    .prepare(
      "INSERT INTO courses (user_id, code, title, description, semester, credits) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(req.user.id, value.code, value.title, value.description, value.semester, value.credits);
  res.status(201).json({ course: loadCourse(info.lastInsertRowid) });
});

router.put("/:id", guard, (req, res) => {
  const { error, value } = readCourseBody(req.body);
  if (error) return res.status(400).json({ error });
  db.prepare("UPDATE courses SET code = ?, title = ?, description = ?, semester = ?, credits = ? WHERE id = ?").run(
    value.code, value.title, value.description, value.semester, value.credits, req.course.id
  );
  res.json({ course: loadCourse(req.course.id) });
});

router.delete("/:id", guard, (req, res) => {
  const files = db.prepare("SELECT stored_name FROM course_materials WHERE course_id = ?").all(req.course.id);
  db.prepare("DELETE FROM courses WHERE id = ?").run(req.course.id);
  files.forEach((f) => removeStoredFile(f.stored_name));
  res.status(204).send();
});

// ---- Syllabus topics ------------------------------------------------------------

function readTopicBody(body) {
  const title = str(body.title, 160);
  if (!title) return { error: "A topic needs a title." };
  return { value: { label: str(body.label, 40) || null, title, details: str(body.details, 2000) || null } };
}

router.post("/:id/topics", guard, (req, res) => {
  const { error, value } = readTopicBody(req.body);
  if (error) return res.status(400).json({ error });
  const count = db.prepare("SELECT COUNT(*) AS n FROM syllabus_topics WHERE course_id = ?").get(req.course.id).n;
  const info = db
    .prepare("INSERT INTO syllabus_topics (course_id, label, title, details, sort_order) VALUES (?, ?, ?, ?, ?)")
    .run(req.course.id, value.label, value.title, value.details, count);
  res.status(201).json(db.prepare("SELECT * FROM syllabus_topics WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/:id/topics/:tid", guard, (req, res) => {
  const row = db.prepare("SELECT * FROM syllabus_topics WHERE id = ? AND course_id = ?").get(req.params.tid, req.course.id);
  if (!row) return res.status(404).json({ error: "Topic not found." });
  const { error, value } = readTopicBody(req.body);
  if (error) return res.status(400).json({ error });
  db.prepare("UPDATE syllabus_topics SET label = ?, title = ?, details = ? WHERE id = ?").run(
    value.label, value.title, value.details, row.id
  );
  res.json(db.prepare("SELECT * FROM syllabus_topics WHERE id = ?").get(row.id));
});

router.delete("/:id/topics/:tid", guard, (req, res) => {
  const info = db.prepare("DELETE FROM syllabus_topics WHERE id = ? AND course_id = ?").run(req.params.tid, req.course.id);
  if (!info.changes) return res.status(404).json({ error: "Topic not found." });
  res.status(204).send();
});

// ---- Materials (file upload or external link) -------------------------------------

router.post(
  "/:id/materials",
  guard, // ownership is checked before any file is written to disk
  (req, res, next) => {
    materialUpload.single("file")(req, res, (err) => {
      if (err) {
        const msg = err.code === "LIMIT_FILE_SIZE" ? "That file is larger than 25MB." : err.message;
        return res.status(400).json({ error: msg });
      }
      next();
    });
  },
  (req, res) => {
    const category = MATERIAL_CATEGORIES.includes(req.body.category) ? req.body.category : "notes";
    const link = str(req.body.link, 500);
    let title = str(req.body.title, 160);

    if (req.file && !hasValidSignature(req.file.path)) {
      removeStoredFile(req.file.filename);
      return res.status(400).json({ error: "That file's contents don't match its type. Upload a real PDF, Office file, text file, ZIP or image." });
    }
    if (!req.file && !link) {
      return res.status(400).json({ error: "Choose a file to upload or paste a link." });
    }
    if (!req.file && !isHttpUrl(link)) {
      return res.status(400).json({ error: "The link must start with http:// or https://" });
    }
    if (req.file && link) {
      removeStoredFile(req.file.filename);
      return res.status(400).json({ error: "Add either a file or a link, not both." });
    }
    if (!title) title = req.file ? path.parse(req.file.originalname).name : link;

    const info = db
      .prepare(
        `INSERT INTO course_materials (course_id, title, category, stored_name, file_name, file_size, link)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.course.id,
        title,
        category,
        req.file ? req.file.filename : null,
        req.file ? str(req.file.originalname, 200) : null,
        req.file ? req.file.size : null,
        req.file ? null : link
      );
    const m = db.prepare("SELECT * FROM course_materials WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json({ ...m, file_url: m.stored_name ? `/uploads/materials/${m.stored_name}` : null });
  }
);

router.delete("/:id/materials/:mid", guard, (req, res) => {
  const m = db.prepare("SELECT * FROM course_materials WHERE id = ? AND course_id = ?").get(req.params.mid, req.course.id);
  if (!m) return res.status(404).json({ error: "Material not found." });
  db.prepare("DELETE FROM course_materials WHERE id = ?").run(m.id);
  removeStoredFile(m.stored_name);
  res.status(204).send();
});

// ---- Events: exams, quizzes, assignments, important dates -----------------------------

function readEventBody(body) {
  const kind = str(body.kind, 20);
  const title = str(body.title, 160);
  const event_date = str(body.event_date, 10);
  const event_time = str(body.event_time, 5);
  const link = str(body.link, 500);

  if (!EVENT_KINDS.includes(kind)) return { error: "Unknown entry type." };
  if (!title) return { error: "A title is required." };
  if (!isIsoDate(event_date)) return { error: "Choose a valid date." };
  if (event_time && !isTime(event_time)) return { error: "Time must look like 14:30." };
  if (link && !isHttpUrl(link)) return { error: "The link must start with http:// or https://" };

  return {
    value: {
      kind,
      title,
      description: str(body.description, 2000) || null,
      event_date,
      event_time: event_time || null,
      marks: str(body.marks, 60) || null,
      link: link || null,
    },
  };
}

router.post("/:id/events", guard, (req, res) => {
  const { error, value } = readEventBody(req.body);
  if (error) return res.status(400).json({ error });
  const info = db
    .prepare(
      `INSERT INTO course_events (course_id, kind, title, description, event_date, event_time, marks, link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.course.id, value.kind, value.title, value.description, value.event_date, value.event_time, value.marks, value.link);
  res.status(201).json(db.prepare("SELECT * FROM course_events WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/:id/events/:eid", guard, (req, res) => {
  const row = db.prepare("SELECT * FROM course_events WHERE id = ? AND course_id = ?").get(req.params.eid, req.course.id);
  if (!row) return res.status(404).json({ error: "Entry not found." });
  const { error, value } = readEventBody(req.body);
  if (error) return res.status(400).json({ error });
  db.prepare(
    `UPDATE course_events SET kind = ?, title = ?, description = ?, event_date = ?, event_time = ?, marks = ?, link = ?
     WHERE id = ?`
  ).run(value.kind, value.title, value.description, value.event_date, value.event_time, value.marks, value.link, row.id);
  res.json(db.prepare("SELECT * FROM course_events WHERE id = ?").get(row.id));
});

router.delete("/:id/events/:eid", guard, (req, res) => {
  const info = db.prepare("DELETE FROM course_events WHERE id = ? AND course_id = ?").run(req.params.eid, req.course.id);
  if (!info.changes) return res.status(404).json({ error: "Entry not found." });
  res.status(204).send();
});

export default router;
