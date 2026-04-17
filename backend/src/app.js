const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const materialRoutes = require("./routes/materialRoutes");
const projectRoutes = require("./routes/projectRoutes");
const authRoutes = require("./routes/authRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const leadRoutes = require("./routes/leadRoutes");
const solutionGalleryRoutes = require("./routes/solutionGalleryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "API is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/solution-gallery", solutionGalleryRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
