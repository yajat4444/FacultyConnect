export default function SectionHeading({ mark, title, description, align = "left" }) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {mark && <p className="section-mark mb-2">{mark}</p>}
      <h2 className="font-display text-3xl sm:text-4xl text-ink">{title}</h2>
      {description && (
        <p className={`mt-3 text-ink-soft text-base max-w-prose ${align === "center" ? "mx-auto" : ""}`}>
          {description}
        </p>
      )}
    </div>
  );
}
