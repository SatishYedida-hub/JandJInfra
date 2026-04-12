const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const materialRoutes = require("./routes/materialRoutes");
const projectRoutes = require("./routes/projectRoutes");
const authRoutes = require("./routes/authRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const leadRoutes = require("./routes/leadRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
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

app.use(notFound);
app.use(errorHandler);

module.exports = app;
