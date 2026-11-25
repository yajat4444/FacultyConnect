import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "./AuthContext.jsx";

const BookmarksContext = createContext(null);
const EMPTY = { professors: [], courses: [] };

// Students can save professors and courses. This keeps one shared copy of the
// saved list so every heart button and the dashboard agree with each other.
export function BookmarksProvider({ children }) {
  const { user, token } = useAuth();
  const isStudent = user?.role === "student";
  const [data, setData] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!isStudent) return;
    try {
      setData(await api.bookmarks(token));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoaded(true);
    }
  }, [isStudent, token]);

  useEffect(() => {
    setData(EMPTY);
    setLoaded(false);
    reload();
  }, [reload]);

  const list = (kind) => (kind === "professor" ? data.professors : data.courses);
  const isSaved = (kind, id) => list(kind).some((x) => x.id === Number(id));

  // Optimistic: flip the button at once, undo if the server says no.
  async function toggle(kind, id) {
    const saved = isSaved(kind, id);
    const before = data;
    const key = kind === "professor" ? "professors" : "courses";
    setData({
      ...data,
      [key]: saved ? data[key].filter((x) => x.id !== Number(id)) : [{ id: Number(id) }, ...data[key]],
    });
    try {
      if (saved) await api.removeBookmark(kind, id, token);
      else await api.saveBookmark(kind, id, token);
      await reload(); // fills in names etc. for the dashboard
    } catch (e) {
      setData(before);
      throw e;
    }
  }

  return (
    <BookmarksContext.Provider value={{ isStudent, data, loaded, error, isSaved, toggle, reload }}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used within BookmarksProvider");
  return ctx;
}
