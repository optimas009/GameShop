
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const UPLOAD_GAMES_DIR = path.join(process.cwd(), "uploads", "games");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    let dest = UPLOAD_GAMES_DIR;

    if (file.fieldname === "file") {

      const t = String(req.query.type || "").toLowerCase();
      if (t === "cover") dest = path.join(UPLOAD_GAMES_DIR, "cover");
      else if (t === "screenshot") dest = path.join(UPLOAD_GAMES_DIR, "screenshots");
    }

    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const uploadGames = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    if (!ok) return cb(new Error("Only image/video allowed"));
    cb(null, true);
  },
});

module.exports = { UPLOAD_GAMES_DIR, uploadGames };
