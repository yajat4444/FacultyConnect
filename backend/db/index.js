import "../config.js";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DB_PATH lets a host put the database on a persistent disk (and tests use :memory:-like temp files).
const dbPath = process.env.DB_PATH || path.join(__dirname, "facultyconnect.sqlite3");
if (dbPath !== ":memory:") fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);

// Milestone 2 added profile fields to a table that already existed in
// Milestone 1 databases. ALTER TABLE ADD COLUMN has no "IF NOT EXISTS" in
// SQLite, so we check the column list ourselves and add what's missing —
// this keeps a Milestone-1 database working without deleting it.
const userColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
const newUserColumns = {
  photo_url: "TEXT",
  bio: "TEXT",
  office: "TEXT",
  office_hours: "TEXT",
  research_interests: "TEXT",
};
for (const [column, type] of Object.entries(newUserColumns)) {
  if (!userColumns.includes(column)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${column} ${type}`);
  }
}

export default db;
