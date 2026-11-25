import LoadError from "../components/LoadError.jsx";
import { SkeletonList } from "../components/Skeleton.jsx";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import EmptyState from "../components/EmptyState.jsx";

export default function CourseCatalogue() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const semester = params.get("semester") || "";
  const professor = params.get("professor") || "";

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState(q);

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  useEffect(() => {
    const h = setTimeout(() => search !== q && setFilter("q", search), 250);
    return () => clearTimeout(h);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let stale = false;
    setError("");
    api
      .courses({ q, semester, professor })
      .then((d) => !stale && setData(d))
      .catch((e) => !stale && setError(e.message));
    return () => { stale = true; };
  }, [q, semester, professor, attempt]);

  const filtering = q || semester || professor;

  return (
    <div className="pb-24">
      {/* Hero section with filters embedded inside — matches explore/landing page */}
      <section className="relative overflow-hidden hero-mesh border-b border-rule text-paper">
        {/* Decorative rings */}
        <div className="ring-deco" style={{ width: 480, height: 480, right: "-120px", top: "-160px", opacity: 0.5 }} />
        <div className="ring-deco" style={{ width: 300, height: 300, right: "60px", top: "-60px", opacity: 0.3 }} />
        <div className="ring-deco" style={{ width: 220, height: 220, left: "-60px", bottom: "-80px", opacity: 0.25 }} />
        {/* Subtle grid dots */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #F7FCFC 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <p className="font-display italic" style={{ color: "#83C4C4" }}>
            Explore the full catalogue
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl max-w-2xl leading-[1.1]" style={{ color: "#FDFBF7" }}>
            Browse every course
          </h1>
          <p className="mt-3 max-w-2xl text-base" style={{ color: "rgba(247,252,252,0.75)" }}>
            Syllabus, lecture materials, exam dates and assignments are openly accessible for every departmental course.
          </p>

          {/* Filters inside hero — same style as landing page search */}
          <div className="mt-8 max-w-3xl">
            <div className="flex border bg-white" style={{ borderColor: "#F7FCFC" }}>
              <label htmlFor="c-search" className="sr-only">Search Courses</label>
              <input
                id="c-search"
                type="search"
                className="min-w-0 flex-1 bg-transparent px-5 py-4 text-ink placeholder:text-ink-faint focus:outline-none"
                placeholder="Course code, title or professor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="flex items-center px-7 text-sm font-medium text-white" style={{ background: "#3B9F9F" }}>
                Search
              </span>
            </div>

            {/* Filter dropdowns inside hero */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <select
                id="c-sem"
                className="w-full px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-teal"
                style={{ borderColor: "rgba(131,196,196,0.4)", background: "rgba(15,32,32,0.5)", color: "rgba(247,252,252,0.85)" }}
                value={semester}
                onChange={(e) => setFilter("semester", e.target.value)}
              >
                <option value="">All semesters</option>
                {data?.semesters.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                id="c-prof"
                className="w-full px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-teal"
                style={{ borderColor: "rgba(131,196,196,0.4)", background: "rgba(15,32,32,0.5)", color: "rgba(247,252,252,0.85)" }}
                value={professor}
                onChange={(e) => setFilter("professor", e.target.value)}
              >
                <option value="">All professors</option>
                {data?.professors.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {filtering && (
              <div className="mt-3 flex items-center">
                <button
                  className="text-xs font-semibold hover:underline"
                  style={{ color: "#83C4C4" }}
                  onClick={() => { setSearch(""); setParams({}, { replace: true }); }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-6 pt-10">
        {error && <LoadError message={error} onRetry={() => { setData(null); setAttempt((a) => a + 1); }} />}
        {!data && !error && <SkeletonList rows={5} label="Loading courses" />}
        {data && (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs uppercase tracking-wider text-teal-dark font-semibold">
                {data.courses.length} available course{data.courses.length === 1 ? "" : "s"}
              </p>
            </div>

            {data.courses.length === 0 ? (
              <EmptyState title="No courses match">Try a different search or clear the filters.</EmptyState>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {data.courses.map((c) => (
                  <Link
                    key={c.id}
                    to={`/courses/${c.id}`}
                    className="group block rounded-xl border border-edge/80 bg-paper-raised shadow-sm hover:shadow-md hover:border-teal border-l-4 border-l-teal transition-all duration-200 p-6 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top row: code + semester */}
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal-dark bg-wash px-2.5 py-1 rounded border border-teal/20">
                          {c.code}
                        </span>
                        {c.semester && (
                          <span className="text-xs bg-wash border border-edge/60 px-2.5 py-0.5 rounded-full text-ink-soft font-medium">
                            {c.semester}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-display text-xl text-ink group-hover:text-teal transition-colors leading-snug font-semibold mb-1.5">
                        {c.title}
                      </h3>

                      {/* Professor + dept */}
                      <p className="text-sm text-ink-soft mb-2 font-medium">
                        {c.professor_name}
                        {c.professor_department && (
                          <span className="text-ink-faint font-normal"> · {c.professor_department}</span>
                        )}
                      </p>

                      {/* Description */}
                      {c.description && (
                        <p className="text-sm text-ink-soft/90 line-clamp-2 mb-4 leading-relaxed">{c.description}</p>
                      )}
                    </div>

                    {/* Footer counts */}
                    <div className="flex items-center gap-4 pt-3 border-t border-edge/60 text-xs text-ink-soft mt-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                        <span className="font-semibold text-ink">{c.topic_count}</span> topics
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                        <span className="font-semibold text-ink">{c.material_count}</span> files
                      </span>
                      <span className="ml-auto text-teal font-semibold group-hover:translate-x-0.5 transition-transform">
                        View details →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
