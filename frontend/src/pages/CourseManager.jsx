import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import Panel from "../components/Panel.jsx";
import Notice from "../components/Notice.jsx";
import EmptyState from "../components/EmptyState.jsx";

const EMPTY = { code: "", title: "", semester: "", credits: "", description: "" };

export default function CourseManager() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    api.myCourses(token).then((d) => setCourses(d.courses)).catch((e) => setError(e.message));
  }, [token]);

  const update = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));

  async function create(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { course } = await api.createCourse(form, token);
      navigate(`/dashboard/professor/courses/${course.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      await api.deleteCourse(id, token);
      setCourses((list) => list.filter((c) => c.id !== id));
      setConfirmId(null);
    } catch (err) {
      setError(err.message);
    }
  }

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
            Teaching Management
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl max-w-2xl leading-[1.1]" style={{ color: "#FDFBF7" }}>
            Manage your courses
          </h1>
          <p className="mt-3 max-w-2xl text-base" style={{ color: "rgba(247,252,252,0.75)" }}>
            Each course gets its own public page with syllabus units, lecture materials, examination schedule, assignments, and key dates.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 pt-10">
        <div className="space-y-10">
          <Panel index="01" title="Courses you teach">
            {!courses && !error && <p className="text-sm text-ink-faint py-8 text-center">Loading your courses…</p>}
            {courses?.length === 0 && <EmptyState title="No courses yet">Create your first course below.</EmptyState>}
            {courses?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((c) => (
                  <div key={c.id} className="card flex flex-col justify-between border-l-4 border-l-teal">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal-dark bg-wash px-2.5 py-1 rounded border border-teal/20">
                          {c.code}
                        </span>
                        {c.semester && (
                          <span className="text-xs bg-wash border border-edge/60 px-2 py-0.5 rounded-full text-ink-soft">
                            {c.semester}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-lg text-ink font-semibold leading-snug">
                        {c.title}
                      </h3>
                      <p className="text-xs text-ink-soft mt-1 font-sans">
                        {c.topic_count} topics · {c.material_count} files
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-edge/60 flex flex-wrap gap-2 items-center justify-between">
                      <Link to={`/courses/${c.id}`} className="text-xs text-teal font-semibold hover:underline">
                        View public →
                      </Link>
                      <div className="flex gap-2">
                        <Link to={`/dashboard/professor/courses/${c.id}`} className="btn-secondary rounded-md !py-1.5 !px-3 text-xs">
                          Edit
                        </Link>
                        {confirmId === c.id ? (
                          <>
                            <button onClick={() => remove(c.id)} className="btn-primary !bg-red-600 !border-red-700 !text-white rounded-md text-xs">
                              Confirm
                            </button>
                            <button onClick={() => setConfirmId(null)} className="btn-quiet rounded-md text-xs">
                              Keep
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmId(c.id)} className="btn-quiet !text-red-700 rounded-md text-xs hover:bg-red-50">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel index="02" title="Create a course" hint="You can add syllabus topics, materials, and exam dates on the next screen.">
            <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-[160px_1fr_160px] gap-4">
              <div className="sm:col-span-3"><Notice tone="error">{error}</Notice></div>
              <div>
                <label className="field-label req" htmlFor="nc-code">Course code</label>
                <input id="nc-code" required className="field bg-wash/60 focus:bg-white" value={form.code} onChange={update("code")} placeholder="UCS503" maxLength={20} />
              </div>
              <div>
                <label className="field-label req" htmlFor="nc-title">Title</label>
                <input id="nc-title" required className="field bg-wash/60 focus:bg-white" value={form.title} onChange={update("title")} placeholder="Software Engineering" maxLength={140} />
              </div>
              <div>
                <label className="field-label" htmlFor="nc-credits">Credits</label>
                <input id="nc-credits" type="number" min="0" max="30" className="field bg-wash/60 focus:bg-white" value={form.credits} onChange={update("credits")} />
              </div>
              <div className="sm:col-span-3">
                <label className="field-label" htmlFor="nc-sem">Semester</label>
                <input id="nc-sem" className="field sm:max-w-xs bg-wash/60 focus:bg-white" value={form.semester} onChange={update("semester")} placeholder="Autumn 2026" maxLength={40} />
              </div>
              <div className="sm:col-span-3">
                <label className="field-label" htmlFor="nc-desc">Description</label>
                <textarea id="nc-desc" rows={3} className="field bg-wash/60 focus:bg-white" value={form.description} onChange={update("description")} maxLength={3000} />
              </div>
              <div className="sm:col-span-3">
                <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">{busy ? "Creating…" : "Create course"}</button>
              </div>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
