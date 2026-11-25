import { useState } from "react";
import { api } from "../lib/api.js";

const EMPTY = { degree: "", institution: "", year_start: "", year_end: "", details: "" };

export default function EducationEditor({ token, items, onChange }) {
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      degree: item.degree, institution: item.institution,
      year_start: item.year_start || "", year_end: item.year_end || "", details: item.details || "",
    });
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
        const updated = await api.updateEducation(editingId, form, token);
        onChange(items.map((i) => (i.id === editingId ? updated : i)));
      } else {
        const created = await api.addEducation(form, token);
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
    await api.deleteEducation(id, token);
    onChange(items.filter((i) => i.id !== id));
    if (editingId === id) cancel();
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-ink-faint border border-edge rounded-lg bg-paper-raised">No entries yet — add your first degree below.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className={`card flex flex-col justify-between ${editingId === item.id ? "ring-2 ring-teal" : ""}`}>
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal/10 text-teal-dark mb-1 inline-block">
                  {item.year_start}{item.year_end ? `–${item.year_end}` : "–Present"}
                </span>
                <p className="text-ink font-semibold text-base leading-snug">{item.degree}</p>
                <p className="text-xs text-ink-soft mt-0.5">{item.institution}</p>
                {item.details && <p className="text-xs text-ink-faint mt-1 line-clamp-2">{item.details}</p>}
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
          <label htmlFor="edu-f1" className="field-label req">Degree</label>
          <input id="edu-f1" required className="field" value={form.degree} onChange={update("degree")} placeholder="Ph.D. in Computer Science" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="edu-f2" className="field-label req">Institution</label>
          <input id="edu-f2" required className="field" value={form.institution} onChange={update("institution")} />
        </div>
        <div>
          <label htmlFor="edu-f3" className="field-label">Start year</label>
          <input id="edu-f3" className="field" value={form.year_start} onChange={update("year_start")} placeholder="2012" />
        </div>
        <div>
          <label htmlFor="edu-f4" className="field-label">End year</label>
          <input id="edu-f4" className="field" value={form.year_end} onChange={update("year_end")} placeholder="2017" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="edu-f5" className="field-label">Details (optional)</label>
          <input id="edu-f5" className="field" value={form.details} onChange={update("details")} />
        </div>
        <div className="sm:col-span-2 flex gap-3">
          <button type="submit" disabled={busy} className="btn-secondary !py-2 text-xs disabled:opacity-60">
            {editingId ? "Save changes" : "Add entry"}
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
