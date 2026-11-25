import { safeHref } from "../lib/format.js";
export default function PublicationList({ publications }) {
  if (!publications || publications.length === 0) {
    return <p className="text-sm text-ink-faint italic">No publications listed yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {publications.map((pub, i) => (
        <div key={pub.id} className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-wash border border-rule text-ink-faint">
                [{publications.length - i}]
              </span>
              {pub.citations != null && (
                <span className="text-xs font-semibold text-teal-dark bg-teal/10 px-2 py-0.5 rounded">
                  {pub.citations} citation{pub.citations === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {pub.link ? (
              <a
                href={safeHref(pub.link)}
                target="_blank"
                rel="noreferrer"
                className="font-display text-base font-medium text-ink hover:text-teal link-underline leading-snug block mb-2"
              >
                "{pub.title}"
              </a>
            ) : (
              <p className="font-display text-base font-medium text-ink leading-snug mb-2">
                "{pub.title}"
              </p>
            )}
            <p className="text-xs text-ink-soft leading-relaxed">
              <span className="font-medium text-ink">{pub.authors}</span>
              {pub.venue && <span className="italic text-ink-faint"> · {pub.venue}</span>}
              {pub.year && <span className="text-ink-faint"> ({pub.year})</span>}
            </p>
          </div>
          {pub.link && (
            <div className="pt-3 border-t border-rule mt-3">
              <a
                href={safeHref(pub.link)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-teal hover:text-teal-dark inline-flex items-center gap-1"
              >
                View publication ↗
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
