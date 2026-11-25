import { allowedOrigins, isProd } from "./config.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import db from "./db/index.js";
import authRoutes from "./routes/auth.js";
import announcementRoutes from "./routes/announcements.js";
import professorRoutes from "./routes/professors.js";
import courseRoutes from "./routes/courses.js";
import projectRoutes from "./routes/projects.js";
import bookmarkRoutes from "./routes/bookmarks.js";
import searchRoutes from "./routes/search.js";
import { UPLOADS_ROOT } from "./middleware/upload.js";

const app = express();

// Behind Render/Railway/etc. the real client address arrives in X-Forwarded-For.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
app.disable("x-powered-by");

app.use(
  helmet({
    // Uploaded photos and files are loaded by the frontend from another origin.
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // This server only returns JSON and files, never pages, so lock scripts down entirely.
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  })
);

app.use(
  cors({
    origin(origin, cb) {
      // Same-origin tools (curl, tests) send no Origin header.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      if (
        !isProd &&
        (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
          origin.endsWith(".devtunnels.ms") ||
          origin.endsWith(".github.dev") ||
          origin.endsWith(".ngrok-free.app") ||
          origin.endsWith(".ngrok.io") ||
          origin.endsWith(".loca.lt") ||
          origin.endsWith(".pinggy.net") ||
          origin.endsWith(".pinggy-free.link") ||
          origin.endsWith(".trycloudflare.com"))
      ) {
        return cb(null, true);
      }
      cb(null, false);
    },
  })
);
app.use(express.json({ limit: "100kb" }));

// --- Rate limits -----------------------------------------------------------
const limitsOff = process.env.NODE_ENV === "test" && !process.env.TEST_RATE_LIMIT;
const tooMany = (what) => ({ error: `Too many ${what}. Please wait a few minutes and try again.` });
// Only failed sign-ins count, so people who log in normally are never blocked
// but password guessing is capped at 20 wrong tries per 15 minutes per address.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => limitsOff,
  message: tooMany("sign-in attempts"),
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => limitsOff,
  message: tooMany("sign-up attempts"),
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => limitsOff,
  message: tooMany("requests"),
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", registerLimiter);

// Uploaded files. Only types the upload filters allow can ever be here, and
// nosniff stops browsers from treating them as something else.
app.use(
  "/uploads",
  express.static(UPLOADS_ROOT, {
    dotfiles: "deny",
    index: false,
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "FacultyConnect Backend API is up and running!",
    status: "online",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      announcements: "/api/announcements",
      professors: "/api/professors",
      courses: "/api/courses",
      projects: "/api/projects",
      bookmarks: "/api/bookmarks",
      search: "/api/search?q=",
      stats: "/api/stats",
    },
  });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Headline numbers for the explore page.
app.get("/api/stats", (req, res) => {
  const count = (sql) => db.prepare(sql).get().n;
  res.json({
    professors: count("SELECT COUNT(*) AS n FROM users WHERE role = 'professor'"),
    courses: count("SELECT COUNT(*) AS n FROM courses"),
    openProjects: count("SELECT COUNT(*) AS n FROM project_slots WHERE status = 'open'"),
    publications: count("SELECT COUNT(*) AS n FROM publications"),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/professors", professorRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/search", searchRoutes);

// Unknown API paths get JSON, not an HTML error page.
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// Fallback error handler. Malformed JSON and oversized bodies are the client's fault.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "The request body isn't valid JSON." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "That request is too large." });
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our end." });
});

export default app;
