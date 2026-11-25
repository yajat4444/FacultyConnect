import { parseDate } from "../lib/format.js";

// Calendar-leaf date marker: month on top, day number below.
export default function DateBlock({ date, muted = false }) {
  const d = parseDate(date);
  if (!d) return null;
  return (
    <div
      className={`w-14 shrink-0 border text-center ${
        muted ? "border-rule text-ink-faint bg-paper-raised" : "border-ink bg-white text-ink"
      }`}
      aria-label={d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
    >
      <div className={`py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${muted ? "bg-wash" : "bg-ink text-paper"}`}>
        {d.toLocaleDateString("en-IN", { month: "short" })}
      </div>
      <div className="font-display text-2xl leading-none py-1.5">{d.getDate()}</div>
      <div className="pb-1 text-[10px] text-ink-faint">{d.getFullYear()}</div>
    </div>
  );
}
