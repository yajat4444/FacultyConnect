import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function AnnouncementTicker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api
      .announcements()
      .then((data) => setItems(data.announcements))
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  // Duplicate the list so the marquee can loop seamlessly at -50%.
  const looped = [...items, ...items];

  return (
    <div className="border-y border-rule bg-paper-raised overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 flex items-center gap-6 h-12">
        <span className="shrink-0 font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-teal">
          Announcements
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-track flex whitespace-nowrap gap-16 w-max">
            {looped.map((item, i) => (
              <span key={`${item.id}-${i}`} className="text-sm text-ink-soft">
                {item.body}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
