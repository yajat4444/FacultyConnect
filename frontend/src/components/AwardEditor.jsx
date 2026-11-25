import { useState } from "react";
import { api } from "../lib/api.js";

const EMPTY = { title: "", year: "", description: "" };

export default function AwardEditor({ token, items, onChange }) {
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({ title: item.title, year: item.year || "", description: item.description || "" });
  }

  function cancel() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (editingId) {
        const updated = await api.updateAward(editingId, form, token);
        onChange(items.map((i) => (i.id === editingId ? updated : i)));
      } else {
        const created = await api.addAward(form, token);
        onChange([...items, created]);
      }
      cancel();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    await api.deleteAward(id, token);
    onChange(items.filter((i) => i.id !== id));
    if (editingId === id) cancel();
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-ink-faint border border-edge rounded-lg bg-paper-raised">No awards yet — add your first below.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className={`card flex flex-col justify-between ${editingId === item.id ? "ring-2 ring-teal" : ""}`}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal/10 text-teal-dark">
                    Award
                  </span>
                  {item.year && <span className="text-xs text-ink-faint font-mono">{item.year}</span>}
                </div>
                <p className="text-ink font-semibold text-base leading-snug">{item.title}</p>
                {item.description && <p className="text-xs text-ink-soft mt-1 leading-relaxed line-clamp-2">{item.description}</p>}
              </div>
              <div className="flex gap-2 justify-end pt-3 border-t border-rule mt-3">
                <button onClick={() => startEdit(item)} className="btn-quiet rounded-md text-xs">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="btn-danger rounded-md text-xs">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="subform grid grid-cols-1 sm:grid-cols-2 gap-4">
        <p className="subform-title sm:col-span-2">{editingId ? "Editing entry" : "Add a new entry"}</p>
        {error && <p role="alert" className="sm:col-span-2 text-sm text-red-700">{error}</p>}
        <div className="sm:col-span-2">
          <label htmlFor="awd-f1" className="field-label req">Title</label>
          <input id="awd-f1" required className="field" value={form.title} onChange={update("title")} />
        </div>
        <div>
          <label htmlFor="awd-f2" className="field-label">Year</label>
          <input id="awd-f2" className="field" value={form.year} onChange={update("year")} />
        </div>
        <div>
          <label htmlFor="awd-f3" className="field-label">Description (optional)</label>
          <input id="awd-f3" className="field" value={form.description} onChange={update("description")} />
        </div>
        <div className="sm:col-span-2 flex gap-3">
          <button type="submit" disabled={busy} className="btn-secondary !py-2 text-xs disabled:opacity-60">
            {editingId ? "Save changes" : "Add award"}
          </button>
          {editingId && (
            <button type="button" onClick={cancel} className="text-xs text-ink-faint">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
