# FacultyConnect

A role-based faculty portfolio and student collaboration platform. Professors
manage their academic profile, courses and research project openings. Students
browse everything, save professors and courses, and apply to projects.

**Core Features:** foundation and auth, faculty profiles, courses,
project slots, dashboards / bookmarks / global search / polish, and
security hardening / seed data / automated tests / deployment files.

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, SQLite (`better-sqlite3`), JWT auth, bcrypt, multer
- **Security middleware:** helmet, express-rate-limit, strict CORS

SQLite keeps the whole app free of external services. For a bigger deployment,
swap `backend/db/index.js` for a Postgres client; the route logic is plain SQL.

## Run it locally

Needs Node 18.18 or newer.

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env        # then set JWT_SECRET (see the file for a one-liner)
npm run seed                # demo professors, courses, projects, a student
npm run dev                 # http://localhost:4000

# 2. Frontend (second terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

**Demo accounts** (password for all: `password123`)

| Role | Email |
|---|---|
| Professor | aanya.kapoor@example.edu, rohan.mehta@example.edu, leela.sundaram@example.edu |
| Student | student@example.edu |

Or register your own account of either type.

Already have a database from an earlier version? Leave
`backend/db/facultyconnect.sqlite3` in place. New tables are added automatically
on start and nothing is deleted.

## What each role can do

**Anyone (no account):** browse faculty, courses and open projects; read syllabi, download
materials; search everything.

**Student:** everything above, plus save professors and courses (star button), apply to a
project (name, roll number, statement, optional resume link), and track application status
on a personal dashboard.

**Professor:** edit their profile (photo, bio, education, publications, awards); create
courses with syllabus topics, materials (upload or link), exams, assignments and
important dates; post project slots, review applications, accept / shortlist / reject,
mark filled; post announcements. Their dashboard shows courses, open slots, pending
applications and shortcuts to edit each one.

## Tests

```bash
cd backend
npm test
```

18 end-to-end tests run against the real app with a throwaway database. They cover
the core flow (register → build profile → add course → post slot → student applies →
professor accepts) plus bookmarks, search, and the security rules below.

## Security measures

- **Auth:** bcrypt (cost 12), 7-day JWTs, no password hash ever returned, generic
  login errors (an unknown email and a wrong password look identical).
- **Authorisation:** every mutating route requires sign-in and the right role. Editing
  or deleting someone else's profile entries, courses or projects returns 404.
- **Rate limits:** 20 failed sign-ins per 15 min and 20 sign-ups per hour per address;
  300 API requests per minute.
- **Validation:** all text is trimmed and length-limited; emails, years, dates, times,
  numbers and links are checked. Links must be `http(s)://`, so `javascript:` links are
  refused by the server, and also never rendered as links by the frontend.
- **SQL injection:** every query is parameterised; search wildcards (`%`, `_`) are escaped.
- **XSS:** React escapes all text; uploads can't contain HTML or SVG; API sends
  `nosniff` and a locked-down Content-Security-Policy.
- **Uploads:** photos ≤ 5 MB (JPEG/PNG/WEBP); course files ≤ 25 MB (PDF, PPT/PPTX,
  DOC/DOCX, TXT, ZIP, PNG, JPG). The MIME type, the extension **and the file's first
  bytes** must all agree. Files are stored under random names and removed from disk
  when their course or photo is replaced or deleted.
- **CORS:** only origins listed in `CLIENT_ORIGIN` may call the API.
- **Startup checks:** in production the server refuses to start with a missing, short
  or placeholder `JWT_SECRET`, and the demo seed refuses to run.

## Deploying

Cannot be done from inside this project's build environment, so the files are ready and
the steps are below. It takes about 10 minutes.

**Backend on Render** (a persistent disk is needed for SQLite and uploads, which needs a
paid instance; Railway works the same way with a volume):

1. Push this folder to GitHub.
2. In Render choose **New → Blueprint** and select the repo. It reads `render.yaml`
   (disk, `JWT_SECRET` auto-generated, `NODE_ENV=production`).
3. When asked, set `CLIENT_ORIGIN` to your frontend URL (step below), e.g. `https://facultyconnect.vercel.app`.
4. Note the API URL, e.g. `https://facultyconnect-api.onrender.com`.
5. Optional demo data: open a Render shell and run `ALLOW_DEMO_SEED=1 npm run seed`.
   Don't do this on a real site, since the demo passwords are public.

**Frontend on Vercel (or Netlify):**

1. Import the repo, set the **root directory** to `frontend`.
2. Add the environment variable `VITE_API_URL` = `https://<your-api-host>/api`
   (it is baked in at build time, so redeploy after changing it).
3. Deploy. `vercel.json` / `public/_redirects` make page refreshes and deep links work.

Then go back to step 3 of the backend and make sure `CLIENT_ORIGIN` matches the final
frontend address exactly (no trailing slash needed).

## Project structure

```
backend/
  app.js, server.js, config.js      app setup, entry point, env checks
  db/        schema.sql, index.js (auto-migrates), seed.js
  middleware/ auth.js (JWT + roles), upload.js (multer + content checks)
  lib/validate.js                   shared input validators
  routes/    auth, professors, courses, projects, bookmarks, search, announcements
  test/flow.test.js                 automated tests
frontend/
  src/pages/       Landing (explore hub), Search, Directory, Profile, Courses, Projects, dashboards
  src/components/  Navbar, Panel, Skeleton, ErrorBoundary, BookmarkButton, editors, ...
  src/context/     AuthContext, BookmarksContext
render.yaml, frontend/vercel.json   deployment
```

## API summary

`/api/auth` · `/api/professors` · `/api/courses` · `/api/projects` · `/api/bookmarks`
(students) · `/api/search?q=` · `/api/announcements` · `/api/stats` · `/api/health`
