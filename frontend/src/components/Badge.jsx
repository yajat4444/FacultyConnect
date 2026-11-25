const TONES = {
  teal: "border-teal/50 bg-teal/10 text-teal-dark",
  terracotta: "border-teal/50 bg-teal/10 text-teal-dark",
  olive: "border-olive/50 bg-olive/10 text-olive",
  amber: "border-[#C9962B]/60 bg-[#C9962B]/10 text-[#7A5A12]",
  ink: "border-ink/40 bg-ink/5 text-ink",
  muted: "border-edge bg-wash text-ink-soft",
};

export default function Badge({ tone = "muted", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${TONES[tone] || TONES.muted}`}
    >
      {children}
    </span>
  );
}
