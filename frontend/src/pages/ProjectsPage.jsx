import LoadError from "../components/LoadError.jsx";
import { SkeletonList } from "../components/Skeleton.jsx";
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api.js";
import EmptyState from "../components/EmptyState.jsx";
import Badge from "../components/Badge.jsx";

export default function ProjectsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const professor = params.get("professor") || "";
  const skill = params.get("skill") || "";
  const department = params.get("department") || "";
  const showFilled = params.get("status") === "all";

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
      .projects({ q, professor, skill, department, status: showFilled ? "all" : "" })
      .then((d) => !stale && setData(d))
      .catch((e) => !stale && setError(e.message));
    return () => { stale = true; };
  }, [q, professor, skill, department, showFilled, attempt]);

  const filtering = q || professor || skill || department;

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
            Discover open positions
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl max-w-2xl leading-[1.1]" style={{ color: "#FDFBF7" }}>
            Find a project to join
          </h1>
          <p className="mt-3 max-w-2xl text-base" style={{ color: "rgba(247,252,252,0.75)" }}>
            Research and engineering positions posted by professors across departments. Open one to read details and apply directly.
          </p>

          {/* Search + filters inside hero — same style as landing page */}
          <div className="mt-8 max-w-3xl">
            <div className="flex border bg-white" style={{ borderColor: "#F7FCFC" }}>
              <label htmlFor="p-search" className="sr-only">Search Projects</label>
              <input
                id="p-search"
                type="search"
                className="min-w-0 flex-1 bg-transparent px-5 py-4 text-ink placeholder:text-ink-faint focus:outline-none"
                placeholder="Title, topic, skill or professor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="flex items-center px-7 text-sm font-medium text-white" style={{ background: "#3B9F9F" }}>
                Search
              </span>
            </div>

            {/* Filter dropdowns inside hero */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <select
                id="p-prof"
                className="w-full px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-teal"
                style={{ borderColor: "rgba(131,196,196,0.4)", background: "rgba(15,32,32,0.5)", color: "rgba(247,252,252,0.85)" }}
                value={professor}
                onChange={(e) => setFilter("professor", e.target.value)}
              >
                <option value="">All professors</option>
                {data?.facets.professors.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                id="p-dept"
                className="w-full px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-teal"
                style={{ borderColor: "rgba(131,196,196,0.4)", background: "rgba(15,32,32,0.5)", color: "rgba(247,252,252,0.85)" }}
                value={department}
                onChange={(e) => setFilter("department", e.target.value)}
              >
                <option value="">All departments</option>
                {data?.facets.departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                id="p-skill"
                className="w-full px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-teal"
                style={{ borderColor: "rgba(131,196,196,0.4)", background: "rgba(15,32,32,0.5)", color: "rgba(247,252,252,0.85)" }}
                value={skill}
                onChange={(e) => setFilter("skill", e.target.value)}
              >
                <option value="">All skills</option>
                {data?.facets.skills.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Checkbox + reset inside hero */}
            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "rgba(247,252,252,0.75)" }}>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#3B9F9F] rounded"
                  checked={showFilled}
                  onChange={(e) => setFilter("status", e.target.checked ? "all" : "")}
                />
                <span className="font-medium text-xs">Include filled positions</span>
              </label>
              {filtering && (
                <button
                  className="text-xs font-semibold hover:underline"
                  style={{ color: "#83C4C4" }}
                  onClick={() => { setSearch(""); setParams(showFilled ? { status: "all" } : {}, { replace: true }); }}
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-6 pt-10">
        {error && <LoadError message={error} onRetry={() => { setData(null); setAttempt((a) => a + 1); }} />}
        {!data && !error && <SkeletonList rows={5} label="Loading open projects" />}
        {data && (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs uppercase tracking-wider text-teal-dark font-semibold">
                {data.projects.length} available project{data.projects.length === 1 ? "" : "s"}
              </p>
            </div>

            {data.projects.length === 0 ? (
              <EmptyState title="No projects match">Try removing a filter, or check back later as professors post new positions.</EmptyState>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {data.projects.map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className={`group block rounded-xl border border-edge/80 bg-paper-raised shadow-sm hover:shadow-md hover:border-teal border-l-4 ${
                      p.status === "open" ? "border-l-teal" : "border-l-ink/30 opacity-90 hover:opacity-100"
                    } transition-all duration-200 p-6 flex flex-col justify-between`}
                  >
                    <div>
                      {/* Status badge + seats */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge tone={p.status === "open" ? "olive" : "muted"}>
                          {p.status === "open" ? "Open" : "Filled"}
                        </Badge>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          p.status === "open"
                            ? "text-teal-dark bg-wash border-teal/20"
                            : "text-ink-faint bg-wash/60 border-edge/60"
                        }`}>
                          {p.status === "open"
                            ? `${p.openings} ${p.openings === 1 ? "seat" : "seats"}`
                            : "All slots filled"}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-display text-xl text-ink group-hover:text-teal transition-colors leading-snug font-semibold mb-1.5">
                        {p.title}
                      </h3>

                      {/* Professor + dept + duration */}
                      <p className="text-sm text-ink-soft mb-2 font-medium">
                        {p.professor_name}
                        {p.professor_department && <span className="text-ink-faint font-normal"> · {p.professor_department}</span>}
                        {p.duration && <span className="text-ink-faint font-normal"> · {p.duration}</span>}
                      </p>

                      {/* Description */}
                      {p.description && (
                        <p className="text-sm text-ink-soft/90 line-clamp-2 mb-4 leading-relaxed">{p.description}</p>
                      )}
                    </div>

                    {/* Skills */}
                    {p.skills && p.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-edge/60 mt-2">
                        {p.skills.map((s) => (
                          <span key={s} className="bg-wash border border-teal/20 px-2.5 py-0.5 rounded-md text-xs font-medium text-teal-dark">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
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
