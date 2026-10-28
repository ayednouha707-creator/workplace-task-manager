import express from "express";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

function canAccessTask(task, user) {
  if (user.role === "admin") return true;
  return task.assignedTo.toString() === user.id;
}

// Admin creates & assigns a task
// POST /api/tasks
router.post("/", auth, requireRole("admin"), async (req, res) => {
  const { title, description, assignedEmployeeId } = req.body || {};
  if (!title || !assignedEmployeeId) return res.status(400).json({ message: "Missing fields" });

  const employee = await User.findOne({ employeeId: assignedEmployeeId.trim(), role: "employee", active: true });
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  const task = await Task.create({
    title: title.trim(),
    description: (description || "").trim(),
    assignedTo: employee._id,
    createdBy: req.user.id
  });

  res.status(201).json(task);
});

// Admin tracking: all tasks
// GET /api/tasks/all
router.get("/all", auth, requireRole("admin"), async (req, res) => {
  const tasks = await Task.find()
    .populate("assignedTo", "employeeId firstName lastName role")
    .populate("createdBy", "employeeId firstName lastName role")
    .populate("comments.author", "employeeId firstName lastName role")
    .sort({ createdAt: -1 });

  res.json(tasks);
});

// Employee: my tasks
// GET /api/tasks/mine
router.get("/mine", auth, async (req, res) => {
  // Admin can also use /mine to see tasks they created/assigned? Here we return assignedTo = self for employees; admin gets empty typically.
  const tasks = await Task.find({ assignedTo: req.user.id })
    .populate("comments.author", "employeeId firstName lastName role")
    .sort({ createdAt: -1 });

  res.json(tasks);
});

// Update status (employee only own; admin any)
// PATCH /api/tasks/:id/status
router.patch("/:id/status", auth, async (req, res) => {
  const { status } = req.body || {};
  if (!["todo", "in_progress", "done"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  if (!canAccessTask(task, req.user)) return res.status(403).json({ message: "Forbidden" });

  task.status = status;
  await task.save();

  res.json(task);
});

// Add comment (employee only own; admin any)
// POST /api/tasks/:id/comments
router.post("/:id/comments", auth, async (req, res) => {
  const { text } = req.body || {};
  if (!text || !String(text).trim()) return res.status(400).json({ message: "Comment is empty" });

  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  if (!canAccessTask(task, req.user)) return res.status(403).json({ message: "Forbidden" });

  task.comments.push({ author: req.user.id, text: String(text).trim() });
  await task.save();

  const populated = await Task.findById(task._id).populate("comments.author", "employeeId firstName lastName role");
  res.status(201).json(populated);
});

export default router;
