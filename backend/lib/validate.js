// Small input-cleaning helpers shared by the route files.

export function str(value, max = 255) {
  // Objects and arrays (e.g. {"$ne":1} from a hostile client) are not text.
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).trim().slice(0, max);
}

export function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function isTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function skillList(value) {
  const seen = new Set();
  const out = [];
  for (const raw of String(value || "").split(",")) {
    const s = raw.trim().slice(0, 40);
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      out.push(s);
    }
  }
  return out.slice(0, 15);
}

export function isEmail(value) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

// "2019", or empty. Keeps free-text out of year columns.
export function isYear(value) {
  return /^(19|20)\d{2}$/.test(value);
}

// Escape % and _ so user text is matched literally inside LIKE '%...%' ... ESCAPE '\'.
export function likePattern(text) {
  return `%${String(text).replace(/[\\%_]/g, (c) => "\\" + c)}%`;
}
