// Milestone 2 seed: a couple of demo professor accounts with full profiles
// (education, publications, awards) so the directory and public profile
// pages have real content, plus the Milestone 1 announcement ticker seed.
// Full sample data across every module lands in Milestone 6.
import bcrypt from "bcryptjs";
import db from "./index.js";

// Every demo account uses the password "password123", so never put this data
// on a public server by accident.
if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "1") {
  console.error("Refusing to seed demo accounts in production. Set ALLOW_DEMO_SEED=1 if you really want them (they all use a public password).");
  process.exit(1);
}

// Announcements. The two milestone-1 placeholders are replaced with real
// content once professors exist (see the bottom of this file).
db.prepare("DELETE FROM announcements WHERE body LIKE '%arrive in the next milestones%' OR body LIKE '%can begin building their profiles%'").run();

const demoProfessors = [
  {
    name: "Dr. Aanya Kapoor",
    email: "aanya.kapoor@example.edu",
    designation: "Associate Professor",
    department: "Computer Science & Engineering",
    headline: "Distributed systems and the theory that keeps them honest.",
    bio: "Aanya works on making large distributed systems easier to reason about, combining formal verification with systems that hold up under real production load. She leads the department's Systems & Verification group.",
    office: "Room 412, CSE Block",
    office_hours: "Tue & Thu, 2:00–4:00 PM",
    research_interests: "Distributed Systems, Formal Verification, Consensus Protocols",
    education: [
      { degree: "Ph.D. in Computer Science", institution: "IIT Bombay", year_start: "2012", year_end: "2017", details: "Dissertation on verified consensus protocols." },
      { degree: "M.Tech in Computer Science", institution: "IIT Bombay", year_start: "2010", year_end: "2012" },
      { degree: "B.Tech in Computer Science", institution: "NIT Trichy", year_start: "2006", year_end: "2010" },
    ],
    publications: [
      { title: "Verified Consensus at Scale", authors: "A. Kapoor, R. Singh", venue: "OSDI", year: "2023", link: "https://example.edu/papers/verified-consensus", citations: 41 },
      { title: "Reasoning About Partial Failures in Distributed Systems", authors: "A. Kapoor, M. Fernandes", venue: "SOSP", year: "2021", link: "https://example.edu/papers/partial-failures", citations: 78 },
      { title: "A Formal Model for Leader Election Under Network Partition", authors: "A. Kapoor", venue: "PODC", year: "2019", link: "https://example.edu/papers/leader-election", citations: 103 },
    ],
    awards: [
      { title: "Early Career Research Award", year: "2022", description: "Department of Science & Technology" },
      { title: "Best Paper Award, SOSP", year: "2021" },
    ],
  },
  {
    name: "Dr. Rohan Mehta",
    email: "rohan.mehta@example.edu",
    designation: "Assistant Professor",
    department: "Electrical Engineering",
    headline: "Power electronics for a grid that runs on renewables.",
    bio: "Rohan's lab designs power converters and control strategies for integrating solar and wind generation into existing grid infrastructure without the instability that usually comes with it.",
    office: "Room 208, EE Building",
    office_hours: "Mon & Wed, 11:00 AM–1:00 PM",
    research_interests: "Power Electronics, Renewable Integration, Grid Stability",
    education: [
      { degree: "Ph.D. in Electrical Engineering", institution: "Georgia Tech", year_start: "2015", year_end: "2020" },
      { degree: "B.Tech in Electrical Engineering", institution: "IIT Delhi", year_start: "2011", year_end: "2015" },
    ],
    publications: [
      { title: "Adaptive Control for Grid-Connected Solar Inverters", authors: "R. Mehta, S. Osei", venue: "IEEE Trans. Power Electronics", year: "2023", link: "https://example.edu/papers/adaptive-control", citations: 19 },
      { title: "Stability Margins in High-Penetration Renewable Grids", authors: "R. Mehta", venue: "IEEE PES General Meeting", year: "2022", link: "https://example.edu/papers/stability-margins", citations: 34 },
    ],
    awards: [
      { title: "IEEE PES Outstanding Young Engineer", year: "2023" },
    ],
  },
  {
    name: "Dr. Leela Sundaram",
    email: "leela.sundaram@example.edu",
    designation: "Professor",
    department: "Mathematics",
    headline: "Combinatorics, graph theory, and the structures in between.",
    bio: "Leela's work sits at the intersection of extremal combinatorics and graph theory, with a long-running interest in Ramsey-type problems. She has advised twelve doctoral students to completion.",
    office: "Room 3, Mathematics Block",
    office_hours: "By appointment",
    research_interests: "Combinatorics, Graph Theory, Ramsey Theory",
    education: [
      { degree: "Ph.D. in Mathematics", institution: "TIFR Mumbai", year_start: "1998", year_end: "2003" },
      { degree: "M.Sc. in Mathematics", institution: "University of Madras", year_start: "1996", year_end: "1998" },
    ],
    publications: [
      { title: "New Bounds on Diagonal Ramsey Numbers", authors: "L. Sundaram, T. Rao", venue: "Journal of Combinatorial Theory A", year: "2020", link: "https://example.edu/papers/ramsey-bounds", citations: 56 },
      { title: "Structural Properties of Sparse Random Graphs", authors: "L. Sundaram", venue: "Combinatorica", year: "2017", link: "https://example.edu/papers/sparse-random-graphs", citations: 88 },
      { title: "On the Chromatic Number of Kneser Graphs Revisited", authors: "L. Sundaram, A. Bose", venue: "European J. Combinatorics", year: "2014", link: "https://example.edu/papers/kneser-graphs", citations: 112 },
    ],
    awards: [
      { title: "Shanti Swarup Bhatnagar Prize", year: "2016" },
      { title: "Fellow, Indian Academy of Sciences", year: "2019" },
    ],
  },
];

