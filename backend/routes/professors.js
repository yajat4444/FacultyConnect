import { Router } from "express";
import path from "path";
import db from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { photoUpload, hasValidSignature, removeFileQuietly, UPLOADS_ROOT } from "../middleware/upload.js";
import { str, isHttpUrl, isYear, likePattern } from "../lib/validate.js";

const router = Router();

const PROFILE_FIELDS = [
  "id", "name", "email", "designation", "department", "headline",
  "photo_url", "bio", "office", "office_hours", "research_interests", "created_at",
];

function selectProfile(id) {
  const cols = PROFILE_FIELDS.join(", ");
  return db
    .prepare(`SELECT ${cols} FROM users WHERE id = ? AND role = 'professor'`)
    .get(id);
}

function attachSubResources(profile) {
  if (!profile) return profile;
  profile.education = db
    .prepare("SELECT * FROM education WHERE user_id = ? ORDER BY sort_order ASC, year_start DESC")
    .all(profile.id);
  profile.publications = db
    .prepare("SELECT * FROM publications WHERE user_id = ? ORDER BY sort_order ASC, year DESC")
    .all(profile.id);
  profile.awards = db
    .prepare("SELECT * FROM awards WHERE user_id = ? ORDER BY sort_order ASC, year DESC")
    .all(profile.id);
  profile.courses = db
    .prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM syllabus_topics st WHERE st.course_id = c.id) AS topic_count,
        (SELECT COUNT(*) FROM course_materials cm WHERE cm.course_id = c.id) AS material_count
      FROM courses c
      WHERE c.user_id = ?
      ORDER BY c.code ASC
    `)
    .all(profile.id);
  const rawProjects = db
    .prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM applications a WHERE a.slot_id = p.id AND a.status = 'accepted') AS accepted_count,
        (SELECT COUNT(*) FROM applications a WHERE a.slot_id = p.id) AS application_count
      FROM project_slots p
      WHERE p.user_id = ?
      ORDER BY p.status ASC, p.created_at DESC
    `)
    .all(profile.id);
  profile.projects = rawProjects.map((p) => ({
    ...p,
    skills: (p.required_skills || "").split(",").map((s) => s.trim()).filter(Boolean),
  }));
  return profile;
}

// ---- Directory -------------------------------------------------------

router.get("/", (req, res) => {
  const q = str(req.query.q, 100);
  const cols = PROFILE_FIELDS.join(", ");

  let rows;
  if (q) {
    const like = likePattern(q);
    rows = db
      .prepare(
        `SELECT ${cols} FROM users
         WHERE role = 'professor'
           AND (name LIKE @l ESCAPE '\\' OR department LIKE @l ESCAPE '\\'
                OR research_interests LIKE @l ESCAPE '\\' OR designation LIKE @l ESCAPE '\\')
         ORDER BY name ASC`
      )
      .all({ l: like });
  } else {
    rows = db
      .prepare(`SELECT ${cols} FROM users WHERE role = 'professor' ORDER BY name ASC`)
      .all();
  }

  res.json({ professors: rows });
});

// ---- Own profile (must come before the /:id param route) -------------

router.get("/me", requireAuth, requireRole("professor"), (req, res) => {
  const profile = selectProfile(req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });
  res.json({ professor: attachSubResources(profile) });
});

router.put("/me", requireAuth, requireRole("professor"), (req, res) => {
  const b = req.body || {};
  const name = str(b.name, 100);
  if (!name) return res.status(400).json({ error: "Name can't be empty." });

  db.prepare(`
    UPDATE users SET
      name = @name,
      designation = @designation,
      department = @department,
      headline = @headline,
      bio = @bio,
      office = @office,
      office_hours = @office_hours,
      research_interests = @research_interests
    WHERE id = @id
  `).run({
    id: req.user.id,
    name,
    designation: str(b.designation, 100) || null,
    department: str(b.department, 100) || null,
    headline: str(b.headline, 200) || null,
    bio: str(b.bio, 4000) || null,
    office: str(b.office, 100) || null,
    office_hours: str(b.office_hours, 200) || null,
    research_interests: str(b.research_interests, 300) || null,
  });

  res.json({ professor: attachSubResources(selectProfile(req.user.id)) });
});

