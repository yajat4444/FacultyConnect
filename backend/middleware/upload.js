import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_ROOT = process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads");
const PHOTOS_DIR = path.join(UPLOADS_ROOT, "photos");
export const MATERIALS_DIR = path.join(UPLOADS_ROOT, "materials");

fs.mkdirSync(PHOTOS_DIR, { recursive: true });
fs.mkdirSync(MATERIALS_DIR, { recursive: true });

// ---- Profile photos -------------------------------------------------------

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX = 5 * 1024 * 1024; // 5MB

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PHOTOS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
  },
});

export const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: PHOTO_MAX },
  fileFilter: (req, file, cb) => {
    if (!PHOTO_TYPES.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, or WEBP images are allowed."));
    }
    cb(null, true);
  },
});

// ---- Course materials -------------------------------------------------------
// Both the MIME type and the extension have to match, so a renamed file
// can't slip through. No HTML/SVG/JS is allowed, which keeps uploads from
// being able to run script when opened in the browser.

const MATERIAL_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};
export const MATERIAL_MAX = 25 * 1024 * 1024; // 25MB

const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MATERIALS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const rand = crypto.randomBytes(4).toString("hex");
    cb(null, `course-${req.params.id}-${Date.now()}-${rand}${ext}`);
  },
});

export const materialUpload = multer({
  storage: materialStorage,
  limits: { fileSize: MATERIAL_MAX, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = MATERIAL_TYPES[file.mimetype];
    if (!allowed || !allowed.includes(ext)) {
      return cb(new Error("Allowed files: PDF, PPT/PPTX, DOC/DOCX, TXT, ZIP, PNG, JPG."));
    }
    cb(null, true);
  },
});

// ---- Content check --------------------------------------------------------
// The browser-supplied MIME type and the file name can both be faked, so also
// look at the first bytes of what was actually saved.
const SIGNATURES = {
  ".jpg": [[0xff, 0xd8, 0xff]],
  ".jpeg": [[0xff, 0xd8, 0xff]],
  ".png": [[0x89, 0x50, 0x4e, 0x47]],
  ".pdf": [[0x25, 0x50, 0x44, 0x46]],
  ".zip": [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06]],
  ".docx": [[0x50, 0x4b, 0x03, 0x04]],
  ".pptx": [[0x50, 0x4b, 0x03, 0x04]],
  ".doc": [[0xd0, 0xcf, 0x11, 0xe0]],
  ".ppt": [[0xd0, 0xcf, 0x11, 0xe0]],
};

export function hasValidSignature(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(512);
    const n = fs.readSync(fd, buf, 0, 512, 0);
    if (n === 0) return false;
    if (ext === ".webp") return buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
    if (ext === ".txt") return !buf.subarray(0, n).includes(0);
    const sigs = SIGNATURES[ext];
    if (!sigs) return false;
    return sigs.some((sig) => sig.every((b, i) => buf[i] === b));
  } catch {
    return false;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

export function removeFileQuietly(filePath) {
  try { fs.unlinkSync(filePath); } catch { /* already gone */ }
}
