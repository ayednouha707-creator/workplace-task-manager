import express from "express";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/users/employees  (admin only) - list employees for assignment dropdown
router.get("/employees", auth, requireRole("admin"), async (req, res) => {
  const users = await User.find({ role: "employee", active: true })
    .select("employeeId firstName lastName role active")
    .sort({ lastName: 1, firstName: 1 });

  res.json(users);
});

export default router;
