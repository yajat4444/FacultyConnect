import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import Panel from "../components/Panel.jsx";
import Notice from "../components/Notice.jsx";
import TopicEditor from "../components/course/TopicEditor.jsx";
import MaterialEditor from "../components/course/MaterialEditor.jsx";
import EventEditor from "../components/course/EventEditor.jsx";

const SECTIONS = [
  ["details", "Course details"],
  ["syllabus", "Syllabus"],
  ["materials", "Materials"],
  ["dates", "Exams, assignments & dates"],
];

export default function CourseEditor() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(undefined);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .course(id)
      .then(({ course }) => {
        setCourse(course);
        setForm({
          code: course.code, title: course.title, semester: course.semester || "",
          credits: course.credits ?? "", description: course.description || "",
        });
      })
      .catch(() => setCourse(null));
  }, [id]);

  if (course === undefined) return <p className="mx-auto max-w-3xl px-6 py-24 text-sm text-ink-faint">Loading course…</p>;
  if (course === null) {
    return (
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl text-ink">Course not found</h1>
        <Link to="/dashboard/professor/courses" className="mt-6 inline-block text-teal link-underline text-sm">Back to your courses</Link>
      </section>
    );
  }

  const update = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));
  const patch = (key) => (value) => setCourse((c) => ({ ...c, [key]: value }));

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaved("");
    setSaving(true);
    try {
      const { course: updated } = await api.updateCourse(id, form, token);
      setCourse((c) => ({ ...c, ...updated, topics: c.topics, materials: c.materials, events: c.events }));
      setSaved("Saved.");
      setTimeout(() => setSaved(""), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm text-ink-faint">
        <Link to="/dashboard/professor/courses" className="link-underline">Your courses</Link> / {course.code}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl text-ink">{course.title}</h1>
        <Link to={`/courses/${course.id}`} className="text-sm text-teal link-underline">View public page →</Link>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-10">
        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="sticky top-28 border-l border-edge text-sm">
            {SECTIONS.map(([key, label], i) => (
              <li key={key}>
                <a href={`#${key}`} className="block -ml-px border-l-2 border-transparent py-2 pl-4 text-ink-soft hover:border-teal hover:text-ink transition-colors">
                  <span className="text-teal mr-2 font-display italic">{String(i + 1).padStart(2, "0")}</span>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-10 min-w-0">
          <Panel id="details" index="01" title="Course details">
            <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-[160px_1fr_140px] gap-4">
              <div className="sm:col-span-3"><Notice tone="error">{error}</Notice></div>
              <div>
                <label className="field-label req" htmlFor="ce-code">Course code</label>
                <input id="ce-code" required className="field" value={form.code} onChange={update("code")} maxLength={20} />
              </div>
              <div>
                <label className="field-label req" htmlFor="ce-title">Title</label>
                <input id="ce-title" required className="field" value={form.title} onChange={update("title")} maxLength={140} />
              </div>
              <div>
                <label className="field-label" htmlFor="ce-credits">Credits</label>
                <input id="ce-credits" type="number" min="0" max="30" className="field" value={form.credits} onChange={update("credits")} />
              </div>
              <div className="sm:col-span-3">
                <label className="field-label" htmlFor="ce-sem">Semester</label>
                <input id="ce-sem" className="field sm:max-w-xs" value={form.semester} onChange={update("semester")} placeholder="Autumn 2026" maxLength={40} />
              </div>
              <div className="sm:col-span-3">
                <label className="field-label" htmlFor="ce-desc">Description</label>
                <textarea id="ce-desc" rows={4} className="field" value={form.description} onChange={update("description")} maxLength={3000} />
              </div>
              <div className="sm:col-span-3 flex items-center gap-4">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Saving…" : "Save details"}</button>
                {saved && <span className="text-sm text-olive">{saved}</span>}
              </div>
            </form>
          </Panel>

          <Panel id="syllabus" index="02" title="Syllabus" hint="Break the course into units or weeks. Students see these in order.">
            <TopicEditor token={token} courseId={course.id} items={course.topics} onChange={patch("topics")} />
          </Panel>

          <Panel id="materials" index="03" title="Course materials" hint="Upload lecture notes, slides and readings, or link to material hosted elsewhere. Use the Syllabus type for a full syllabus PDF.">
            <MaterialEditor token={token} courseId={course.id} items={course.materials} onChange={patch("materials")} />
          </Panel>

          <Panel id="dates" index="04" title="Exams, assignments & important dates" hint="Everything with a date goes here: quizzes, mid-sem and end-sem exams, assignment deadlines, add/drop dates and project deadlines.">
            <EventEditor token={token} courseId={course.id} items={course.events} onChange={patch("events")} />
          </Panel>

          <div className="border-t border-rule pt-6">
            <button onClick={() => navigate("/dashboard/professor/courses")} className="btn-quiet">← Back to your courses</button>
          </div>
        </div>
      </div>
    </section>
  );
}
