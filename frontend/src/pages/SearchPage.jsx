import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { safeHref } from "../lib/format.js";
import { SkeletonList } from "../components/Skeleton.jsx";
import LoadError from "../components/LoadError.jsx";
import EmptyState from "../components/EmptyState.jsx";

// One box that searches professors, publications, courses and open projects.
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const [text, setText] = useState(q);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  // Keep the box in step when the URL changes (back button, links from other pages).
  useEffect(() => setText(q), [q]);

  // Type-ahead: update the URL shortly after typing stops.
  useEffect(() => {
    const t = text.trim();
    if (t === q) return;
    const h = setTimeout(() => setParams(t ? { q: t } : {}, { replace: true }), 300);
    return () => clearTimeout(h);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setError("");
    if (q.length < 2) { setData(null); return; }
    let stale = false;
    setData(null);
    api.search(q)
      .then((d) => !stale && setData(d))
      .catch((e) => !stale && setError(e.message));
    return () => { stale = true; };
  }, [q, attempt]);

  const total = data ? data.professors.length + data.publications.length + data.courses.length + data.projects.length : 0;

  return (
    <div className="pb-24">
      <section className="relative overflow-hidden hero-mesh border-b border-rule text-paper">
        <div className="ring-deco" style={{ width: 480, height: 480, right: "-120px", top: "-160px", opacity: 0.5 }} />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 sm:py-16">
          <p className="font-display italic" style={{ color: "#83C4C4" }}>Search everything</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl max-w-2xl leading-[1.1]" style={{ color: "#FDFBF7" }}>
            Professors, publications, courses and projects
          </h1>
          <form role="search" onSubmit={(e) => { e.preventDefault(); setParams(text.trim() ? { q: text.trim() } : {}); }} className="mt-8 max-w-2xl">
            <div className="flex border bg-white" style={{ borderColor: "#F7FCFC" }}>
              <label htmlFor="global-search" className="sr-only">Search</label>
              <input
                id="global-search"
                type="search"
                autoFocus
                maxLength={100}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="A name, a paper title, a course code, a skill…"
                className="min-w-0 flex-1 bg-transparent px-5 py-4 text-ink placeholder:text-ink-faint focus:outline-none"
              />
              <button type="submit" className="px-7 text-sm font-medium text-white" style={{ background: "#3B9F9F" }}>Search</button>
            </div>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 pt-10" aria-live="polite">
        {q.length < 2 && (
          <EmptyState title="What are you looking for?">
            Type at least two letters. Try a topic like "distributed", a course code like "CS", or a professor's name.
          </EmptyState>
        )}
        {error && <LoadError message={error} onRetry={() => setAttempt((a) => a + 1)} />}
        {q.length >= 2 && !data && !error && <SkeletonList rows={3} label="Searching" />}
        {data && total === 0 && (
          <EmptyState title={`Nothing matched "${data.query}"`}
            action={<div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/professors" className="text-teal link-underline">Browse faculty</Link>
              <Link to="/courses" className="text-teal link-underline">Browse courses</Link>
              <Link to="/projects" className="text-teal link-underline">Browse projects</Link>
            </div>}>
            Check the spelling or try a shorter word.
          </EmptyState>
        )}
        {data && total > 0 && (
          <div className="space-y-12">
            <p className="text-xs uppercase tracking-wider text-teal-dark font-semibold">
              {total} result{total === 1 ? "" : "s"} for “{data.query}”
            </p>

            <Group title="Professors" index="01" items={data.professors} render={(p) => (
              <Link to={`/professor/${p.id}`} className="group block py-4">
                <span className="block font-display text-lg text-ink group-hover:text-teal transition-colors">{p.name}</span>
                <span className="block text-sm text-ink-soft">{[p.designation, p.department].filter(Boolean).join(" · ")}</span>
                {p.research_interests && <span className="block mt-1 text-xs text-ink-faint">{p.research_interests}</span>}
              </Link>
            )} />

            <Group title="Publications" index="02" items={data.publications} render={(b) => (
              <div className="py-4">
                {safeHref(b.link)
                  ? <a href={safeHref(b.link)} target="_blank" rel="noreferrer" className="font-display text-lg text-ink hover:text-teal transition-colors">“{b.title}” ↗</a>
                  : <span className="font-display text-lg text-ink">“{b.title}”</span>}
                <span className="block text-sm text-ink-soft mt-1">
                  {b.authors}{b.venue && <span className="italic"> · {b.venue}</span>}{b.year && ` (${b.year})`}
                </span>
                <Link to={`/professor/${b.professor_id}`} className="mt-1 inline-block text-xs text-teal link-underline">{b.professor_name}’s profile</Link>
              </div>
            )} />

            <Group title="Courses" index="03" items={data.courses} render={(c) => (
              <Link to={`/courses/${c.id}`} className="group grid grid-cols-[88px_1fr] gap-x-5 py-4">
                <span className="font-display text-teal">{c.code}</span>
                <span>
                  <span className="block text-ink group-hover:text-teal transition-colors">{c.title}</span>
                  <span className="block text-xs text-ink-faint mt-0.5">{c.professor_name}{c.semester && ` · ${c.semester}`}</span>
                </span>
              </Link>
            )} />

            <Group title="Open projects" index="04" items={data.projects} render={(s) => (
              <Link to={`/projects/${s.id}`} className="group block py-4">
                <span className="block font-display text-lg text-ink group-hover:text-teal transition-colors">{s.title}</span>
                <span className="block text-sm text-ink-soft">{s.professor_name}{s.duration && ` · ${s.duration}`}</span>
                {s.skills.length > 0 && <span className="block mt-1 text-xs text-ink-faint">{s.skills.join(" · ")}</span>}
              </Link>
            )} />
          </div>
        )}
      </div>
    </div>
  );
}

function Group({ title, index, items, render }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby={`sr-${index}`}>
      <p className="section-mark">{index}</p>
      <h2 id={`sr-${index}`} className="font-display text-2xl text-ink mb-2">
        {title} <span className="text-sm text-ink-faint font-sans">({items.length})</span>
      </h2>
      <ul className="border-t border-ink divide-y divide-rule">
        {items.map((it, i) => <li key={`${title}-${it.id ?? i}`}>{render(it)}</li>)}
      </ul>
    </section>
  );
}
