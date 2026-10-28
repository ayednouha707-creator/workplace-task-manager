import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { employeeId, password } = req.body || {};
  if (!employeeId || !password) return res.status(400).json({ message: "Missing fields" });

  const user = await User.findOne({ employeeId: employeeId.trim() });
  if (!user || !user.active) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role, employeeId: user.employeeId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user._id.toString(),
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    }
  });
});

// POST /api/auth/first-change-password
// Requires JWT (user has logged in). Enforces mustChangePassword=true, then flips it to false.
router.post("/first-change-password", async (req, res) => {
  // lightweight auth inline to avoid circular imports
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ message: "Missing fields" });
  if (String(newPassword).length < 6) return res.status(400).json({ message: "Password too short (min 6)" });

  const user = await User.findById(payload.id);
  if (!user || !user.active) return res.status(401).json({ message: "Invalid session" });

  if (!user.mustChangePassword) {
    return res.status(400).json({ message: "Password change not required" });
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Current password is wrong" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = false;
  await user.save();

  res.json({ ok: true });
});

export default router;
