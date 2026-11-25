// End-to-end tests against the real Express app, a throwaway database and a
// throwaway uploads folder. Run with: npm test
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fc-test-"));
process.env.NODE_ENV = "test";
process.env.DB_PATH = path.join(tmp, "test.sqlite3");
process.env.UPLOADS_DIR = path.join(tmp, "uploads");
process.env.CLIENT_ORIGIN = "http://localhost:5173";

let server, base;
const PW = "correct-horse-battery";

before(async () => {
  const { default: app } = await import("../app.js");
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  try {
    const { db } = await import("../db/index.js");
    db.close();
  } catch {}
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {}
});

async function call(method, url, { token, body, form, headers = {} } = {}) {
  const init = { method, headers: { ...headers } };
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (form) init.body = form;
  else if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const res = await fetch(base + url, init);
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}

async function register(role, name, email) {
  const r = await call("POST", "/api/auth/register", { body: { name, email, password: PW, role, department: "CSE" } });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  return { token: r.data.token, id: r.data.user.id };
}

const state = {};

// ---------------------------------------------------------------------------
// The core flow from the brief: register -> build profile -> add course -> post slot -> student applies

test("professor registers and builds a profile", async () => {
  state.prof = await register("professor", "Dr. Test Prof", "Prof@Example.edu");
  const t = state.prof.token;

  const me = await call("GET", "/api/auth/me", { token: t });
  assert.equal(me.data.user.email, "prof@example.edu", "email is stored lower-case");
  assert.equal(me.data.user.password_hash, undefined, "hash never leaves the server");

  const put = await call("PUT", "/api/professors/me", { token: t, body: { name: "Dr. Test Prof", designation: "Professor", department: "CSE", bio: "Hello", research_interests: "Graphs, ML" } });
  assert.equal(put.status, 200);
  assert.equal(put.data.professor.designation, "Professor");

  const edu = await call("POST", "/api/professors/me/education", { token: t, body: { degree: "Ph.D.", institution: "IIT", year_start: "2010", year_end: "2015" } });
  assert.equal(edu.status, 201);
  const pub = await call("POST", "/api/professors/me/publications", { token: t, body: { title: "Quantum Widgets", authors: "T. Prof", venue: "ICML", year: "2024", link: "https://example.org/p", citations: 3 } });
  assert.equal(pub.status, 201);
  const upd = await call("PUT", `/api/professors/me/publications/${pub.data.id}`, { token: t, body: { citations: 9 } });
  assert.equal(upd.data.citations, 9);
  const awd = await call("POST", "/api/professors/me/awards", { token: t, body: { title: "Best Paper", year: "2024" } });
  assert.equal(awd.status, 201);

  const pubProf = await call("GET", `/api/professors/${state.prof.id}`);
  assert.equal(pubProf.status, 200);
  assert.equal(pubProf.data.professor.publications.length, 1);
  assert.equal(pubProf.data.professor.email, "prof@example.edu");
  assert.equal(pubProf.data.professor.password_hash, undefined);
});

test("professor adds a course with syllabus, material link and dates", async () => {
  const t = state.prof.token;
  const c = await call("POST", "/api/courses", { token: t, body: { code: "CS999", title: "Test Driven Everything", semester: "Autumn 2026", credits: 4, description: "desc" } });
  assert.equal(c.status, 201);
  state.course = c.data.course.id;
  assert.equal((await call("POST", `/api/courses/${state.course}/topics`, { token: t, body: { label: "Unit 1", title: "Intro" } })).status, 201);
  assert.equal((await call("POST", `/api/courses/${state.course}/events`, { token: t, body: { kind: "exam", title: "Midsem", event_date: "2030-01-15" } })).status, 201);
  const mat = new FormData();
  mat.append("title", "Reading");
  mat.append("link", "https://example.org/r");
  assert.equal((await call("POST", `/api/courses/${state.course}/materials`, { token: t, form: mat })).status, 201);

  const page = await call("GET", `/api/courses/${state.course}`);
  assert.equal(page.status, 200);
  assert.equal(page.data.course.topics.length, 1);
  assert.equal(page.data.course.materials.length, 1);
});

