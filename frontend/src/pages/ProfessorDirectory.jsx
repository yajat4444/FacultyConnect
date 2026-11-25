import LoadError from "../components/LoadError.jsx";
import { SkeletonList } from "../components/Skeleton.jsx";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, API_ORIGIN } from "../lib/api.js";

export default function ProfessorDirectory() {
  const [professors, setProfessors] = useState(null);
  const [failed, setFailed] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");

  useEffect(() => {
    const handle = setTimeout(() => {
      api
        .professors(q)
        .then((data) => { setProfessors(data.professors); setFailed(""); })
        .catch((e) => { setProfessors([]); setFailed(e.message); });
    }, 200);
    return () => clearTimeout(handle);
  }, [q, attempt]);

  return (
    <div className="pb-24">
      {/* Hero section with search embedded inside — matches explore/landing page */}
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
            Browse all department faculty
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl max-w-2xl leading-[1.1]" style={{ color: "#FDFBF7" }}>
            Every professor's page, in one place
          </h1>
          <p className="mt-3 max-w-2xl text-base" style={{ color: "rgba(247,252,252,0.75)" }}>
            Explore faculty research interests, open student projects, teaching syllabus, publications, and office contact information.
          </p>

          {/* Search bar inside hero — same style as landing page */}
          <div className="mt-8 max-w-2xl">
            <div className="flex border bg-white" style={{ borderColor: "#F7FCFC" }}>
              <label htmlFor="prof-search" className="sr-only">Search Faculty</label>
              <input
                id="prof-search"
                type="search"
                placeholder="Search by name, department, designation, or research topic…"
                className="min-w-0 flex-1 bg-transparent px-5 py-4 text-ink placeholder:text-ink-faint focus:outline-none"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <span className="flex items-center px-7 text-sm font-medium text-white" style={{ background: "#3B9F9F" }}>
                Search
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-6 pt-10">
        {professors === null && (
          <SkeletonList rows={4} label="Loading the faculty directory" />
        )}
        {failed && <LoadError message={failed} onRetry={() => { setFailed(""); setProfessors(null); setAttempt((a) => a + 1); }} />}
        {!failed && professors && professors.length === 0 && (
          <div className="rounded-xl border border-edge/80 bg-paper-raised p-12 text-center">
            <p className="text-base text-ink font-semibold">No faculty members found</p>
            <p className="mt-1 text-sm text-ink-soft">No professors match "{q}". Try clearing your search term.</p>
            <button
              onClick={() => setQ("")}
              className="mt-4 text-xs font-semibold text-teal hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
        {professors && professors.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs uppercase tracking-wider text-teal-dark font-semibold">
                {professors.length} faculty member{professors.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {professors.map((prof) => (
                <Link
                  key={prof.id}
                  to={`/professor/${prof.id}`}
                  className="group flex items-start gap-4 rounded-xl border border-edge/80 bg-paper-raised shadow-sm hover:shadow-md hover:border-teal border-l-4 border-l-teal transition-all duration-200 p-6"
                >
                  {/* Avatar with teal accent border */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-teal/40 bg-wash flex items-center justify-center font-display text-2xl text-teal-dark shadow-xs">
                    {prof.photo_url ? (
                      <img
                        src={`${API_ORIGIN}${prof.photo_url}`}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      prof.name.charAt(0)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-xl text-ink group-hover:text-teal transition-colors font-semibold leading-snug">
                        {prof.name}
                      </h3>
                      {prof.designation && (
                        <span className="text-[11px] font-semibold text-teal-dark bg-wash px-2 py-0.5 rounded border border-teal/20 shrink-0">
                          {prof.designation}
                        </span>
                      )}
                    </div>
                    {prof.department && (
                      <p className="text-sm text-ink-soft mt-1 font-medium">
                        {prof.department}
                      </p>
                    )}
                    {prof.research_interests && (
                      <p className="mt-2.5 text-xs text-ink-soft/90 line-clamp-2 leading-relaxed bg-wash/60 p-2 rounded border border-edge/40">
                        <span className="font-semibold text-teal-dark mr-1">Research:</span>
                        {prof.research_interests}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-end">
                      <span className="text-xs text-teal font-semibold group-hover:translate-x-0.5 transition-transform">
                        View portfolio →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
