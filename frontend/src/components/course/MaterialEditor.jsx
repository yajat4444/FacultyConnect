import { useRef, useState } from "react";
import { api, materialDownloadUrl, API_ORIGIN } from "../../lib/api.js";
import { MATERIAL_CATEGORIES, fileSize, safeHref } from "../../lib/format.js";
import Notice from "../Notice.jsx";
import Badge from "../Badge.jsx";

const MAX_MB = 25;

export default function MaterialEditor({ token, courseId, items, onChange }) {
  const [mode, setMode] = useState("file"); // "file" | "link"
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("notes");
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);

  function reset() {
    setTitle("");
    setLink("");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function pickFile(e) {
    const f = e.target.files?.[0] || null;
    if (f && f.size > MAX_MB * 1024 * 1024) {
      setError(`That file is ${fileSize(f.size)}. The limit is ${MAX_MB} MB.`);
      e.target.value = "";
      setFile(null);
      return;
    }
    setError("");
    setFile(f);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (mode === "file" && !file) return setError("Choose a file to upload.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("category", category);
      if (mode === "file") fd.append("file", file);
      else fd.append("link", link);
      const created = await api.addMaterial(courseId, fd, token);
      onChange([created, ...items]);
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      await api.deleteMaterial(courseId, id, token);
      onChange(items.filter((m) => m.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-ink-faint border border-edge rounded-lg bg-paper-raised">Nothing uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((m) => (
            <div key={m.id} className="card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge>{MATERIAL_CATEGORIES[m.category] || m.category}</Badge>
                  {m.stored_name && <span className="text-xs text-ink-faint font-mono">{fileSize(m.file_size)}</span>}
                </div>
                <p className="text-ink font-semibold text-base leading-snug">{m.title}</p>
                {m.stored_name ? (
                  <p className="text-xs text-ink-faint mt-1 truncate">{m.file_name}</p>
                ) : (
                  <p className="text-xs text-teal mt-1 truncate">{m.link}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-rule mt-3">
                <a
                  href={m.stored_name ? `${API_ORIGIN}${m.file_url}` : safeHref(m.link)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-quiet rounded-md text-xs"
                >
                  Open
                </a>
                {m.stored_name && (
                  <a href={materialDownloadUrl(m.id)} className="btn-secondary rounded-md !py-1 !px-2.5 text-xs">
                    Download
                  </a>
                )}
                <button type="button" onClick={() => remove(m.id)} className="btn-danger rounded-md text-xs">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="subform grid grid-cols-1 sm:grid-cols-2 gap-4">
        <p className="subform-title sm:col-span-2">Add material</p>
        <div className="sm:col-span-2"><Notice tone="error">{error}</Notice></div>

        <div className="sm:col-span-2 inline-flex border border-edge w-fit" role="group" aria-label="Material source">
          {[["file", "Upload a file"], ["link", "Paste a link"]].map(([key, label]) => (
            <button
              type="button"
              key={key}
              aria-pressed={mode === key}
              onClick={() => { setMode(key); setError(""); }}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                mode === key ? "bg-ink text-paper" : "bg-white text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <label className="field-label" htmlFor="mat-title">Title</label>
          <input id="mat-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lecture 3: Requirements" maxLength={160} />
        </div>
        <div>
          <label className="field-label" htmlFor="mat-cat">Type</label>
          <select id="mat-cat" className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(MATERIAL_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {mode === "file" ? (
          <div className="sm:col-span-2">
            <label className="field-label req" htmlFor="mat-file">File</label>
            <input
              id="mat-file"
              ref={fileInput}
              type="file"
              onChange={pickFile}
              accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg"
              className="field !py-2 file:mr-4 file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-medium file:text-paper hover:file:bg-teal-dark"
            />
            <p className="field-hint">PDF, PowerPoint, Word, text, ZIP or image. Up to {MAX_MB} MB.</p>
          </div>
        ) : (
          <div className="sm:col-span-2">
            <label className="field-label req" htmlFor="mat-link">Link</label>
            <input id="mat-link" type="url" required className="field" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
          </div>
        )}

        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="btn-secondary !py-2 text-xs disabled:opacity-60">
            {busy ? "Uploading…" : mode === "file" ? "Upload file" : "Add link"}
          </button>
        </div>
      </form>
    </div>
  );
}
