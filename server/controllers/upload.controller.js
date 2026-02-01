const path = require("path");
const { buildUploadUrl } = require("../helpers/upload.helper");
const { deleteLocalUploads } = require("../helpers/media.helper");

function uploadSingle(req, res) {
  if (!req.file) return res.status(400).send({ message: "No file uploaded" });

  // absolute -> "/uploads/..."
  const relPath = req.file.path
    .replace(process.cwd(), "")
    .replace(/\\/g, "/");

  const url = buildUploadUrl(req, relPath);

  return res.send({ url, path: relPath });
}


async function deleteUpload(req, res) {
  const { path } = req.body || {};
  if (!path) return res.status(400).send({ message: "path required" });

  await deleteLocalUploads([path]);
  return res.send({ ok: true });
}

module.exports = { uploadSingle, deleteUpload };