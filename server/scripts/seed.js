import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Task from "../models/Task.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  await Task.deleteMany({});
  await User.deleteMany({});

  const adminHash = await bcrypt.hash("Admin@123", 10);
  const tempHash = await bcrypt.hash("Temp@123", 10);

  const admin = await User.create({
    employeeId: "ADM001",
    firstName: "Admin",
    lastName: "User",
    passwordHash: adminHash,
    role: "admin",
    mustChangePassword: false,
    active: true
  });

  const emp1 = await User.create({
    employeeId: "EMP101",
    firstName: "Sara",
    lastName: "Ben Ali",
    passwordHash: tempHash,
    role: "employee",
    mustChangePassword: true,
    active: true
  });

  const emp2 = await User.create({
    employeeId: "EMP102",
    firstName: "Yassine",
    lastName: "Trabelsi",
    passwordHash: tempHash,
    role: "employee",
    mustChangePassword: true,
    active: true
  });

  await Task.create([
    {
      title: "Prepare client update report",
      description: "Compile the latest client feedback and send to admin.",
      status: "todo",
      assignedTo: emp1._id,
      createdBy: admin._id,
      comments: [{ author: admin._id, text: "Please include Q1 overview." }]
    },
    {
      title: "Database optimization",
      description: "Review indexes and propose improvements.",
      status: "in_progress",
      assignedTo: emp2._id,
      createdBy: admin._id
    }
  ]);

  console.log("Seed done.");
  console.log("Admin: ADM001 / Admin@123");
  console.log("Employee: EMP101 / Temp@123 (must change password)");
  console.log("Employee: EMP102 / Temp@123 (must change password)");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
