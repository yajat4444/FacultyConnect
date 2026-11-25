// A titled, bordered box that groups a set of related fields or content.
export default function Panel({ id, index, title, hint, aside, children }) {
  return (
    <section id={id} className="panel scroll-mt-28">
      <header className="panel-head">
        <div>
          {index && <p className="section-mark">{index}</p>}
          <h2 className="font-display text-xl text-ink">{title}</h2>
          {hint && <p className="mt-1 text-sm text-ink-soft max-w-prose">{hint}</p>}
        </div>
        {aside}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