router.post(
  "/me/photo",
  requireAuth,
  requireRole("professor"),
  (req, res, next) => {
    photoUpload.single("photo")(req, res, (err) => {
      if (err) {
        const msg = err.code === "LIMIT_FILE_SIZE" ? "That photo is larger than 5MB." : err.message;
        return res.status(400).json({ error: msg });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No photo was uploaded." });
    if (!hasValidSignature(req.file.path)) {
      removeFileQuietly(req.file.path);
      return res.status(400).json({ error: "That file isn't a valid JPEG, PNG or WEBP image." });
    }
    const previous = db.prepare("SELECT photo_url FROM users WHERE id = ?").get(req.user.id)?.photo_url;
    const photoUrl = `/uploads/photos/${path.basename(req.file.path)}`;
    db.prepare("UPDATE users SET photo_url = ? WHERE id = ?").run(photoUrl, req.user.id);
    // Don't keep every old photo around forever.
    if (previous && previous.startsWith("/uploads/photos/")) {
      removeFileQuietly(path.join(UPLOADS_ROOT, "photos", path.basename(previous)));
    }
    res.json({ photo_url: photoUrl });
  }
);

// ---- Shared validation for the three sub-resources --------------------

function optYear(value, label) {
  const v = str(value, 4);
  if (v && !isYear(v)) return { error: `${label} must be a four-digit year, like 2019.` };
  return { value: v || null };
}

function parseEducation(b) {
  const degree = str(b.degree, 150);
  const institution = str(b.institution, 150);
  if (!degree || !institution) return { error: "Degree and institution are required." };
  const ys = optYear(b.year_start, "Start year");
  if (ys.error) return ys;
  const ye = optYear(b.year_end, "End year");
  if (ye.error) return ye;
  if (ys.value && ye.value && Number(ye.value) < Number(ys.value)) {
    return { error: "End year can't be before the start year." };
  }
  return { data: { degree, institution, year_start: ys.value, year_end: ye.value, details: str(b.details, 500) || null } };
}

function parsePublication(b) {
  const title = str(b.title, 300);
  const authors = str(b.authors, 300);
  if (!title || !authors) return { error: "Title and authors are required." };
  const yr = optYear(b.year, "Year");
  if (yr.error) return yr;
  const link = str(b.link, 500);
  if (link && !isHttpUrl(link)) return { error: "The link must start with http:// or https://." };
  let citations = null;
  if (b.citations !== undefined && b.citations !== null && String(b.citations).trim() !== "") {
    citations = Number(b.citations);
    if (!Number.isInteger(citations) || citations < 0 || citations > 10000000) {
      return { error: "Citations must be a whole number, zero or more." };
    }
  }
  return { data: { title, authors, venue: str(b.venue, 200) || null, year: yr.value, link: link || null, citations } };
}

function parseAward(b) {
  const title = str(b.title, 200);
  if (!title) return { error: "Title is required." };
  const yr = optYear(b.year, "Year");
  if (yr.error) return yr;
  return { data: { title, year: yr.value, description: str(b.description, 500) || null } };
}

// ---- Education CRUD (own profile only) --------------------------------

router.post("/me/education", requireAuth, requireRole("professor"), (req, res) => {
  const { data, error } = parseEducation(req.body || {});
  if (error) return res.status(400).json({ error });
  const count = db.prepare("SELECT COUNT(*) AS n FROM education WHERE user_id = ?").get(req.user.id).n;
  if (count >= 30) return res.status(400).json({ error: "You've reached the limit of 30 education entries." });
  const info = db.prepare(`
    INSERT INTO education (user_id, degree, institution, year_start, year_end, details, sort_order)
    VALUES (@user_id, @degree, @institution, @year_start, @year_end, @details, @sort_order)
  `).run({ ...data, user_id: req.user.id, sort_order: count });
  res.status(201).json(db.prepare("SELECT * FROM education WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/me/education/:id", requireAuth, requireRole("professor"), (req, res) => {
  const row = db.prepare("SELECT * FROM education WHERE id = ?").get(req.params.id);
  if (!row || row.user_id !== req.user.id) return res.status(404).json({ error: "Entry not found." });
  const { data, error } = parseEducation({ ...row, ...(req.body || {}) });
  if (error) return res.status(400).json({ error });
  db.prepare(`
    UPDATE education SET degree = @degree, institution = @institution, year_start = @year_start,
      year_end = @year_end, details = @details WHERE id = @id
  `).run({ ...data, id: row.id });
  res.json(db.prepare("SELECT * FROM education WHERE id = ?").get(row.id));
});

router.delete("/me/education/:id", requireAuth, requireRole("professor"), (req, res) => {
  const row = db.prepare("SELECT * FROM education WHERE id = ?").get(req.params.id);
  if (!row || row.user_id !== req.user.id) return res.status(404).json({ error: "Entry not found." });
  db.prepare("DELETE FROM education WHERE id = ?").run(row.id);
  res.status(204).send();
});

// ---- Publications CRUD (own profile only) -----------------------------

router.post("/me/publications", requireAuth, requireRole("professor"), (req, res) => {
  const { data, error } = parsePublication(req.body || {});
  if (error) return res.status(400).json({ error });
  const count = db.prepare("SELECT COUNT(*) AS n FROM publications WHERE user_id = ?").get(req.user.id).n;
  if (count >= 500) return res.status(400).json({ error: "You've reached the limit of 500 publications." });
  const info = db.prepare(`
    INSERT INTO publications (user_id, title, authors, venue, year, link, citations, sort_order)
    VALUES (@user_id, @title, @authors, @venue, @year, @link, @citations, @sort_order)
  `).run({ ...data, user_id: req.user.id, sort_order: count });
  res.status(201).json(db.prepare("SELECT * FROM publications WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/me/publications/:id", requireAuth, requireRole("professor"), (req, res) => {
  const row = db.prepare("SELECT * FROM publications WHERE id = ?").get(req.params.id);
  if (!row || row.user_id !== req.user.id) return res.status(404).json({ error: "Publication not found." });
  const { data, error } = parsePublication({ ...row, ...(req.body || {}) });
  if (error) return res.status(400).json({ error });
  db.prepare(`
    UPDATE publications SET title = @title, authors = @authors, venue = @venue, year = @year,
      link = @link, citations = @citations WHERE id = @id
  `).run({ ...data, id: row.id });
  res.json(db.prepare("SELECT * FROM publications WHERE id = ?").get(row.id));
});

router.delete("/me/publications/:id", requireAuth, requireRole("professor"), (req, res) => {
  const row = db.prepare("SELECT * FROM publications WHERE id = ?").get(req.params.id);
  if (!row || row.user_id !== req.user.id) return res.status(404).json({ error: "Publication not found." });
  db.prepare("DELETE FROM publications WHERE id = ?").run(row.id);
  res.status(204).send();
});

// ---- Awards CRUD (own profile only) ------------------------------------

router.post("/me/awards", requireAuth, requireRole("professor"), (req, res) => {
  const { data, error } = parseAward(req.body || {});
  if (error) return res.status(400).json({ error });
  const count = db.prepare("SELECT COUNT(*) AS n FROM awards WHERE user_id = ?").get(req.user.id).n;
  if (count >= 100) return res.status(400).json({ error: "You've reached the limit of 100 awards." });
  const info = db.prepare(`
    INSERT INTO awards (user_id, title, year, description, sort_order)
    VALUES (@user_id, @title, @year, @description, @sort_order)
  `).run({ ...data, user_id: req.user.id, sort_order: count });
  res.status(201).json(db.prepare("SELECT * FROM awards WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/me/awards/:id", requireAuth, requireRole("professor"), (req, res) => {
  const row = db.prepare("SELECT * FROM awards WHERE id = ?").get(req.params.id);
  if (!row || row.user_id !== req.user.id) return res.status(404).json({ error: "Award not found." });
  const { data, error } = parseAward({ ...row, ...(req.body || {}) });
  if (error) return res.status(400).json({ error });
  db.prepare("UPDATE awards SET title = @title, year = @year, description = @description WHERE id = @id")
    .run({ ...data, id: row.id });
  res.json(db.prepare("SELECT * FROM awards WHERE id = ?").get(row.id));
});

router.delete("/me/awards/:id", requireAuth, requireRole("professor"), (req, res) => {
  const row = db.prepare("SELECT * FROM awards WHERE id = ?").get(req.params.id);
  if (!row || row.user_id !== req.user.id) return res.status(404).json({ error: "Award not found." });
  db.prepare("DELETE FROM awards WHERE id = ?").run(row.id);
  res.status(204).send();
});

// ---- Public profile (must come after all /me routes) -------------------

router.get("/:id", (req, res) => {
  const profile = selectProfile(req.params.id);
  if (!profile) return res.status(404).json({ error: "Professor not found." });
  res.json({ professor: attachSubResources(profile) });
});

export default router;
