import { SkeletonList } from "../components/Skeleton.jsx";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, API_ORIGIN } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EVENT_KINDS, formatTime, relativeDay, shortName, timeAgo } from "../lib/format.js";
import AnnouncementTicker from "../components/AnnouncementTicker.jsx";
import ProjectRow from "../components/ProjectRow.jsx";
import DateBlock from "../components/DateBlock.jsx";
import Badge from "../components/Badge.jsx";

const SCOPES = [
  { key: "all", label: "Everything", path: "/search", placeholder: "A name, paper title, course code or skill" },
  { key: "professors", label: "Faculty", path: "/professors", placeholder: "Name, department or research area" },
  { key: "courses", label: "Courses", path: "/courses", placeholder: "Course code, title or professor" },
  { key: "projects", label: "Projects", path: "/projects", placeholder: "Topic, skill or professor" },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scope, setScope] = useState("all");
  const [q, setQ] = useState("");
  const [d, setD] = useState({ stats: null, professors: [], courses: [], projects: [], announcements: [], upcoming: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.stats(), api.professors(), api.courses({}), api.projects({}), api.announcements(), api.upcomingEvents(5),
    ]).then(([stats, profs, courses, projects, ann, upcoming]) => {
      const ok = (r, pick, fallback) => (r.status === "fulfilled" ? pick(r.value) : fallback);
      setD({
        stats: ok(stats, (v) => v, null),
        professors: ok(profs, (v) => v.professors, []),
        courses: ok(courses, (v) => v.courses, []),
        projects: ok(projects, (v) => v.projects, []),
        announcements: ok(ann, (v) => v.announcements, []),
        // Filter out assignment deadlines – those are course-specific
        upcoming: ok(upcoming, (v) => v.events, []).filter((e) => e.kind !== "assignment"),
      });
      setLoaded(true);
    });
  }, []);

  const active = SCOPES.find((s) => s.key === scope);

  function search(e) {
    e.preventDefault();
    navigate(`${active.path}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  }

  const quick = [
    { to: "/professors", label: "Faculty", value: d.stats?.professors, note: "profiles, publications and research interests", accent: "text-teal" },
    { to: "/courses", label: "Courses", value: d.stats?.courses, note: "syllabi, materials and exam dates", accent: "text-olive" },
    { to: "/projects", label: "Open projects", value: d.stats?.openProjects, note: "positions you can apply to", accent: "text-teal" },
  ];

  return (
    <>
      {/* ── Hero search band ─────────────────────────────── */}
      <section className="relative overflow-hidden hero-mesh">
        {/* Decorative rings */}
        <div className="ring-deco" style={{width:480,height:480,right:"-120px",top:"-160px",opacity:0.5}} />
        <div className="ring-deco" style={{width:300,height:300,right:"60px",top:"-60px",opacity:0.3}} />
        <div className="ring-deco" style={{width:220,height:220,left:"-60px",bottom:"-80px",opacity:0.25}} />
        {/* Subtle grid dots */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #F7FCFC 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-14 sm:py-24">
          <p className="font-display italic" style={{color:"#83C4C4"}}>
            {user ? `Welcome back, ${shortName(user.name)}` : "Everything in the department, in one place"}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl max-w-2xl leading-[1.1]" style={{color:"#FDFBF7"}}>
            Find a professor, a course or a project.
          </h1>

          <form onSubmit={search} className="mt-8 max-w-2xl" role="search">
            <div className="inline-flex border overflow-hidden" style={{borderColor:"rgba(131,196,196,0.4)",background:"rgba(15,32,32,0.5)"}} role="group" aria-label="What to search">
              {SCOPES.map((s) => (
                <button
                  type="button"
                  key={s.key}
                  aria-pressed={scope === s.key}
                  onClick={() => setScope(s.key)}
                  className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                    scope === s.key
                      ? "text-ink font-semibold"
                      : "hover:text-white"
                  }`}
                  style={scope === s.key ? {background:"#F7FCFC",color:"#0F2020"} : {color:"rgba(247,252,252,0.75)"}}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex border bg-white" style={{borderColor:"#F7FCFC"}}>
              <label htmlFor="hub-search" className="sr-only">Search {active.label}</label>
              <input
                id="hub-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={active.placeholder}
                className="min-w-0 flex-1 bg-transparent px-5 py-4 text-ink placeholder:text-ink-faint focus:outline-none"
              />
              <button type="submit" className="px-7 text-sm font-medium text-white transition-colors" style={{background:"#3B9F9F"}} onMouseEnter={e=>e.target.style.background="#2C7676"} onMouseLeave={e=>e.target.style.background="#3B9F9F"}>
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <AnnouncementTicker />

      {/* ── Stats strip ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 border-y border-rule divide-y md:divide-y-0 md:divide-x divide-rule">
          {quick.map((item, i) => (
            <Link key={item.to} to={item.to} className="group flex items-baseline gap-5 px-2 md:px-8 py-7 first:md:pl-0">
              <span
                className="font-display text-5xl w-16 shrink-0 tabular-nums"
                style={{color: i===0 ? "#3B9F9F" : i===1 ? "#4A7C59" : "#2C7676"}}
              >
                {item.value ?? "–"}
              </span>
              <span>
                <span className="block font-display text-xl text-ink group-hover:text-teal transition-colors">{item.label} →</span>
                <span className="block mt-0.5 text-sm text-ink-soft">{item.note}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-14 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-14">
        {/* Main column */}
        <div className="space-y-14 min-w-0">
          {/* Open Projects */}
          <section>
            <SectionHead title="Open projects" to="/projects" cta="All open projects" />
            {!loaded ? <Loading /> : d.projects.length === 0 ? (
              <p className="py-6 text-sm text-ink-faint">No projects are open right now. Check back soon.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {d.projects.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="group block rounded-xl border border-rule bg-white shadow-sm hover:shadow-md hover:border-teal transition-all duration-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-olive/10 text-olive border border-olive/20">
                        {p.openings} {p.openings === 1 ? "seat" : "seats"} available
                      </span>
                    </div>
                    <p className="font-display text-base text-ink group-hover:text-teal transition-colors leading-snug mb-1">{p.title}</p>
                    <p className="text-xs text-ink-faint">{p.professor_name}{p.professor_department && ` · ${p.professor_department}`}</p>
                    {p.description && <p className="mt-2 text-xs text-ink-faint line-clamp-2">{p.description}</p>}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Courses */}
          <section>
            <SectionHead title="Courses" to="/courses" cta="Full catalogue" />
            {!loaded ? <Loading /> : d.courses.length === 0 ? (
              <p className="py-6 text-sm text-ink-faint">No courses have been added yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {d.courses.slice(0, 6).map((c) => (
                  <Link
                    key={c.id}
                    to={`/courses/${c.id}`}
                    className="group block rounded-xl border border-rule bg-white shadow-sm hover:shadow-md hover:border-teal transition-all duration-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-sm text-teal font-semibold">{c.code}</span>
                      {c.semester && <span className="text-xs text-ink-faint">{c.semester}</span>}
                    </div>
                    <p className="font-display text-base text-ink group-hover:text-teal transition-colors leading-snug">{c.title}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">{c.professor_name}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Side column */}
        <aside className="space-y-10">
          {/* Coming up — lectures, exams, and course dates only (not assignment deadlines) */}
          {d.upcoming.length > 0 && (
            <section>
              <SectionHead title="Coming up" small />
              <ul className="border-t border-ink divide-y divide-rule">
                {d.upcoming.map((e) => (
                  <li key={e.id}>
                    <Link
                      to={`/courses/${e.course_id}?tab=${e.kind === "date" ? "dates" : "schedule"}`}
                      className="group flex gap-4 py-4"
                    >
                      <DateBlock date={e.event_date} />
                      <span className="min-w-0">
                        <span className="block text-sm text-ink group-hover:text-teal transition-colors">{e.title}</span>
                        <span className="block text-xs text-ink-faint mt-0.5">
                          {e.course_code} · {relativeDay(e.event_date)}{e.event_time && `, ${formatTime(e.event_time)}`}
                        </span>
                        <span className="mt-1 inline-block">
                          <Badge tone={EVENT_KINDS[e.kind]?.tone ?? "muted"}>{EVENT_KINDS[e.kind]?.label ?? e.kind}</Badge>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Announcements */}
          <section>
            <SectionHead title="Announcements" small />
            {!loaded ? <Loading /> : d.announcements.length === 0 ? (
              <p className="py-4 text-sm text-ink-faint">Nothing posted yet.</p>
            ) : (
              <ul className="border-t border-ink divide-y divide-rule">
                {d.announcements.slice(0, 5).map((a) => (
                  <li key={a.id} className="py-4">
                    <p className="text-sm text-ink leading-snug">{a.body}</p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {a.user_id ? (
                        <Link to={`/professor/${a.user_id}`} className="link-underline">{a.author_name}</Link>
                      ) : "FacultyConnect"} · {timeAgo(a.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Faculty quick list */}
          <section>
            <SectionHead title="Faculty" to="/professors" cta="Everyone" small />
            {!loaded ? <Loading /> : (
              <ul className="border-t border-ink divide-y divide-rule">
                {d.professors.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link to={`/professor/${p.id}`} className="group flex items-center gap-3 py-3">
                      <span className="h-9 w-9 shrink-0 overflow-hidden border border-rule bg-paper-raised flex items-center justify-center font-display text-ink-faint">
                        {p.photo_url ? <img src={`${API_ORIGIN}${p.photo_url}`} alt="" className="h-full w-full object-cover" /> : p.name.charAt(0)}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-ink group-hover:text-teal transition-colors truncate">{p.name}</span>
                        <span className="block text-xs text-ink-faint truncate">{p.department || p.designation}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Auth prompt / dashboard link */}
          <section className="border-l-2 border-teal pl-4 py-1">
            <div className="text-sm text-ink-soft space-y-3">
              {user ? (
                <>
                  <p className="font-display text-lg text-ink">Your space</p>
                  <Link
                    to={user.role === "professor" ? "/dashboard/professor" : "/dashboard/student"}
                    className="block text-teal link-underline w-fit"
                  >
                    {user.role === "professor" ? "Open your dashboard →" : "See your applications →"}
                  </Link>
                </>
              ) : (
                <>
                  <p>Browsing is open to everyone. Sign in to apply for a project or to manage your own page.</p>
                  <div className="flex gap-3 pt-1">
                    <Link to="/login" className="btn-primary !py-2 !px-4 text-xs">Sign in</Link>
                    <Link to="/register" className="btn-secondary !py-2 !px-4 text-xs">Register</Link>
                  </div>
                </>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function SectionHead({ title, to, cta, small }) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-4">
      <h2 className={`font-display text-ink ${small ? "text-xl" : "text-3xl"}`}>{title}</h2>
      {to && <Link to={to} className="text-sm text-teal link-underline shrink-0">{cta} →</Link>}
    </div>
  );
}

function Loading() {
  return <div className="border-t border-ink pt-4"><SkeletonList rows={2} label="Loading" /></div>;
}
