import { Link } from "react-router-dom";
import Badge from "./Badge.jsx";

// One project in a list. Used on the Open Projects page and the explore page.
export default function ProjectRow({ project: p, compact = false }) {
  return (
    <Link to={`/projects/${p.id}`} className="group block py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-display text-xl text-ink group-hover:text-teal transition-colors">{p.title}</p>
        <div className="flex items-center gap-2">
          <Badge tone={p.status === "open" ? "olive" : "muted"}>{p.status === "open" ? "Open" : "Filled"}</Badge>
          <span className="text-xs text-ink-faint">
            {p.status === "open"
              ? `${p.openings} ${p.openings === 1 ? "seat available" : "seats available"}`
              : "All slots filled"}
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {p.professor_name}
        {p.professor_department && ` · ${p.professor_department}`}
        {p.duration && ` · ${p.duration}`}
      </p>
      {!compact && <p className="mt-3 text-sm text-ink-soft max-w-prose line-clamp-2">{p.description}</p>}
      {p.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {p.skills.map((s) => (
            <li key={s} className="border border-edge bg-white px-2 py-0.5 text-xs text-ink-soft">{s}</li>
          ))}
        </ul>
      )}
    </Link>
  );
}
