import multer from "multer";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;

    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File exceeds the allowed size"
        : "Invalid multipart request";

    return res.status(status).json({
      error: message,
      code: err.code,
    });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({ error: "Internal server error" });
}
