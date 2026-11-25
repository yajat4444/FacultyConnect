-- FacultyConnect database schema (SQLite)
-- Milestone 1 creates users + announcements; later milestones extend this file.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK (role IN ('professor', 'student')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  -- fields used mainly by professors, nullable for students
  designation TEXT,
  department TEXT,
  headline TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Milestone 2: Faculty Profile Module
-- (photo_url, bio, office, office_hours, research_interests are added to
-- users via ALTER TABLE in db/index.js, so this file still works against a
-- fresh database and against one created before Milestone 2.)

CREATE TABLE IF NOT EXISTS education (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  year_start TEXT,
  year_end TEXT,
  details TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  venue TEXT,
  year TEXT,
  link TEXT,
  citations INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS awards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  year TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Milestone 3: Course Management Module
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  semester TEXT,
  credits INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS syllabus_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  label TEXT,
  title TEXT NOT NULL,
  details TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS course_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'notes',
  stored_name TEXT,          -- file saved under uploads/materials (NULL for external links)
  file_name TEXT,            -- original file name, used for downloads
  file_size INTEGER,
  link TEXT,                 -- external URL (NULL for uploaded files)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One table for everything with a date: exams, quizzes, assignments and
-- important dates. The course page splits it into tabs by `kind`.
CREATE TABLE IF NOT EXISTS course_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('exam', 'quiz', 'assignment', 'date')),
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,   -- YYYY-MM-DD
  event_time TEXT,            -- HH:MM
  marks TEXT,
  link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Milestone 4: Project Slots Module
CREATE TABLE IF NOT EXISTS project_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT,       -- comma separated
  duration TEXT,
  openings INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_id INTEGER NOT NULL REFERENCES project_slots(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  message TEXT NOT NULL,
  resume_link TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'accepted', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (slot_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_events_course ON course_events(course_id);
CREATE INDEX IF NOT EXISTS idx_slots_user ON project_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_apps_slot ON applications(slot_id);
CREATE INDEX IF NOT EXISTS idx_apps_student ON applications(student_id);

-- Milestone 5: bookmarks (students save professors and courses)
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('professor', 'course')),
  target_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, kind, target_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
