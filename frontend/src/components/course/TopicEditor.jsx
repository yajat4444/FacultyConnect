import { useState } from "react";
import { api } from "../../lib/api.js";
import Notice from "../Notice.jsx";

const EMPTY = { label: "", title: "", details: "" };

export default function TopicEditor({ token, courseId, items, onChange }) {
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));

  function startEdit(t) {
    setEditingId(t.id);
    setForm({ label: t.label || "", title: t.title, details: t.details || "" });
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
        const updated = await api.updateTopic(courseId, editingId, form, token);
        onChange(items.map((i) => (i.id === editingId ? updated : i)));
      } else {
        const created = await api.addTopic(courseId, form, token);
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
      await api.deleteTopic(courseId, id, token);
      onChange(items.filter((i) => i.id !== id));
      if (editingId === id) cancel();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-ink-faint border border-edge rounded-lg bg-paper-raised">No topics yet. Add the first one below.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((t) => (
            <div key={t.id} className={`card flex flex-col justify-between ${editingId === t.id ? "ring-2 ring-teal" : ""}`}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal/10 text-teal-dark">
                    {t.label || "Topic"}
                  </span>
                </div>
                <p className="text-ink font-semibold text-base leading-snug">{t.title}</p>
                {t.details && <p className="mt-1 text-xs text-ink-soft leading-relaxed line-clamp-2">{t.details}</p>}
              </div>
              <div className="flex gap-2 justify-end pt-3 border-t border-rule mt-3">
                <button type="button" onClick={() => startEdit(t)} className="btn-quiet rounded-md text-xs">Edit</button>
                <button type="button" onClick={() => remove(t.id)} className="btn-danger rounded-md text-xs">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="subform grid grid-cols-1 sm:grid-cols-3 gap-4">
        <p className="subform-title sm:col-span-3">{editingId ? "Editing topic" : "Add a topic"}</p>
        <div className="sm:col-span-3"><Notice tone="error">{error}</Notice></div>
        <div>
          <label className="field-label" htmlFor="topic-label">Unit / week</label>
          <input id="topic-label" className="field" value={form.label} onChange={update("label")} placeholder="Unit 1" maxLength={40} />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label req" htmlFor="topic-title">Topic</label>
          <input id="topic-title" required className="field" value={form.title} onChange={update("title")} maxLength={160} />
        </div>
        <div className="sm:col-span-3">
          <label className="field-label" htmlFor="topic-details">What is covered</label>
          <textarea id="topic-details" rows={2} className="field" value={form.details} onChange={update("details")} maxLength={2000} />
        </div>
        <div className="sm:col-span-3 flex gap-3 items-center">
          <button type="submit" disabled={busy} className="btn-secondary !py-2 text-xs disabled:opacity-60">
            {editingId ? "Save topic" : "Add topic"}
          </button>
          {editingId && <button type="button" onClick={cancel} className="text-xs text-ink-faint link-underline">Cancel</button>}
        </div>
      </form>
    </div>
  );
}
