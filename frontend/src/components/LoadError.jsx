// Shown when a list or page fails to load, with a retry button.
export default function LoadError({ message, onRetry }) {
  return (
    <div role="alert" className="border border-red-300 bg-red-50 px-6 py-8 text-center">
      <p className="font-display text-lg text-ink">We couldn't load this</p>
      <p className="mt-1 text-sm text-ink-soft">{message || "Check your connection and try again."}</p>
      {onRetry && <button onClick={onRetry} className="btn-secondary mt-4">Try again</button>}
    </div>
  );
}
