import { Router } from "express";
import db from "../db/index.js";
import { str, likePattern } from "../lib/validate.js";

const router = Router();
const PER_GROUP = 8;

// One search box across professors, publications, courses and open projects.
router.get("/", (req, res) => {
  const q = str(req.query.q, 100);
  if (q.length < 2) {
    return res.status(400).json({ error: "Type at least 2 characters to search." });
  }
  const p = { l: likePattern(q), n: PER_GROUP };
  const E = "ESCAPE '\\'";

  const professors = db
    .prepare(
      `SELECT id, name, designation, department, headline, photo_url, research_interests
       FROM users
       WHERE role = 'professor' AND (name LIKE @l ${E} OR department LIKE @l ${E} OR designation LIKE @l ${E}
         OR research_interests LIKE @l ${E} OR headline LIKE @l ${E})
       ORDER BY name LIMIT @n`
    )
    .all(p);

  const publications = db
    .prepare(
      `SELECT b.id, b.title, b.authors, b.venue, b.year, b.link, b.user_id AS professor_id, u.name AS professor_name
       FROM publications b JOIN users u ON u.id = b.user_id
       WHERE b.title LIKE @l ${E} OR b.authors LIKE @l ${E} OR b.venue LIKE @l ${E}
       ORDER BY b.year DESC, b.id DESC LIMIT @n`
    )
    .all(p);

  const courses = db
    .prepare(
      `SELECT c.id, c.code, c.title, c.semester, c.user_id AS professor_id, u.name AS professor_name
       FROM courses c JOIN users u ON u.id = c.user_id
       WHERE c.code LIKE @l ${E} OR c.title LIKE @l ${E} OR c.description LIKE @l ${E} OR u.name LIKE @l ${E}
       ORDER BY c.code LIMIT @n`
    )
    .all(p);

  const projects = db
    .prepare(
      `SELECT s.id, s.title, s.duration, s.required_skills, s.user_id AS professor_id, u.name AS professor_name
       FROM project_slots s JOIN users u ON u.id = s.user_id
       WHERE s.status = 'open' AND (s.title LIKE @l ${E} OR s.description LIKE @l ${E} OR s.required_skills LIKE @l ${E})
       ORDER BY s.created_at DESC LIMIT @n`
    )
    .all(p);

  res.json({
    query: q,
    professors,
    publications,
    courses,
    projects: projects.map((s) => ({
      ...s,
      skills: (s.required_skills || "").split(",").map((x) => x.trim()).filter(Boolean),
    })),
  });
});

export default router;