const insertUser = db.prepare(`
  INSERT INTO users (role, name, email, password_hash, designation, department, headline, bio, office, office_hours, research_interests)
  VALUES ('professor', @name, @email, @password_hash, @designation, @department, @headline, @bio, @office, @office_hours, @research_interests)
`);
const insertEducation = db.prepare(`
  INSERT INTO education (user_id, degree, institution, year_start, year_end, details, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertPublication = db.prepare(`
  INSERT INTO publications (user_id, title, authors, venue, year, link, citations, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertAward = db.prepare(`
  INSERT INTO awards (user_id, title, year, description, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);

const DEMO_PASSWORD = "password123";
let seededCount = 0;

for (const prof of demoProfessors) {
  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(prof.email);
  if (exists) continue;

  const info = insertUser.run({
    name: prof.name,
    email: prof.email,
    password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10),
    designation: prof.designation,
    department: prof.department,
    headline: prof.headline,
    bio: prof.bio,
    office: prof.office,
    office_hours: prof.office_hours,
    research_interests: prof.research_interests,
  });
  const userId = info.lastInsertRowid;

  prof.education.forEach((e, i) =>
    insertEducation.run(userId, e.degree, e.institution, e.year_start || null, e.year_end || null, e.details || null, i)
  );
  prof.publications.forEach((p, i) =>
    insertPublication.run(userId, p.title, p.authors, p.venue || null, p.year || null, p.link || null, p.citations ?? null, i)
  );
  prof.awards.forEach((a, i) =>
    insertAward.run(userId, a.title, a.year || null, a.description || null, i)
  );

  seededCount++;
}

if (seededCount > 0) {
  console.log(`Seeded ${seededCount} demo professor profile(s). Password for all demo accounts: "${DEMO_PASSWORD}"`);
} else {
  console.log("Demo professors already seeded, skipping.");
}


// ---------------------------------------------------------------------------
// Milestones 3 & 4 demo data: a demo student, courses (with syllabus, dates,
// assignments) and open project slots, so the explore page isn't empty.
// Each block only runs when its table is empty, so re-running is safe.
// ---------------------------------------------------------------------------

function userId(email) {
  return db.prepare("SELECT id FROM users WHERE email = ?").get(email)?.id;
}

if (!userId("student@example.edu")) {
  db.prepare(
    "INSERT INTO users (role, name, email, password_hash) VALUES ('student', 'Meera Joshi', 'student@example.edu', ?)"
  ).run(bcrypt.hashSync(DEMO_PASSWORD, 10));
  console.log('Seeded demo student: student@example.edu / "password123"');
}

const demoCourses = [
  {
    prof: "aanya.kapoor@example.edu",
    code: "UCS503", title: "Software Engineering", semester: "Autumn 2026", credits: 4,
    description: "How real software gets specified, designed, built, tested and maintained by teams. Students work in groups on a semester-long project.",
    topics: [
      ["Unit 1", "Software process models", "Waterfall, incremental, agile; choosing a process for a project."],
      ["Unit 2", "Requirements engineering", "Elicitation, use cases, user stories, SRS documents."],
      ["Unit 3", "Design and architecture", "UML, design patterns, layered and service-based architectures."],
      ["Unit 4", "Testing and quality", "Unit, integration and system testing; code review; metrics."],
      ["Unit 5", "Project management", "Estimation, risk, configuration management, CI/CD."],
    ],
    events: [
      ["date", "Add/drop window closes", "2026-08-14", null, null, null],
      ["quiz", "Quiz 1: Process models", "2026-09-04", "10:00", "10 marks", null],
      ["exam", "Mid-semester exam", "2026-10-12", "09:30", "30 marks", "Covers Units 1 to 3."],
      ["assignment", "Assignment 1: SRS document", "2026-10-02", null, "15 marks", "Write an SRS for your project idea."],
      ["assignment", "Assignment 2: Design report", "2026-11-06", null, "15 marks", "UML diagrams and architecture write-up."],
      ["date", "Project demo week", "2026-11-23", null, null, "Group demos in the lab."],
      ["exam", "End-semester exam", "2026-12-05", "09:30", "40 marks", "Full syllabus."],
    ],
    materials: [["Course handbook", "reading", "https://example.edu/ucs503/handbook"]],
  },
  {
    prof: "aanya.kapoor@example.edu",
    code: "UCS614", title: "Distributed Systems", semester: "Autumn 2026", credits: 3,
    description: "Models of distributed computation, replication and consensus, with a focus on what can go wrong and how protocols cope.",
    topics: [
      ["Unit 1", "Time, clocks and ordering", "Logical clocks, vector clocks, causal order."],
      ["Unit 2", "Replication and consistency", "Primary-backup, quorum systems, consistency models."],
      ["Unit 3", "Consensus", "Paxos and Raft, leader election, failure detectors."],
    ],
    events: [
      ["date", "Reading group starts", "2026-08-20", null, null, null],
      ["assignment", "Assignment: implement Raft leader election", "2026-10-28", null, "20 marks", null],
      ["exam", "End-semester exam", "2026-12-08", "14:00", "50 marks", null],
    ],
    materials: [],
  },
  {
    prof: "rohan.mehta@example.edu",
    code: "UEE402", title: "Power Electronics", semester: "Autumn 2026", credits: 4,
    description: "Switching converters, their control, and their role in connecting renewable sources to the grid.",
    topics: [
      ["Unit 1", "Power semiconductor devices", "Diodes, MOSFETs, IGBTs and their switching behaviour."],
      ["Unit 2", "DC-DC converters", "Buck, boost, buck-boost; continuous and discontinuous modes."],
      ["Unit 3", "Inverters", "Single-phase and three-phase inverters, PWM techniques."],
      ["Unit 4", "Grid-connected systems", "Synchronisation, MPPT, stability considerations."],
    ],
    events: [
      ["quiz", "Quiz 1: Devices", "2026-09-10", "11:00", "10 marks", null],
      ["exam", "Mid-semester exam", "2026-10-13", "11:00", "30 marks", null],
      ["assignment", "Lab report: buck converter", "2026-10-30", null, "10 marks", null],
      ["date", "Course project proposals due", "2026-11-02", null, null, null],
      ["exam", "End-semester exam", "2026-12-10", "09:30", "40 marks", null],
    ],
    materials: [],
  },
  {
    prof: "leela.sundaram@example.edu",
    code: "UMA301", title: "Graph Theory", semester: "Autumn 2026", credits: 3,
    description: "An introduction to graphs, connectivity, colouring and extremal questions, with plenty of proofs.",
    topics: [
      ["Unit 1", "Basics", "Paths, cycles, trees, bipartite graphs."],
      ["Unit 2", "Connectivity and matchings", "Menger's theorem, Hall's theorem, König's theorem."],
      ["Unit 3", "Colouring", "Vertex and edge colouring, Brooks' theorem, chromatic polynomials."],
      ["Unit 4", "Extremal graph theory", "Turán's theorem, Ramsey's theorem."],
    ],
    events: [
      ["assignment", "Problem set 1", "2026-09-18", null, "10 marks", null],
      ["exam", "Mid-semester exam", "2026-10-14", "14:00", "30 marks", null],
      ["assignment", "Problem set 2", "2026-11-13", null, "10 marks", null],
      ["exam", "End-semester exam", "2026-12-12", "09:30", "50 marks", null],
    ],
    materials: [],
  },
];

if (db.prepare("SELECT COUNT(*) AS n FROM courses").get().n === 0) {
  const insCourse = db.prepare(
    "INSERT INTO courses (user_id, code, title, description, semester, credits) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insTopic = db.prepare(
    "INSERT INTO syllabus_topics (course_id, label, title, details, sort_order) VALUES (?, ?, ?, ?, ?)"
  );
  const insEvent = db.prepare(
    "INSERT INTO course_events (course_id, kind, title, event_date, event_time, marks, description) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const insMaterial = db.prepare(
    "INSERT INTO course_materials (course_id, title, category, link) VALUES (?, ?, ?, ?)"
  );
  let n = 0;
  for (const c of demoCourses) {
    const uid = userId(c.prof);
    if (!uid) continue;
    const cid = insCourse.run(uid, c.code, c.title, c.description, c.semester, c.credits).lastInsertRowid;
    c.topics.forEach((t, i) => insTopic.run(cid, t[0], t[1], t[2], i));
    c.events.forEach((e) => insEvent.run(cid, e[0], e[1], e[2], e[3], e[4], e[5]));
    c.materials.forEach((m) => insMaterial.run(cid, m[0], m[1], m[2]));
    n++;
  }
  console.log(`Seeded ${n} demo course(s).`);
}

const demoProjects = [
  {
    prof: "aanya.kapoor@example.edu",
    title: "Model checking a Raft implementation",
    description: "We are verifying an open-source Raft library with TLA+ and a model checker. You will write specifications for log replication, run them against the implementation's traces, and report any mismatches.",
    skills: "TLA+, Go, Distributed systems", duration: "4 months", openings: 2,
  },
  {
    prof: "aanya.kapoor@example.edu",
    title: "Fault-injection testing for microservices",
    description: "Build a small tool that injects network partitions and delays into a Docker-based microservice demo and records how each service behaves. Good first research project for a systems-minded student.",
    skills: "Docker, Python, Linux", duration: "3 months", openings: 1,
  },
  {
    prof: "rohan.mehta@example.edu",
    title: "Hardware-in-the-loop test bench for solar inverters",
    description: "Help set up a test bench that connects an inverter controller to a simulated grid. Work includes wiring, writing firmware for the data logger, and running the first stability experiments.",
    skills: "Embedded C, Simulink, Circuit design", duration: "6 months", openings: 2,
  },
  {
    prof: "leela.sundaram@example.edu",
    title: "Computer search for small Ramsey colourings",
    description: "Use SAT solvers and clever symmetry breaking to look for new lower bounds on small Ramsey numbers. Comfort with proofs and some programming is enough to start.",
    skills: "Python, SAT solvers, Combinatorics", duration: "5 months", openings: 1,
  },
  {
    prof: "leela.sundaram@example.edu",
    title: "Literature survey: Kneser graph colourings",
    description: "Read and summarise twenty years of work on the chromatic number of Kneser-type graphs. This slot has been filled for the current semester.",
    skills: "LaTeX, Graph theory", duration: "2 months", openings: 1, status: "filled",
  },
];

if (db.prepare("SELECT COUNT(*) AS n FROM project_slots").get().n === 0) {
  const insSlot = db.prepare(
    "INSERT INTO project_slots (user_id, title, description, required_skills, duration, openings, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  let n = 0;
  for (const p of demoProjects) {
    const uid = userId(p.prof);
    if (!uid) continue;
    insSlot.run(uid, p.title, p.description, p.skills, p.duration, p.openings, p.status || "open");
    n++;
  }
  console.log(`Seeded ${n} demo project slot(s).`);
}

if (db.prepare("SELECT COUNT(*) AS n FROM announcements").get().n === 0) {
  const insAnn = db.prepare("INSERT INTO announcements (user_id, body, created_at) VALUES (?, ?, ?)");
  const items = [
    ["aanya.kapoor@example.edu", "UCS503: Assignment 1 (SRS document) is due on 2 October. Template is under Materials.", "2026-09-28 10:00:00"],
    ["rohan.mehta@example.edu", "Two project slots open on the solar inverter test bench. Apply from the Open Projects page.", "2026-10-05 15:30:00"],
    ["leela.sundaram@example.edu", "UMA301 mid-semester exam is on 14 October, 2:00 PM. Syllabus: Units 1 to 3.", "2026-10-08 09:15:00"],
    ["aanya.kapoor@example.edu", "UCS503 mid-semester exam: 12 October, 9:30 AM. Bring your ID card.", "2026-10-09 17:45:00"],
  ];
  let n = 0;
  for (const [email, body, at] of items) {
    const uid = userId(email);
    if (uid) { insAnn.run(uid, body, at); n++; }
  }
  console.log(`Seeded ${n} announcement(s).`);
}

// A few saved items so the demo student's dashboard isn't empty.
{
  const sid = userId("student@example.edu");
  if (sid && db.prepare("SELECT COUNT(*) AS n FROM bookmarks WHERE user_id = ?").get(sid).n === 0) {
    const insB = db.prepare("INSERT OR IGNORE INTO bookmarks (user_id, kind, target_id) VALUES (?, ?, ?)");
    const prof = userId("aanya.kapoor@example.edu");
    if (prof) insB.run(sid, "professor", prof);
    const course = db.prepare("SELECT id FROM courses ORDER BY id LIMIT 1").get();
    if (course) insB.run(sid, "course", course.id);
    console.log("Seeded demo bookmarks.");
  }
}
