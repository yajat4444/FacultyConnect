export default function EducationTimeline({ education }) {
  if (!education || education.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {education.map((e) => (
        <div key={e.id} className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-teal/10 text-teal-dark">
                {e.year_start}{e.year_end ? `–${e.year_end}` : "–Present"}
              </span>
            </div>
            <h3 className="font-display text-lg text-ink font-medium leading-snug">
              {e.degree}
            </h3>
            <p className="text-sm text-ink-soft mt-1 font-medium">
              {e.institution}
            </p>
            {e.details && (
              <p className="mt-2 text-xs text-ink-faint leading-relaxed">
                {e.details}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
