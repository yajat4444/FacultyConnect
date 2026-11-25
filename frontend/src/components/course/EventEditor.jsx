import { useState } from "react";
import { api } from "../../lib/api.js";
import { EVENT_KINDS, formatDate, formatTime } from "../../lib/format.js";
import Notice from "../Notice.jsx";
import Badge from "../Badge.jsx";

const EMPTY = { kind: "exam", title: "", event_date: "", event_time: "", marks: "", link: "", description: "" };

export default function EventEditor({ token, courseId, items, onChange }) {
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));
  const sorted = [...items].sort((a, b) => (a.event_date + (a.event_time || "")).localeCompare(b.event_date + (b.event_time || "")));

  function startEdit(ev) {
    setEditingId(ev.id);
    setForm({
      kind: ev.kind, title: ev.title, event_date: ev.event_date, event_time: ev.event_time || "",
      marks: ev.marks || "", link: ev.link || "", description: ev.description || "",
    });
    setError("");
  }
  function cancel() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (editingId) {
        const updated = await api.updateEvent(courseId, editingId, form, token);
        onChange(items.map((i) => (i.id === editingId ? updated : i)));
      } else {
        const created = await api.addEvent(courseId, form, token);
        onChange([...items, created]);
      }
      cancel();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      await api.deleteEvent(courseId, id, token);
      onChange(items.filter((i) => i.id !== id));
      if (editingId === id) cancel();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-ink-faint border border-edge rounded-lg bg-paper-raised">No dates added yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sorted.map((ev) => (
            <div key={ev.id} className={`card flex flex-col justify-between ${editingId === ev.id ? "ring-2 ring-teal" : ""}`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge tone={EVENT_KINDS[ev.kind].tone}>{EVENT_KINDS[ev.kind].label}</Badge>
                  {ev.marks && <span className="text-xs text-teal-dark bg-teal/10 px-1.5 py-0.5 rounded font-mono">{ev.marks}</span>}
                </div>
                <p className="text-ink font-semibold text-base leading-snug">{ev.title}</p>
                <p className="mt-1 text-xs text-ink-soft">
                  {formatDate(ev.event_date)}
                  {ev.event_time && ` · ${formatTime(ev.event_time)}`}
                </p>
                {ev.description && <p className="mt-1.5 text-xs text-ink-faint line-clamp-2">{ev.description}</p>}
              </div>
              <div className="flex gap-2 justify-end pt-3 border-t border-rule mt-3">
                <button type="button" onClick={() => startEdit(ev)} className="btn-quiet rounded-md text-xs">Edit</button>
                <button type="button" onClick={() => remove(ev.id)} className="btn-danger rounded-md text-xs">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="subform grid grid-cols-1 sm:grid-cols-2 gap-4">
        <p className="subform-title sm:col-span-2">{editingId ? "Editing entry" : "Add a date"}</p>
        <div className="sm:col-span-2"><Notice tone="error">{error}</Notice></div>

        <div>
          <label className="field-label req" htmlFor="ev-kind">Type</label>
          <select id="ev-kind" className="field" value={form.kind} onChange={update("kind")}>
            {Object.entries(EVENT_KINDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <p className="field-hint">Exams and quizzes show under Schedule, assignments under Assignments, the rest under Important dates.</p>
        </div>
        <div>
          <label className="field-label req" htmlFor="ev-title">Title</label>
          <input id="ev-title" required className="field" value={form.title} onChange={update("title")} placeholder="Mid-semester exam" maxLength={160} />
        </div>
        <div>
          <label className="field-label req" htmlFor="ev-date">Date</label>
          <input id="ev-date" type="date" required className="field" value={form.event_date} onChange={update("event_date")} />
        </div>
        <div>
          <label className="field-label" htmlFor="ev-time">Time</label>
          <input id="ev-time" type="time" className="field" value={form.event_time} onChange={update("event_time")} />
        </div>
        <div>
          <label className="field-label" htmlFor="ev-marks">Marks / weight</label>
          <input id="ev-marks" className="field" value={form.marks} onChange={update("marks")} placeholder="30 marks" maxLength={60} />
        </div>
        <div>
          <label className="field-label" htmlFor="ev-link">Link</label>
          <input id="ev-link" type="url" className="field" value={form.link} onChange={update("link")} placeholder="https://  (problem sheet, submission page)" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="ev-desc">Details</label>
          <textarea id="ev-desc" rows={2} className="field" value={form.description} onChange={update("description")} maxLength={2000} />
        </div>
        <div className="sm:col-span-2 flex gap-3 items-center">
          <button type="submit" disabled={busy} className="btn-secondary !py-2 text-xs disabled:opacity-60">
            {editingId ? "Save entry" : "Add to schedule"}
          </button>
          {editingId && <button type="button" onClick={cancel} className="text-xs text-ink-faint link-underline">Cancel</button>}
        </div>
      </form>
    </div>
  );
}
