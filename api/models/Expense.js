import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  firestoreId: { type: String, unique: true },  // links back to Firestore doc ID
  userId:      { type: String, required: true },
  title:       { type: String, required: true },
  amount:      { type: Number, required: true },
  category:    { type: String, default: "other" },
  date:        { type: String },
  note:        { type: String, default: "" },
  receiptUrl:  { type: String, default: null },
  receiptPath: { type: String, default: null },
  receiptName: { type: String, default: null },
  createdAt:   { type: Date,   default: Date.now },
  updatedAt:   { type: Date,   default: null },
});

export default mongoose.model("Expense", expenseSchema);
