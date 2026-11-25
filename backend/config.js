// Loads .env first and checks the settings that matter for security.
// Import this before anything that reads process.env.
import "dotenv/config";

export const isProd = process.env.NODE_ENV === "production";
export const isTest = process.env.NODE_ENV === "test";

const PLACEHOLDER = "change-this-to-a-long-random-string";

if (!process.env.JWT_SECRET) {
  if (isTest) process.env.JWT_SECRET = "test-secret-not-for-real-use-0123456789";
  else {
    console.error("JWT_SECRET is not set. Copy .env.example to .env and set a long random value.");
    process.exit(1);
  }
}
if (isProd && (process.env.JWT_SECRET === PLACEHOLDER || process.env.JWT_SECRET.length < 32)) {
  console.error("Refusing to start in production with a placeholder or short JWT_SECRET (need 32+ characters).");
  process.exit(1);
}
if (!isProd && !isTest && process.env.JWT_SECRET === PLACEHOLDER) {
  console.warn("Warning: JWT_SECRET is still the placeholder value. Change it before deploying.");
}

// Comma-separated list of allowed browser origins.
export const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);
