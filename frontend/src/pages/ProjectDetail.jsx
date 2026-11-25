import { SkeletonPage } from "../components/Skeleton.jsx";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { APPLICATION_STATUSES, formatDate } from "../lib/format.js";
import Badge from "../components/Badge.jsx";
import Notice from "../components/Notice.jsx";

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const location = useLocation();
  const [project, setProject] = useState(undefined);
  const [mine, setMine] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setProject(undefined);
    api
      .project(id, token)
      .then((d) => { setProject(d.project); setMine(d.my_application); })
      .catch((e) => { setError(e.message); setProject(null); });
  }, [id, token]);

  if (project === undefined) return <SkeletonPage label="Loading project" />;
  if (project === null) {
    return (
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl text-ink">Project not found</h1>
        <p className="mt-2 text-sm text-ink-soft">{error}</p>
        <Link to="/projects" className="mt-6 inline-block text-teal link-underline text-sm">Back to open projects</Link>
      </section>
    );
  }

  const open = project.status === "open";
  const isOwner = user?.role === "professor" && user.id === project.user_id;

  return (
    <article className="pb-24">
      {/* Hero section — matches explore/landing page */}
      <header className="relative overflow-hidden hero-mesh border-b border-rule text-paper">
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
          <p className="text-sm flex items-center gap-2" style={{ color: "#83C4C4" }}>
            <Link to="/projects" className="hover:underline opacity-80 hover:opacity-100">Open projects</Link>
            <span className="opacity-40">/</span>
            <span className="text-paper-raised font-medium">{project.professor_name}</span>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              open ? "bg-teal/25 text-teal-light border border-teal/40" : "bg-white/10 text-paper/70 border border-white/20"
            }`}>
              <span className={`h-2 w-2 rounded-full ${open ? "bg-teal-light animate-pulse" : "bg-paper/40"}`} />
              {open ? "Taking Applications" : "All Slots Full · Closed"}
            </span>
            <span className="text-sm text-paper/70">Posted {formatDate(project.created_at)}</span>
          </div>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl text-paper font-semibold max-w-3xl leading-tight">
            {project.title}
          </h1>
          <p className="mt-4 text-paper-raised/80 text-base">
            Supervised by{" "}
            <Link to={`/professor/${project.user_id}`} className="text-teal-light hover:underline font-semibold">
              {project.professor_name}
            </Link>
            {project.professor_department && <span className="opacity-75">, {project.professor_department}</span>}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-6 py-14 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        <div className="space-y-8">
          {/* About Card */}
          <section className={`rounded-xl border border-edge/80 bg-paper-raised shadow-sm p-7 border-l-4 ${open ? "border-l-teal" : "border-l-ink/30"}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className={`h-2 w-2 rounded-full ${open ? "bg-teal" : "bg-ink-faint"}`} />
              <h2 className="font-display text-2xl text-ink font-semibold">About the project</h2>
            </div>
            <p className="text-ink-soft leading-relaxed whitespace-pre-line text-base">{project.description}</p>
          </section>

          {/* At a glance (2-column card grid) */}
          <section className="rounded-xl border border-edge/80 bg-paper-raised shadow-sm p-7">
            <h2 className="font-display text-xl text-ink font-semibold mb-5 flex items-center gap-2.5">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              At a glance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-wash/60 border border-edge/60">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-dark">Duration</p>
                <p className="mt-1 text-base font-semibold text-ink">{project.duration || "Flexible"}</p>
              </div>
              <div className="p-4 rounded-lg bg-wash/60 border border-edge/60">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-dark">
                  {open ? "Seats Available" : "Slot Availability"}
                </p>
                <p className={`mt-1 text-base font-semibold ${open ? "text-ink" : "text-amber-800"}`}>
                  {open ? `${project.openings} ${project.openings === 1 ? "seat" : "seats"}` : "0 seats (All slots full)"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-wash/60 border border-edge/60">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-dark">Already Accepted</p>
                <p className="mt-1 text-base font-semibold text-ink">{project.accepted_count} students</p>
              </div>
              <div className="p-4 rounded-lg bg-wash/60 border border-edge/60">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-dark">Status</p>
                <p className="mt-1 text-base font-semibold text-ink">
                  {open ? "Accepting candidates" : "All slots full · Closed"}
                </p>
              </div>
            </div>
          </section>

          {/* Skills Wanted */}
          {project.skills.length > 0 && (
            <section className="rounded-xl border border-edge/80 bg-paper-raised shadow-sm p-7">
              <h2 className="font-display text-xl text-ink font-semibold mb-4 flex items-center gap-2.5">
                <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
                Skills & Technologies
              </h2>
              <ul className="flex flex-wrap gap-2.5">
                {project.skills.map((s) => (
                  <li key={s}>
                    <Link
                      to={`/projects?skill=${encodeURIComponent(s)}`}
                      className="inline-block rounded-md border border-teal/30 bg-wash px-3.5 py-1.5 text-xs font-medium text-teal-dark hover:border-teal hover:bg-teal hover:text-paper transition-all duration-150 shadow-2xs"
                    >
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar / Apply panel */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className={`rounded-xl border border-edge/80 bg-paper-raised shadow-md overflow-hidden border-t-4 ${
            open ? "border-t-teal" : "border-t-ink/30"
          }`}>
            <div className="bg-wash/60 px-6 py-4 border-b border-edge/60">
              <h2 className="font-display text-xl text-ink font-semibold">
                {open ? "Apply for this project" : "Applications Closed"}
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                {open ? "Submit your interest directly to the supervising faculty" : "All project positions have been filled"}
              </p>
            </div>
            <div className="p-6">
              {isOwner ? (
                <div className="space-y-4 text-sm text-ink-soft">
                  <p>
                    {open
                      ? "This is your project. Candidate applications arrive directly in your project dashboard."
                      : "This project is currently marked as filled. You can review received applications or manage openings in your dashboard."}
                  </p>
                  <Link to="/dashboard/professor/projects" className="btn-primary w-full justify-center">
                    Manage applications
                  </Link>
                </div>
              ) : mine ? (
                <MyApplication application={mine} />
              ) : !open ? (
                <div className="rounded-lg bg-wash/80 border border-edge p-5 text-center">
                  <div className="mx-auto w-11 h-11 rounded-full bg-paper flex items-center justify-center text-ink-soft mb-3 border border-edge shadow-2xs">
                    <svg className="w-5 h-5 text-ink-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-ink text-base">All Slots Are Full</h3>
                  <p className="mt-2 text-sm text-ink-soft leading-relaxed">
                    This project has reached capacity and cannot accept new applications. You cannot apply for this project.
                  </p>
                  <Link to="/projects" className="mt-5 inline-flex items-center justify-center btn-secondary text-xs w-full">
                    Browse other open projects →
                  </Link>
                </div>
              ) : user?.role === "professor" ? (
                <div className="p-4 rounded-lg bg-wash/60 text-sm text-ink-soft border border-edge/60">
                  <p>Only students can apply. You are currently signed in as a professor.</p>
                </div>
              ) : !user ? (
                <div className="space-y-4 text-sm text-ink-soft">
                  <p>Sign in with a student account to apply. Your application goes straight to {project.professor_name}.</p>
                  <div className="flex flex-col gap-2.5">
                    <Link to="/login" state={{ from: location.pathname }} className="btn-primary w-full justify-center">
                      Sign in to apply
                    </Link>
                    <Link to="/register" state={{ from: location.pathname }} className="btn-secondary w-full justify-center">
                      Create student account
                    </Link>
                  </div>
                </div>
              ) : (
                <ApplyForm project={project} user={user} token={token} onDone={setMine} />
              )}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

function MyApplication({ application }) {
  const st = APPLICATION_STATUSES[application.status];
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between pb-3 border-b border-edge/60">
        <span className="text-ink-soft font-medium">Your application</span>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>
      <p className="text-ink-faint text-xs">Submitted on {formatDate(application.created_at)}</p>
      <div className="rounded-lg border border-edge/60 bg-wash/60 p-4">
        <p className="text-xs uppercase tracking-wider text-teal-dark font-semibold mb-1">Your message</p>
        <p className="text-ink-soft text-sm whitespace-pre-line">{application.message}</p>
      </div>
      <Link to="/dashboard/student" className="inline-flex items-center gap-1.5 text-teal font-medium hover:underline text-sm">
        See all my applications →
      </Link>
    </div>
  );
}

function ApplyForm({ project, user, token, onDone }) {
  const [form, setForm] = useState({ name: user.name, roll_no: "", message: "", resume_link: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { application } = await api.applyToProject(project.id, form, token);
      onDone(application);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Notice tone="error">{error}</Notice>
      <div>
        <label className="field-label req" htmlFor="ap-name">Full name</label>
        <input id="ap-name" required minLength={2} className="field" value={form.name} onChange={update("name")} maxLength={100} />
      </div>
      <div>
        <label className="field-label req" htmlFor="ap-roll">Roll number</label>
        <input id="ap-roll" required minLength={3} className="field" value={form.roll_no} onChange={update("roll_no")} placeholder="1024030001" maxLength={30} />
      </div>
      <div>
        <label className="field-label" htmlFor="ap-email">Your email</label>
        <input id="ap-email" className="field" value={user.email} disabled />
        <p className="field-hint">The professor will reply to this address.</p>
      </div>
      <div>
        <label className="field-label req" htmlFor="ap-msg">Why are you interested?</label>
        <textarea id="ap-msg" required minLength={20} rows={6} className="field" value={form.message} onChange={update("message")} placeholder="Relevant courses, projects or skills, and what you hope to learn." maxLength={2000} />
        <p className="field-hint">{form.message.trim().length}/2000, at least 20 characters</p>
      </div>
      <div>
        <label className="field-label" htmlFor="ap-resume">Resume link (optional)</label>
        <input id="ap-resume" type="url" className="field" value={form.resume_link} onChange={update("resume_link")} placeholder="https://drive.google.com/…" />
      </div>
      <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">{busy ? "Sending…" : "Send application"}</button>
    </form>
  );
}
