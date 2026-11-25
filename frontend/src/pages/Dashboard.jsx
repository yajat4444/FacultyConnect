import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { APPLICATION_STATUSES, formatDate } from "../lib/format.js";
import Badge from "../components/Badge.jsx";
import Panel from "../components/Panel.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadError from "../components/LoadError.jsx";
import { SkeletonList } from "../components/Skeleton.jsx";
import { useBookmarks } from "../context/BookmarksContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  return user.role === "professor" ? <ProfessorHome user={user} /> : <StudentHome user={user} />;
}

function ProfessorHome({ user }) {
  const { token } = useAuth();
  const [courses, setCourses] = useState(null);
  const [projects, setProjects] = useState(null);
  const [applications, setApplications] = useState(null);
  const [failed, setFailed] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let stale = false;
    Promise.allSettled([api.myCourses(token), api.myProjects(token), api.receivedApplications(token)]).then(([c, p, a]) => {
      if (stale) return;
      const bad = [c, p, a].find((r) => r.status === "rejected");
      setFailed(bad ? bad.reason?.message || "Some of your data didn't load." : "");
      setCourses(c.status === "fulfilled" ? c.value.courses : []);
      setProjects(p.status === "fulfilled" ? p.value.projects : []);
      setApplications(a.status === "fulfilled" ? a.value.applications : []);
    });
    return () => { stale = true; };
  }, [token, attempt]);

  const pending = (applications || []).filter((a) => a.status === "pending").length;

  const tiles = [
    {
      to: "/dashboard/professor/courses",
      label: "Courses",
      value: courses ? courses.length : "–",
      action: "Manage courses",
      icon: (
        <svg className="w-6 h-6 text-[#3B9F9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      accent: "#3B9F9F",
    },
    {
      to: "/dashboard/professor/projects",
      label: "Open project slots",
      value: projects ? projects.filter((p) => p.status === "open").length : "–",
      action: "Manage projects",
      icon: (
        <svg className="w-6 h-6 text-[#4A7C59]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.942A4.5 4.5 0 0115.89 16.5H8.11a4.5 4.5 0 01-2.34-.658L4.2 15.3m15.6 0A2.25 2.25 0 0021 13.5V11.25a2.25 2.25 0 00-2.25-2.25h-.54M4.2 15.3A2.25 2.25 0 013 13.5V11.25a2.25 2.25 0 012.25-2.25h.54" />
        </svg>
      ),
      accent: "#4A7C59",
    },
    {
      to: "/dashboard/professor/projects",
      label: "Pending applications",
      value: pending,
      action: "Review applications",
      icon: (
        <svg className="w-6 h-6 text-[#2C7676]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.375v4.875A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25v-4.875m-19.5 0A2.25 2.25 0 014.5 9h15a2.25 2.25 0 012.25 2.25m-19.5 0v-2.25A2.25 2.25 0 014.5 6.75h15A2.25 2.25 0 0121.75 9v2.25" />
        </svg>
      ),
      accent: "#2C7676",
    },
  ];

  return (
    <div className="pb-24">
      {/* Hero section — matches explore/landing page */}
      <section className="relative overflow-hidden hero-mesh border-b border-rule text-paper">
        <div className="ring-deco" style={{ width: 480, height: 480, right: "-120px", top: "-160px", opacity: 0.5 }} />
        <div className="ring-deco" style={{ width: 300, height: 300, right: "60px", top: "-60px", opacity: 0.3 }} />
        <div className="ring-deco" style={{ width: 220, height: 220, left: "-60px", bottom: "-80px", opacity: 0.25 }} />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #F7FCFC 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-5xl px-6 py-14 sm:py-20">
          <p className="font-display italic" style={{ color: "#83C4C4" }}>
            Faculty Workspace
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl max-w-2xl leading-[1.1]" style={{ color: "#FDFBF7" }}>
            Welcome back, {user.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base" style={{ color: "rgba(247,252,252,0.75)" }}>
            Manage your courses, student research project openings, and candidate applications in one place.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/dashboard/professor/profile" className="btn-primary">
              Edit my profile
            </Link>
            <Link to="/dashboard/professor/courses" className="btn-secondary !bg-paper-raised/90 !border-edge">
              My courses
            </Link>
            <Link to="/dashboard/professor/projects" className="btn-secondary !bg-paper-raised/90 !border-edge">
              My projects
            </Link>
            <Link to={`/professor/${user.id}`} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors" style={{ color: "#83C4C4" }}>
              View public portfolio ↗
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 pt-10">
        {/* Stat tiles in 4-color cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {tiles.map((t) => (
            <Link
              key={t.label}
              to={t.to}
              className="group block rounded-xl border border-edge/80 bg-paper-raised shadow-sm hover:shadow-md hover:border-teal border-l-4 border-l-teal transition-all duration-200 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="p-2.5 rounded-lg bg-wash border border-edge/60 text-ink-soft">
                  {t.icon}
                </span>
                <span className="font-display text-4xl tabular-nums font-semibold" style={{ color: t.accent }}>
                  {t.value}
                </span>
              </div>
              <p className="text-sm font-semibold text-ink">{t.label}</p>
              <p className="mt-2 text-xs text-teal font-medium group-hover:translate-x-0.5 transition-transform">
                {t.action} →
              </p>
            </Link>
          ))}
        </div>

        {failed && <div className="mb-8"><LoadError message={failed} onRetry={() => { setCourses(null); setProjects(null); setApplications(null); setAttempt((a) => a + 1); }} /></div>}

        {/* Recent applications */}
        <Panel
          index="01"
          title="Recent applications"
          aside={<Link to="/dashboard/professor/projects" className="text-sm text-teal font-semibold hover:underline">See all →</Link>}
        >
          {applications === null ? (
            <SkeletonList rows={2} label="Loading applications" />
          ) : applications.length === 0 ? (
            <EmptyState title="No applications yet">Students will appear here after they apply to one of your projects.</EmptyState>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {applications.slice(0, 6).map((a) => (
                <div key={a.id} className="card flex flex-col justify-between border-l-4 border-l-teal">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge tone={APPLICATION_STATUSES[a.status].tone}>{APPLICATION_STATUSES[a.status].label}</Badge>
                      <span className="text-xs text-ink-faint">{formatDate(a.created_at)}</span>
                    </div>
                    <p className="text-ink font-semibold text-base">{a.student_name}</p>
                    <p className="text-xs text-teal-dark font-medium mt-1">Project: {a.project_title}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-edge/60 flex items-center justify-between text-xs">
                    <span className="text-ink-soft">Roll: <span className="font-mono">{a.roll_no}</span></span>
                    <Link to="/dashboard/professor/projects" className="text-teal font-semibold hover:underline">
                      Review →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Panel
            index="02"
            title="Your courses"
            aside={<Link to="/dashboard/professor/courses" className="text-sm text-teal font-semibold hover:underline">Manage →</Link>}
          >
            {courses === null ? (
              <SkeletonList rows={2} label="Loading courses" />
            ) : courses.length === 0 ? (
              <EmptyState title="No courses yet" action={<Link to="/dashboard/professor/courses" className="btn-primary">Add a course</Link>}>
                Students can browse any course you add.
              </EmptyState>
            ) : (
              <ul className="entry-list">
                {courses.slice(0, 6).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <Link to={`/courses/${c.id}`} className="min-w-0 group">
                      <span className="font-display text-teal mr-2">{c.code}</span>
                      <span className="text-sm text-ink group-hover:text-teal transition-colors">{c.title}</span>
                    </Link>
                    <Link to={`/dashboard/professor/courses/${c.id}`} className="btn-quiet shrink-0">Edit</Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            index="03"
            title="Your project slots"
            aside={<Link to="/dashboard/professor/projects" className="text-sm text-teal font-semibold hover:underline">Manage →</Link>}
          >
            {projects === null ? (
              <SkeletonList rows={2} label="Loading projects" />
            ) : projects.length === 0 ? (
              <EmptyState title="No project slots yet" action={<Link to="/dashboard/professor/projects" className="btn-primary">Post a project</Link>}>
                Post an opening and students can apply to it.
              </EmptyState>
            ) : (
              <ul className="entry-list">
                {projects.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <Link to={`/projects/${p.id}`} className="min-w-0 text-sm text-ink hover:text-teal transition-colors truncate">{p.title}</Link>
                    <span className="flex items-center gap-2 shrink-0">
                      <Badge tone={p.status === "open" ? "olive" : "muted"}>{p.status === "open" ? "Open" : "Filled"}</Badge>
                      <Link to="/dashboard/professor/projects" className="btn-quiet">Edit</Link>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function StudentHome({ user }) {
  const { token } = useAuth();
  const [applications, setApplications] = useState(null);
  const [failed, setFailed] = useState("");
  const [attempt, setAttempt] = useState(0);
  const saved = useBookmarks();

  useEffect(() => {
    let stale = false;
    api.myApplications(token)
      .then((d) => { if (!stale) { setApplications(d.applications); setFailed(""); } })
      .catch((e) => { if (!stale) { setApplications([]); setFailed(e.message); } });
    return () => { stale = true; };
  }, [token, attempt]);

  return (
    <div className="pb-24">
      {/* Hero section — matches explore/landing page */}
      <section className="relative overflow-hidden hero-mesh border-b border-rule text-paper">
        <div className="ring-deco" style={{ width: 480, height: 480, right: "-120px", top: "-160px", opacity: 0.5 }} />
        <div className="ring-deco" style={{ width: 300, height: 300, right: "60px", top: "-60px", opacity: 0.3 }} />
        <div className="ring-deco" style={{ width: 220, height: 220, left: "-60px", bottom: "-80px", opacity: 0.25 }} />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #F7FCFC 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-5xl px-6 py-14 sm:py-20">
          <p className="font-display italic" style={{ color: "#83C4C4" }}>
            Student Dashboard
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl max-w-2xl leading-[1.1]" style={{ color: "#FDFBF7" }}>
            Welcome back, {user.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base" style={{ color: "rgba(247,252,252,0.75)" }}>
            Track your research applications, view course syllabus & materials, and discover new faculty project opportunities.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/projects" className="btn-primary">Find a project</Link>
            <Link to="/courses" className="btn-secondary !bg-paper-raised/90 !border-edge">Browse courses</Link>
            <Link to="/professors" className="btn-secondary !bg-paper-raised/90 !border-edge">Faculty directory</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 pt-10">
        {/* Quick stats in 4-color cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {[
            {
              icon: (
                <svg className="w-6 h-6 text-[#3B9F9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              ),
              label: "Applications sent",
              value: applications?.length ?? "—",
              accent: "#3B9F9F",
            },
            {
              icon: (
                <svg className="w-6 h-6 text-[#4A7C59]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              label: "Accepted",
              value: applications?.filter(a => a.status === "accepted").length ?? "—",
              accent: "#4A7C59",
            },
            {
              icon: (
                <svg className="w-6 h-6 text-[#2C7676]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              label: "Pending review",
              value: applications?.filter(a => a.status === "pending").length ?? "—",
              accent: "#2C7676",
            },
          ].map((t) => (
            <div key={t.label} className="block rounded-xl border border-edge/80 bg-paper-raised shadow-sm border-l-4 border-l-teal p-6">
              <div className="flex items-start justify-between mb-3">
                <span className="p-2.5 rounded-lg bg-wash border border-edge/60 text-ink-soft">
                  {t.icon}
                </span>
                <span className="font-display text-4xl tabular-nums font-semibold" style={{ color: t.accent }}>{t.value}</span>
              </div>
              <p className="text-sm font-semibold text-ink">{t.label}</p>
            </div>
          ))}
        </div>

        <Panel index="01" title="My project applications">
          {applications === null ? (
            <SkeletonList rows={2} label="Loading your applications" />
          ) : failed ? (
            <LoadError message={failed} onRetry={() => { setApplications(null); setAttempt((a) => a + 1); }} />
          ) : applications.length === 0 ? (
            <EmptyState title="You haven't applied yet" action={<Link to="/projects" className="btn-primary">See open projects</Link>}>
              Applications you send will be tracked here.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {applications.map((a) => (
                <div key={a.id} className="card flex flex-col justify-between border-l-4 border-l-teal">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge tone={APPLICATION_STATUSES[a.status].tone}>{APPLICATION_STATUSES[a.status].label}</Badge>
                      <span className="text-xs text-ink-faint">Applied {formatDate(a.created_at)}</span>
                    </div>
                    <Link to={`/projects/${a.slot_id}`} className="font-display text-base text-ink hover:text-teal font-semibold link-underline block">
                      {a.project_title}
                    </Link>
                    <p className="text-xs text-ink-soft mt-1">Supervised by <span className="font-medium text-ink">{a.professor_name}</span></p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-edge/60 flex items-center justify-between text-xs">
                    <span className="text-ink-faint">Application ID #{a.id}</span>
                    <Link to={`/projects/${a.slot_id}`} className="text-teal font-semibold hover:underline">
                      View project details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Panel index="02" title="Saved professors" hint="Use the Save button on a professor's page.">
            {saved.error ? (
              <LoadError message={saved.error} onRetry={saved.reload} />
            ) : !saved.loaded ? (
              <SkeletonList rows={2} label="Loading saved professors" />
            ) : saved.data.professors.length === 0 ? (
              <EmptyState title="Nothing saved yet" action={<Link to="/professors" className="btn-primary">Browse faculty</Link>}>
                Save professors whose work you want to come back to.
              </EmptyState>
            ) : (
              <ul className="entry-list">
                {saved.data.professors.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <Link to={`/professor/${p.id}`} className="min-w-0 group">
                      <span className="block text-sm text-ink group-hover:text-teal transition-colors truncate">{p.name}</span>
                      <span className="block text-xs text-ink-faint truncate">{p.department || p.designation}</span>
                    </Link>
                    <button type="button" className="btn-quiet shrink-0" aria-label={`Remove ${p.name} from saved`} onClick={() => saved.toggle("professor", p.id).catch(() => {})}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel index="03" title="Saved courses" hint="Use the Save button on a course page.">
            {saved.error ? (
              <LoadError message={saved.error} onRetry={saved.reload} />
            ) : !saved.loaded ? (
              <SkeletonList rows={2} label="Loading saved courses" />
            ) : saved.data.courses.length === 0 ? (
              <EmptyState title="Nothing saved yet" action={<Link to="/courses" className="btn-primary">Browse courses</Link>}>
                Save courses to find their syllabus and exam dates quickly.
              </EmptyState>
            ) : (
              <ul className="entry-list">
                {saved.data.courses.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <Link to={`/courses/${c.id}`} className="min-w-0 group">
                      <span className="block text-sm text-ink group-hover:text-teal transition-colors truncate">
                        <span className="font-display text-teal mr-2">{c.code}</span>{c.title}
                      </span>
                      <span className="block text-xs text-ink-faint truncate">{c.professor_name}</span>
                    </Link>
                    <button type="button" className="btn-quiet shrink-0" aria-label={`Remove ${c.code} from saved`} onClick={() => saved.toggle("course", c.id).catch(() => {})}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