test("professor posts a project slot; student finds it and applies; professor accepts", async () => {
  const t = state.prof.token;
  const p = await call("POST", "/api/projects", { token: t, body: { title: "Graph Neural Nets", description: "Build things", required_skills: "Python, PyTorch", duration: "3 months", openings: 1 } });
  assert.equal(p.status, 201);
  state.slot = p.data.project.id;

  state.stud = await register("student", "Stu Dent", "stu@example.edu");
  const s = state.stud.token;

  const list = await call("GET", "/api/projects?skill=pytorch");
  assert.ok(list.data.projects.some((x) => x.id === state.slot));

  const apply = { name: "Stu Dent", roll_no: "22CS001", message: "I would love to work on this because I enjoy graphs." };
  assert.equal((await call("POST", `/api/projects/${state.slot}/apply`, { token: s, body: apply })).status, 201);
  assert.equal((await call("POST", `/api/projects/${state.slot}/apply`, { token: s, body: apply })).status, 409, "duplicate application");

  const received = await call("GET", "/api/projects/applications/received", { token: t });
  assert.equal(received.data.applications.length, 1);
  const appId = received.data.applications[0].id;

  const mine = await call("GET", "/api/projects/applications/mine", { token: s });
  assert.equal(mine.data.applications[0].status, "pending");

  assert.equal((await call("PUT", `/api/projects/applications/${appId}`, { token: t, body: { status: "accepted" } })).status, 200);
  const after = await call("GET", `/api/projects/${state.slot}`);
  assert.equal(after.data.project.status, "filled", "accepting the last opening fills the project");
  const mine2 = await call("GET", "/api/projects/applications/mine", { token: s });
  assert.equal(mine2.data.applications[0].status, "accepted");
});

// ---------------------------------------------------------------------------
// Milestone 5: bookmarks and search

test("student bookmarks professors and courses", async () => {
  const s = state.stud.token;
  assert.equal((await call("PUT", `/api/bookmarks/professor/${state.prof.id}`, { token: s })).status, 200);
  assert.equal((await call("PUT", `/api/bookmarks/professor/${state.prof.id}`, { token: s })).status, 200, "saving twice is fine");
  assert.equal((await call("PUT", `/api/bookmarks/course/${state.course}`, { token: s })).status, 200);
  const list = await call("GET", "/api/bookmarks", { token: s });
  assert.equal(list.data.professors.length, 1);
  assert.equal(list.data.courses.length, 1);
  assert.equal(list.data.courses[0].code, "CS999");
  assert.equal((await call("DELETE", `/api/bookmarks/course/${state.course}`, { token: s })).status, 200);
  assert.equal((await call("GET", "/api/bookmarks", { token: s })).data.courses.length, 0);
});

test("bookmark rules: students only, valid targets only, private per user", async () => {
  assert.equal((await call("GET", "/api/bookmarks")).status, 401);
  assert.equal((await call("GET", "/api/bookmarks", { token: state.prof.token })).status, 403);
  assert.equal((await call("PUT", "/api/bookmarks/professor/99999", { token: state.stud.token })).status, 404);
  assert.equal((await call("PUT", `/api/bookmarks/professor/${state.stud.id}`, { token: state.stud.token })).status, 404, "a student id is not a professor");
  assert.equal((await call("PUT", "/api/bookmarks/banana/1", { token: state.stud.token })).status, 400);
  const other = await register("student", "Other Student", "other@example.edu");
  assert.equal((await call("GET", "/api/bookmarks", { token: other.token })).data.professors.length, 0);
});

test("global search finds professors, publications and courses", async () => {
  const r = await call("GET", "/api/search?q=quantum");
  assert.equal(r.status, 200);
  assert.equal(r.data.publications.length, 1);
  assert.equal(r.data.publications[0].professor_name, "Dr. Test Prof");
  const c = await call("GET", "/api/search?q=CS999");
  assert.equal(c.data.courses.length, 1);
  const p = await call("GET", "/api/search?q=graphs");
  assert.equal(p.data.professors.length, 1, "research interests are searched");
  assert.equal((await call("GET", "/api/search?q=a")).status, 400);
  assert.equal((await call("GET", "/api/search")).status, 400);
});

