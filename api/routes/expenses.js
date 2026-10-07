import express from "express";
import Expense  from "../models/Expense.js";

const router = express.Router();

// ─────────────────────────────────────────────────────
// CREATE — POST /api/expenses
// Body: { firestoreId, userId, title, amount, ... }
// ─────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    console.log("✅ Inserted:", expense.title);
    res.json({ success: true, data: expense });
  } catch (err) {
    console.error("❌ Insert error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────
// READ ALL — GET /api/expenses/:userId
// Query params: sortBy (field), order (asc/desc), category
// Examples:
//   /api/expenses/uid123                          → all, newest first
//   /api/expenses/uid123?sortBy=amount&order=desc → highest amount first
//   /api/expenses/uid123?category=food            → food only
// ─────────────────────────────────────────────────────
router.get("/:userId", async (req, res) => {
  try {
    const { sortBy = "createdAt", order = "desc", category } = req.query;

    const filter = { userId: req.params.userId };
    if (category) filter.category = category;

    const sortOrder = order === "asc" ? 1 : -1;

    const expenses = await Expense
      .find(filter)
      .sort({ [sortBy]: sortOrder });

    console.log(`📋 Listed ${expenses.length} expenses for user ${req.params.userId}`);
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    console.error("❌ Find error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────
// READ ONE — GET /api/expenses/single/:firestoreId
// ─────────────────────────────────────────────────────
router.get("/single/:firestoreId", async (req, res) => {
  try {
    const expense = await Expense.findOne({ firestoreId: req.params.firestoreId });
    if (!expense) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────
// UPDATE — PUT /api/expenses/:firestoreId
// Body: fields to update
// ─────────────────────────────────────────────────────
router.put("/:firestoreId", async (req, res) => {
  try {
    const updated = await Expense.findOneAndUpdate(
      { firestoreId: req.params.firestoreId },
      { $set: { ...req.body, updatedAt: new Date() } },
      { new: true }                 // return the updated document
    );
    if (!updated) return res.status(404).json({ success: false, error: "Expense not found" });
    console.log("✏️  Updated:", updated.title);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("❌ Update error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────
// DELETE — DELETE /api/expenses/:firestoreId
// ─────────────────────────────────────────────────────
router.delete("/:firestoreId", async (req, res) => {
  try {
    const deleted = await Expense.findOneAndDelete({ firestoreId: req.params.firestoreId });
    if (!deleted) return res.status(404).json({ success: false, error: "Expense not found" });
    console.log("🗑️  Deleted:", deleted.title);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
