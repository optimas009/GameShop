const fs = require("fs");
const path = require("path");
const multer = require("multer");

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    if (!ok) return cb(new Error("Only image/video allowed"));
    cb(null, true);
  },
});

function buildUploadUrl(req, relativePath) {
  const p = String(relativePath || "").replace(/\\/g, "/");
  const withSlash = p.startsWith("/") ? p : `/${p}`;
  return `${req.protocol}://${req.get("host")}${withSlash}`;
}


module.exports = { UPLOAD_DIR, ensureUploadDir, upload, buildUploadUrl };
