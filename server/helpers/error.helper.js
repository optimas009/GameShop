function globalErrorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).send({ message: "File too large" });
  }

  const status =
    err.name === "MulterError" || err.message === "Only image/video allowed"
      ? 400
      : 500;

  return res.status(status).send({
    message: err.message || "Server error",
  });
}

module.exports = globalErrorHandler;