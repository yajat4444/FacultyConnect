export default function EmptyState({ title, children, action }) {
  return (
    <div className="border border-dashed border-edge bg-white/60 px-6 py-10 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {children && <p className="mt-2 text-sm text-ink-soft max-w-md mx-auto">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