test("search treats % and _ literally and survives SQL injection text", async () => {
  const wild = await call("GET", "/api/search?q=" + encodeURIComponent("%%"));
  assert.equal(wild.status, 200);
  assert.equal(wild.data.professors.length + wild.data.courses.length + wild.data.publications.length, 0);
  const inj = await call("GET", "/api/search?q=" + encodeURIComponent("'; DROP TABLE users; --"));
  assert.equal(inj.status, 200);
  assert.equal((await call("GET", "/api/professors?q=" + encodeURIComponent("' OR 1=1 --"))).data.professors.length, 0);
  assert.equal((await call("GET", `/api/professors/${state.prof.id}`)).status, 200, "tables are intact");
});

// ---------------------------------------------------------------------------
// Milestone 6: security

test("every mutating route rejects anonymous callers", async () => {
  const calls = [
    ["PUT", "/api/professors/me"], ["POST", "/api/professors/me/education"], ["POST", "/api/professors/me/publications"],
    ["POST", "/api/professors/me/awards"], ["POST", "/api/professors/me/photo"], ["POST", "/api/courses"],
    ["PUT", `/api/courses/${state.course}`], ["DELETE", `/api/courses/${state.course}`],
    ["POST", `/api/courses/${state.course}/topics`], ["POST", `/api/courses/${state.course}/events`],
    ["POST", `/api/courses/${state.course}/materials`], ["POST", "/api/projects"],
    ["PUT", `/api/projects/${state.slot}`], ["DELETE", `/api/projects/${state.slot}`],
    ["POST", `/api/projects/${state.slot}/apply`], ["PUT", "/api/projects/applications/1"],
    ["POST", "/api/announcements"], ["DELETE", "/api/announcements/1"],
  ];
  for (const [m, u] of calls) {
    const r = await call(m, u, { body: {} });
    assert.equal(r.status, 401, `${m} ${u} should be 401 but was ${r.status}`);
  }
  assert.equal((await call("GET", "/api/auth/me", { token: "not.a.jwt" })).status, 401);
});

test("students cannot use professor-only routes; professors cannot apply", async () => {
  const s = state.stud.token;
  for (const [m, u] of [["POST", "/api/courses"], ["POST", "/api/projects"], ["PUT", "/api/professors/me"], ["POST", "/api/announcements"]]) {
    assert.equal((await call(m, u, { token: s, body: { title: "x" } })).status, 403, `${m} ${u}`);
  }
  assert.equal((await call("POST", `/api/projects/${state.slot}/apply`, { token: state.prof.token, body: {} })).status, 403);
});

test("professors cannot touch each other's data (404, not 403)", async () => {
  const evil = await register("professor", "Dr. Evil", "evil@example.edu");
  const t = evil.token;
  assert.equal((await call("PUT", `/api/courses/${state.course}`, { token: t, body: { code: "X", title: "hacked" } })).status, 404);
  assert.equal((await call("DELETE", `/api/courses/${state.course}`, { token: t })).status, 404);
  assert.equal((await call("POST", `/api/courses/${state.course}/topics`, { token: t, body: { title: "x" } })).status, 404);
  assert.equal((await call("PUT", `/api/projects/${state.slot}`, { token: t, body: { title: "x", description: "y" } })).status, 404);
  assert.equal((await call("DELETE", `/api/projects/${state.slot}`, { token: t })).status, 404);
  const pubs = (await call("GET", `/api/professors/${state.prof.id}`)).data.professor.publications;
  assert.equal((await call("PUT", `/api/professors/me/publications/${pubs[0].id}`, { token: t, body: { title: "hacked" } })).status, 404);
  assert.equal((await call("DELETE", `/api/professors/me/publications/${pubs[0].id}`, { token: t })).status, 404);
  const apps = (await call("GET", "/api/projects/applications/received", { token: state.prof.token })).data.applications;
  assert.equal((await call("PUT", `/api/projects/applications/${apps[0].id}`, { token: t, body: { status: "rejected" } })).status, 404);
  const own = await call("GET", "/api/projects/applications/received", { token: t });
  assert.equal(own.data.applications.length, 0, "can't read another professor's applications");
});

