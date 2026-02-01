const path = require("path");
const fs = require("fs");
const { UPLOAD_DIR } = require("./upload.helper");

const isAllowedMediaUrl = (url) => {
  const s = String(url || "").trim();
  if (!s) return true;

  if (s.startsWith("/uploads/")) return true;

  if (/^https?:\/\//i.test(s)) {
    try {
      const pathname = new URL(s).pathname;
      return pathname && pathname.startsWith("/uploads/");
    } catch {
      return false;
    }
  }

  return false;
};

function isYoutubeUrl(u) {
  const s = String(u || "").trim();
  if (!s) return false;
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(s);
}

function normalizeStringArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x || "").trim()).filter(Boolean);
}

function uniqueArray(arr) {
  return [...new Set(normalizeStringArray(arr))];
}

/* ========= delete local uploads helpers ========= */

function extractUploadsPath(u) {
  const s = String(u || "").trim();
  if (!s) return null;

  if (s.startsWith("/uploads/")) return s;

  if (/^https?:\/\//i.test(s)) {
    try {
      const pathname = new URL(s).pathname;
      if (pathname && pathname.startsWith("/uploads/")) return pathname;
    } catch {}
  }

  return null;
}

async function deleteLocalUploadByUrl(u) {
  const uploadPath = extractUploadsPath(u); // e.g. "/uploads/games/cover/a.jpg"
  if (!uploadPath) return;

  // Make it a safe relative path: "uploads/games/cover/a.jpg"
  const rel = uploadPath.replace(/^\//, "");

  // Absolute path on disk
  const abs = path.join(process.cwd(), rel);

  // (Safety) Ensure it's inside /uploads
  const uploadsAbs = path.join(process.cwd(), "uploads");
  if (!abs.startsWith(uploadsAbs)) return;

  try {
    if (fs.existsSync(abs)) {
      await fs.promises.unlink(abs);
    }
  } catch (e) {
    console.error("DELETE UPLOAD FAILED:", abs, e.message);
  }
}


async function deleteLocalUploads(urls) {
  const arr = uniqueArray(urls);
  await Promise.allSettled(arr.map(deleteLocalUploadByUrl));
}

function diffRemovedLocalUploads(oldArr, newArr) {
  const norm = (arr) =>
    uniqueArray(arr)
      .map((u) => extractUploadsPath(u))
      .filter(Boolean);

  const oldSet = new Set(norm(oldArr));
  const newSet = new Set(norm(newArr));

  const removed = [];
  for (const p of oldSet) {
    if (!newSet.has(p)) removed.push(p);
  }
  return removed;
}

/* ===================== GAME MEDIA HELPERS ===================== */

function normalizeCoverMedia(v) {
  return String(v || "").trim();
}

function normalizeScreenshots(arr) {
  return uniqueArray(arr);
}

function collectGameMedia(coverMedia, screenshots) {
  const cover = normalizeCoverMedia(coverMedia);
  const shots = Array.isArray(screenshots) ? screenshots : [];
  return [cover, ...shots].filter(Boolean);
}

module.exports = {
  isAllowedMediaUrl,
  isYoutubeUrl,
  normalizeStringArray,
  uniqueArray,
  extractUploadsPath,
  deleteLocalUploadByUrl,
  deleteLocalUploads,
  diffRemovedLocalUploads,
  normalizeCoverMedia,
  normalizeScreenshots,
  collectGameMedia,
};
