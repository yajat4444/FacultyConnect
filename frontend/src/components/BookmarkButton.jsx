import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useBookmarks } from "../context/BookmarksContext.jsx";

// "Save" toggle for a professor or course.
//  - student: saves / removes
//  - signed-out visitor: link to sign in
//  - professor: nothing (bookmarks are a student feature)
export default function BookmarkButton({ kind, id, label }) {
  const { user } = useAuth();
  const { isSaved, toggle, loaded } = useBookmarks();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const location = useLocation();

  const base = "inline-flex items-center gap-2 border px-4 py-2 text-xs font-medium tracking-wide transition-colors";

  if (!user) {
    return (
      <Link to="/login" state={{ from: location.pathname + location.search }} className={`${base} border-paper/40 text-paper hover:bg-white/10`}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
        Sign in to save
      </Link>
    );
  }
  if (user.role !== "student") return null;

  const saved = isSaved(kind, id);
  async function onClick() {
    setBusy(true);
    setErr("");
    try {
      await toggle(kind, id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={onClick}
        disabled={busy || !loaded}
        aria-pressed={saved}
        aria-label={`${saved ? "Remove" : "Save"} ${label} ${saved ? "from" : "to"} your saved list`}
        className={`${base} disabled:opacity-60 ${
          saved ? "border-teal bg-teal text-white hover:bg-teal-dark" : "border-paper/40 text-paper hover:bg-white/10"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>
      {err && <span role="alert" className="mt-1 text-xs text-red-200">{err}</span>}
    </span>
  );
}