test("input validation: emails, passwords, links, years", async () => {
  const bad = (body) => call("POST", "/api/auth/register", { body: { name: "A B", role: "student", ...body } });
  assert.equal((await bad({ email: "nope", password: PW })).status, 400);
  assert.equal((await bad({ email: "a@b.co", password: "short" })).status, 400);
  assert.equal((await bad({ email: "a@b.co", password: "x".repeat(80) })).status, 400);
  assert.equal((await bad({ email: "a@b.co", password: PW, role: "admin" })).status, 400);
  assert.equal((await bad({ email: "STU@example.edu", password: PW })).status, 409, "duplicate email, any case");
  assert.equal((await call("POST", "/api/auth/register", { body: { name: { $ne: 1 }, email: "z@z.co", password: PW, role: "student" } })).status, 400, "non-string name");

  const t = state.prof.token;
  const js = await call("POST", "/api/professors/me/publications", { token: t, body: { title: "x", authors: "y", link: "javascript:alert(1)" } });
  assert.equal(js.status, 400, "javascript: links are refused");
  assert.equal((await call("POST", "/api/professors/me/publications", { token: t, body: { title: "x", authors: "y", year: "last year" } })).status, 400);
  assert.equal((await call("POST", "/api/professors/me/publications", { token: t, body: { title: "x", authors: "y", citations: -4 } })).status, 400);
  assert.equal((await call("POST", "/api/professors/me/education", { token: t, body: { degree: "d", institution: "i", year_start: "2020", year_end: "2010" } })).status, 400);
  assert.equal((await call("POST", "/api/courses", { token: t, body: { code: "A", title: "B", credits: 99 } })).status, 400);
  assert.equal((await call("POST", `/api/courses/${state.course}/events`, { token: t, body: { kind: "exam", title: "x", event_date: "2030-02-31" } })).status, 400);
  assert.equal((await call("POST", `/api/courses/${state.course}/materials`, { token: t, form: (() => { const f = new FormData(); f.append("link", "javascript:alert(1)"); return f; })() })).status, 400);
  assert.equal((await call("POST", "/api/projects", { token: t, body: { title: "p", description: "d", openings: 0 } })).status, 400);
});

test("long text is trimmed to its limit rather than stored whole", async () => {
  const t = state.prof.token;
  const r = await call("PUT", "/api/professors/me", { token: t, body: { name: "Dr. Test Prof", bio: "b".repeat(50000) } });
  assert.equal(r.status, 200);
  assert.equal(r.data.professor.bio.length, 4000);
});

test("upload rules: type, disguised files, size", async () => {
  const t = state.prof.token;
  const send = (name, type, bytes) => {
    const f = new FormData();
    f.append("title", "t");
    f.append("file", new Blob([bytes], { type }), name);
    return call("POST", `/api/courses/${state.course}/materials`, { token: t, form: f });
  };
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n");
  assert.equal((await send("notes.pdf", "application/pdf", pdf)).status, 201, "a real PDF is accepted");
  assert.equal((await send("evil.html", "text/html", "<script>alert(1)</script>")).status, 400, "HTML refused");
  assert.equal((await send("evil.svg", "image/svg+xml", "<svg onload=alert(1)/>")).status, 400, "SVG refused");
  assert.equal((await send("fake.pdf", "application/pdf", "<script>alert(1)</script>")).status, 400, "HTML renamed to .pdf refused");
  assert.equal((await send("fake.pdf", "text/html", pdf)).status, 400, "wrong MIME refused");
  assert.equal((await send("big.pdf", "application/pdf", Buffer.concat([pdf, Buffer.alloc(26 * 1024 * 1024)]))).status, 400, "over 25MB refused");

  const mats = (await call("GET", `/api/courses/${state.course}`)).data.course.materials;
  const file = mats.find((m) => m.stored_name);
  const dl = await fetch(`${base}/api/courses/materials/${file.id}/download`);
  assert.equal(dl.status, 200);
  assert.match(dl.headers.get("content-disposition") || "", /attachment/);
  assert.equal((await fetch(`${base}/uploads/..%2f..%2fetc%2fpasswd`)).status === 200, false);

  const photo = (bytes, type, name) => {
    const f = new FormData();
    f.append("photo", new Blob([bytes], { type }), name);
    return call("POST", "/api/professors/me/photo", { token: t, form: f });
  };
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  assert.equal((await photo(png, "image/png", "me.png")).status, 200);
  assert.equal((await photo("<?php evil ?>", "image/png", "me.png")).status, 400, "not really a PNG");
  assert.equal((await photo(png, "application/pdf", "me.pdf")).status, 400);
  assert.equal((await photo(Buffer.concat([png, Buffer.alloc(6 * 1024 * 1024)]), "image/png", "big.png")).status, 400, "over 5MB refused");
});

