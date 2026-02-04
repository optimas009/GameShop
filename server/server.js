require("./config/env"); // load env first

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const apiRoutes = require("./routes/api.routes");
const errorHandler = require("./helpers/error.helper");

const app = express();

// middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL, // set this in Render env
    credentials: true,
  })
);

app.use(express.json());
app.disable("etag");


// Health check 
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});


// DB
connectDB();

// all APIs
app.use("/api", apiRoutes);

// error handler (must be last)
app.use(errorHandler);

// start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
