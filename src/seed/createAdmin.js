require("dotenv").config();
const connectDB = require("../config/db");
const Admin = require("../models/Admin");

const createAdmin = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in .env");
  }

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log("Admin already exists");
    process.exit(0);
  }

  await Admin.create({ email, password });
  console.log("Admin created successfully");
  process.exit(0);
};

createAdmin().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
