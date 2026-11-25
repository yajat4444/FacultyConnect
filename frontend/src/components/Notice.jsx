const TONES = {
  error: "border-red-300 bg-red-50 text-red-700",
  success: "border-olive/50 bg-olive/10 text-olive",
  info: "border-edge bg-wash text-ink-soft",
};

export default function Notice({ tone = "info", children }) {
  if (!children) return null;
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`border rounded-lg px-4 py-3 text-sm ${TONES[tone] || TONES.info}`}>
      {children}
    </p>
  );
}
