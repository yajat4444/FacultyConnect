import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { APPLICATION_STATUSES, formatDate, timeAgo, safeHref } from "../lib/format.js";
import Panel from "../components/Panel.jsx";
import Notice from "../components/Notice.jsx";
import Badge from "../components/Badge.jsx";
import EmptyState from "../components/EmptyState.jsx";

const EMPTY = { title: "", description: "", required_skills: "", duration: "", openings: 1, status: "open" };

export default function ProjectManager() {
  const { token } = useAuth();
  const [projects, setProjects] = useState(null);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filterProject, setFilterProject] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  function loadAll() {
    return Promise.all([api.myProjects(token), api.receivedApplications(token)])
      .then(([p, a]) => { setProjects(p.projects); setApplications(a.applications); })
      .catch((e) => setError(e.message));
  }
  useEffect(() => { loadAll(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));

  function startEdit(p) {
    setEditingId(p.id);
    setForm({ title: p.title, description: p.description, required_skills: p.required_skills || "", duration: p.duration || "", openings: p.openings, status: p.status });
    setError("");
    document.getElementById("slot-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function cancel() { setEditingId(null); setForm(EMPTY); setError(""); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (editingId) await api.updateProject(editingId, form, token);
      else await api.createProject(form, token);
      cancel();
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(p, status) {
    try {
      await api.updateProject(p.id, { ...p, required_skills: p.required_skills || "", status }, token);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function remove(id) {
    try {
      await api.deleteProject(id, token);
      setConfirmId(null);
      if (editingId === id) cancel();
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function changeApplicationStatus(app, status) {
    try {
      await api.setApplicationStatus(app.id, status, token);
      await loadAll(); // a project may have been filled automatically
    } catch (err) { setError(err.message); }
  }

  const shown = useMemo(
    () => (filterProject ? applications.filter((a) => String(a.slot_id) === filterProject) : applications),
    [applications, filterProject]
  );

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
            Research Supervision
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl max-w-2xl leading-[1.1]" style={{ color: "#FDFBF7" }}>
            Manage project openings
          </h1>
          <p className="mt-3 max-w-2xl text-base" style={{ color: "rgba(247,252,252,0.75)" }}>
            Post project positions for undergraduate and graduate students, review applications, and select candidates.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 pt-10">
        <div className="space-y-10">
          <Panel index="01" title="Your projects">
            {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
            {!projects && !error && <p className="text-sm text-ink-faint py-8 text-center">Loading your projects…</p>}
            {projects?.length === 0 && <EmptyState title="No projects yet">Post your first project below.</EmptyState>}
            {projects?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => (
                  <div key={p.id} className={`card flex flex-col justify-between border-l-4 border-l-teal ${editingId === p.id ? "ring-2 ring-teal" : ""}`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge tone={p.status === "open" ? "olive" : "muted"}>{p.status === "open" ? "Open" : "Filled"}</Badge>
                        <span className="text-xs font-semibold text-teal-dark bg-wash px-2.5 py-0.5 rounded-full border border-teal/20">
                          {p.openings} {p.openings === 1 ? "seat" : "seats"}
                        </span>
                      </div>
                      <Link to={`/projects/${p.id}`} className="font-display text-lg text-ink hover:text-teal font-semibold leading-snug block">
                        {p.title}
                      </Link>
                      <p className="mt-1 text-xs text-ink-soft">
                        {p.duration && `${p.duration} · `}{p.application_count} app{p.application_count === 1 ? "" : "s"}
                        {p.pending_count > 0 && <span className="text-teal font-semibold"> ({p.pending_count} pending)</span>}
                      </p>
                      {p.description && (
                        <p className="mt-2 text-xs text-ink-soft/90 line-clamp-2 leading-relaxed">{p.description}</p>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-edge/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(p)} className="btn-secondary rounded-md !py-1 !px-2.5 text-xs">Edit</button>
                        {p.status === "open" ? (
                          <button onClick={() => setStatus(p, "filled")} className="btn-quiet rounded-md text-xs">Mark filled</button>
                        ) : (
                          <button onClick={() => setStatus(p, "open")} className="btn-quiet rounded-md text-xs">Reopen</button>
                        )}
                      </div>
                      <div>
                        {confirmId === p.id ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => remove(p.id)} className="btn-primary !bg-red-600 !border-red-700 !text-white rounded-md text-xs">Confirm</button>
                            <button onClick={() => setConfirmId(null)} className="btn-quiet rounded-md text-xs">Keep</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmId(p.id)} className="btn-quiet !text-red-700 rounded-md text-xs hover:bg-red-50">Delete</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel id="slot-form" index="02" title={editingId ? "Edit project" : "Post a project"}>
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="field-label req" htmlFor="sl-title">Project title</label>
                <input id="sl-title" required className="field bg-wash/60 focus:bg-white" value={form.title} onChange={update("title")} maxLength={140} />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label req" htmlFor="sl-desc">Description</label>
                <textarea id="sl-desc" required rows={6} className="field bg-wash/60 focus:bg-white" value={form.description} onChange={update("description")} placeholder="What the project is, what the student will do, and what they will learn." maxLength={4000} />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="sl-skills">Required skills</label>
                <input id="sl-skills" className="field bg-wash/60 focus:bg-white" value={form.required_skills} onChange={update("required_skills")} placeholder="Python, Machine learning, LaTeX" />
                <p className="field-hint">Separate skills with commas. Students can filter by these.</p>
              </div>
              <div>
                <label className="field-label" htmlFor="sl-dur">Duration</label>
                <input id="sl-dur" className="field bg-wash/60 focus:bg-white" value={form.duration} onChange={update("duration")} placeholder="3 months" maxLength={60} />
              </div>
              <div>
                <label className="field-label req" htmlFor="sl-open">Number of seats available</label>
                <input id="sl-open" type="number" min="1" max="50" required className="field bg-wash/60 focus:bg-white" value={form.openings} onChange={update("openings")} />
              </div>
              <div>
                <label className="field-label" htmlFor="sl-status">Status</label>
                <select id="sl-status" className="field bg-wash/60 focus:bg-white" value={form.status} onChange={update("status")}>
                  <option value="open">Open: taking applications</option>
                  <option value="filled">Filled: closed</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex items-center gap-4 pt-2">
                <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">{busy ? "Saving…" : editingId ? "Save changes" : "Post project"}</button>
                {editingId && <button type="button" onClick={cancel} className="text-sm text-teal hover:underline font-semibold">Cancel</button>}
              </div>
            </form>
          </Panel>

          <Panel
            index="03"
            title="Applications"
            aside={
              projects?.length > 0 && (
                <div className="w-full sm:w-64">
                  <label className="sr-only" htmlFor="app-filter">Filter by project</label>
                  <select id="app-filter" className="field !py-2 bg-wash/60 focus:bg-white" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
                    <option value="">All projects</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              )
            }
          >
            {shown.length === 0 ? (
              <EmptyState title="No applications yet">When students apply, they will show up here with their message and contact details.</EmptyState>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shown.map((a) => (
                  <div key={a.id} className="card flex flex-col justify-between border-l-4 border-l-teal">
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3 pb-3 border-b border-edge/60">
                        <div>
                          <p className="text-ink font-semibold text-base">{a.student_name}</p>
                          <p className="text-xs text-ink-soft mt-0.5">Roll: <span className="font-mono">{a.roll_no}</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={APPLICATION_STATUSES[a.status].tone}>{APPLICATION_STATUSES[a.status].label}</Badge>
                          <select
                            id={`st-${a.id}`}
                            aria-label="Change status"
                            className="field !w-auto !py-1 !px-2 !text-xs rounded bg-wash/60"
                            value={a.status}
                            onChange={(e) => changeApplicationStatus(a, e.target.value)}
                          >
                            {Object.entries(APPLICATION_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-teal-dark mb-2">Project: {a.project_title}</p>
                      <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-line line-clamp-4 bg-wash/60 p-3 rounded-lg border border-edge/60 mb-3">
                        "{a.message}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-edge/60 mt-auto flex flex-wrap items-center justify-between gap-2 text-xs">
                      <a href={`mailto:${a.student_email}?subject=${encodeURIComponent("Your application: " + a.project_title)}`} className="text-teal font-semibold hover:underline inline-flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        {a.student_email}
                      </a>
                      <div className="flex items-center gap-3 text-ink-soft">
                        {a.resume_link && (
                          <a href={safeHref(a.resume_link)} target="_blank" rel="noreferrer" className="text-teal font-semibold hover:underline">
                            Resume ↗
                          </a>
                        )}
                        <span>{timeAgo(a.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
