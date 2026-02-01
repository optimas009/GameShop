require("./config/env"); // load env first

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const apiRoutes = require("./routes/api.routes");

const { ensureUploadDir, UPLOAD_DIR } = require("./helpers/upload.helper");
const errorHandler = require("./helpers/error.helper");

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.disable("etag");

// DB
connectDB();

// uploads folder (static)
ensureUploadDir();
app.use("/uploads", express.static(UPLOAD_DIR));

// all APIs
app.use("/api", apiRoutes);

// error handler (must be last)
app.use(errorHandler);

// start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
