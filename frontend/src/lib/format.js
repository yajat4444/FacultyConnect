// Date and number formatting helpers shared across pages.

export function parseDate(value) {
  if (!value) return null;
  // Plain dates (YYYY-MM-DD) are calendar dates: treat as local midnight so
  // they don't shift a day in other timezones.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  // SQLite timestamps are UTC: "YYYY-MM-DD HH:MM:SS".
  return new Date(value.replace(" ", "T") + "Z");
}

export function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  const d = parseDate(value);
  return d ? d.toLocaleDateString("en-IN", options) : "";
}

export function formatTime(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

// Whole days from today (local) to the given date. Negative = in the past.
export function daysFromToday(value) {
  const d = parseDate(value);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

export function relativeDay(value) {
  const n = daysFromToday(value);
  if (n === null) return "";
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1) return `In ${n} days`;
  return `${-n} days ago`;
}

export function timeAgo(value) {
  const d = parseDate(value);
  if (!d) return "";
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

export function fileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const EVENT_KINDS = {
  exam: { label: "Exam", tone: "terracotta" },
  quiz: { label: "Quiz", tone: "amber" },
  assignment: { label: "Assignment", tone: "olive" },
  date: { label: "Important date", tone: "ink" },
};

export const MATERIAL_CATEGORIES = {
  syllabus: "Syllabus",
  notes: "Lecture notes",
  slides: "Slides",
  reading: "Readings",
  other: "Other",
};

export const APPLICATION_STATUSES = {
  pending: { label: "Pending", tone: "amber" },
  shortlisted: { label: "Shortlisted", tone: "ink" },
  accepted: { label: "Accepted", tone: "olive" },
  rejected: { label: "Not selected", tone: "muted" },
};

// "Dr. Aanya Kapoor" -> "Dr. Kapoor"; "Stu Dent" -> "Stu". Used for greetings
// so a title is never mistaken for a first name.
const TITLES = /^(dr|prof|professor|mr|mrs|ms)\.?$/i;
export function shortName(full = "") {
  const parts = full.trim().split(/\s+/);
  if (parts.length > 1 && TITLES.test(parts[0])) return `${parts[0]} ${parts[parts.length - 1]}`;
  return parts[0] || "";
}

// Only ever link to http(s) addresses. Anything else (javascript:, data:, ...)
// renders as plain text instead of a live link, even if it got into the data.
export function safeHref(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : undefined;
  } catch {
    return undefined;
  }
}
