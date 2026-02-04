export const SERVER_BASE_URL =
  process.env.REACT_APP_SERVER_BASE_URL || "http://localhost:5000";

const isHttpUrl = (url) => /^https?:\/\/.+/i.test(String(url || "").trim());
const isUploadsPath = (url) => String(url || "").trim().startsWith("/uploads/");

// allow:
// 1) "/uploads/..."
// 2) any absolute http(s) URL (Cloudinary, YouTube, etc.)
const isAllowedMediaUrl = (url) => {
  const s = String(url || "").trim();
  if (!s) return true;

  if (isUploadsPath(s)) return true;
  if (isHttpUrl(s)) return true;

  return false;
};

const toAbsoluteMediaUrl = (url) => {
  const s = String(url || "").trim();
  if (!s) return "";

  // if stored "/uploads/..." -> convert to full URL
  if (isUploadsPath(s)) return `${SERVER_BASE_URL}${s}`;

  // already absolute URL (Cloudinary / YouTube / etc.)
  return s;
};

// YouTube helpers
const getYoutubeId = (url) => {
  const u = String(url || "").trim();

  const short = u.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (short?.[1]) return short[1];

  const long = u.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (long?.[1]) return long[1];

  const embed = u.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embed?.[1]) return embed[1];

  return null;
};

const toYoutubeEmbed = (url) => {
  const id = getYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
};

// mp4 check only for external urls
const isMp4Url = (url) => /\.mp4(\?.*)?$/i.test(String(url || "").trim());

const MediaUtil = {
  SERVER_BASE_URL,
  isHttpUrl,
  isUploadsPath,
  isAllowedMediaUrl,
  toAbsoluteMediaUrl,
  getYoutubeId,
  toYoutubeEmbed,
  isMp4Url,
};

export default MediaUtil;