test("deleting a course removes its files from disk", async () => {
  const t = state.prof.token;
  const c = (await call("POST", "/api/courses", { token: t, body: { code: "TMP1", title: "Temp" } })).data.course.id;
  const f = new FormData();
  f.append("file", new Blob(["hello"], { type: "text/plain" }), "a.txt");
  const m = await call("POST", `/api/courses/${c}/materials`, { token: t, form: f });
  assert.equal(m.status, 201);
  const onDisk = path.join(process.env.UPLOADS_DIR, "materials", m.data.stored_name);
  assert.ok(fs.existsSync(onDisk));
  assert.equal((await call("DELETE", `/api/courses/${c}`, { token: t })).status, 204);
  assert.ok(!fs.existsSync(onDisk));
});

test("auth hygiene: wrong password, unknown user, headers, bad JSON, unknown route", async () => {
  const wrong = await call("POST", "/api/auth/login", { body: { email: "prof@example.edu", password: "wrong-password" } });
  const unknown = await call("POST", "/api/auth/login", { body: { email: "nobody@example.edu", password: "wrong-password" } });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(wrong.data, unknown.data, "same message whether or not the account exists");
  assert.equal((await call("POST", "/api/auth/login", { body: { email: "PROF@example.edu", password: PW } })).status, 200, "login ignores email case");

  const h = (await call("GET", "/api/health")).headers;
  assert.equal(h.get("x-content-type-options"), "nosniff");
  assert.equal(h.get("x-powered-by"), null);
  assert.ok(h.get("content-security-policy"));

  assert.equal((await call("POST", "/api/auth/login", { body: "{bad json", headers: {} })).status, 400);
  assert.equal((await call("GET", "/api/nope")).status, 404);
});

test("CORS only allows the configured origin", async () => {
  const ok = await call("GET", "/api/health", { headers: { Origin: "http://localhost:5173" } });
  assert.equal(ok.headers.get("access-control-allow-origin"), "http://localhost:5173");
  const no = await call("GET", "/api/health", { headers: { Origin: "http://evil.example" } });
  assert.equal(no.headers.get("access-control-allow-origin"), null);
});

test("announcements: professors post and delete only their own", async () => {
  const t = state.prof.token;
  const a = await call("POST", "/api/announcements", { token: t, body: { body: "Office hours moved to Friday." } });
  assert.equal(a.status, 201);
  const evil = await register("professor", "Dr. Other", "other.prof@example.edu");
  assert.equal((await call("DELETE", `/api/announcements/${a.data.id}`, { token: evil.token })).status, 404);
  assert.equal((await call("DELETE", `/api/announcements/${a.data.id}`, { token: t })).status, 204);
});

test("rate limiting caps repeated failed sign-ins (and not successful ones)", async () => {
  // Fresh app instance with limits switched on.
  process.env.TEST_RATE_LIMIT = "1";
  const { default: express } = await import("express");
  const mod = await import(`../app.js?limited=${Date.now()}`);
  const srv = await new Promise((r) => { const s = mod.default.listen(0, "127.0.0.1", () => r(s)); });
  const url = `http://127.0.0.1:${srv.address().port}/api/auth/login`;
  const post = (password) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "prof@example.edu", password }) });
  try {
    for (let i = 0; i < 25; i++) assert.equal((await post(PW)).status, 200, "successful logins are never counted");
    const codes = [];
    for (let i = 0; i < 24; i++) codes.push((await post("wrong-password-x")).status);
    assert.equal(codes[0], 401);
    assert.ok(codes.includes(429), "blocked after too many wrong passwords");
    assert.equal((await post(PW)).status, 429, "even the right password waits once blocked");
  } finally {
    delete process.env.TEST_RATE_LIMIT;
    await new Promise((r) => srv.close(r));
  }
});
