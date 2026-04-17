require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const Admin = require("./models/Admin");

const PORT = process.env.PORT || 5000;

const ensureAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("[Bootstrap] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin auto-seed");
    return;
  }
  try {
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log(`[Bootstrap] Admin already exists: ${email}`);
      return;
    }
    await Admin.create({ email, password });
    console.log(`[Bootstrap] Admin created: ${email}`);
  } catch (error) {
    console.error("[Bootstrap] Failed to auto-seed admin:", error.message);
  }
};

const startServer = async () => {
  await connectDB();
  await ensureAdmin();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
