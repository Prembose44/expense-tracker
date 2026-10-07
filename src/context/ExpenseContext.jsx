import { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db }      from "../firebase/config";
import { useAuth } from "./AuthContext";

const ExpenseContext = createContext(null);

// ── MongoDB API base URL (local backend server) ──
const MONGO_API = "http://localhost:3001/api/expenses";

// ── Helper: silently sync to MongoDB (never crashes the app if API is down) ──
async function mongoSync(method, path = "", body = null) {
  try {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${MONGO_API}${path}`, opts);
    const json = await res.json();
    if (!json.success) console.warn("[MongoDB] sync warning:", json.error);
    else console.log(`[MongoDB] ${method} ${path || "/"} ✅`);
  } catch (err) {
    // API is offline — Firestore still works fine
    console.warn("[MongoDB] API unreachable, skipping sync:", err.message);
  }
}

export const CATEGORIES = [
  { id: "food",          label: "Food & Dining",      icon: "🍔", color: "#f59e0b" },
  { id: "transport",     label: "Transport",           icon: "🚗", color: "#3b82f6" },
  { id: "shopping",      label: "Shopping",            icon: "🛍️", color: "#ec4899" },
  { id: "health",        label: "Health",              icon: "🏥", color: "#10b981" },
  { id: "bills",         label: "Bills & Utilities",   icon: "⚡", color: "#8b5cf6" },
  { id: "entertainment", label: "Entertainment",       icon: "🎬", color: "#f97316" },
  { id: "education",     label: "Education",           icon: "📚", color: "#06b6d4" },
  { id: "other",         label: "Other",               icon: "📦", color: "#6b7280" },
];

export function ExpenseProvider({ children }) {
  const { user } = useAuth();
  const [expenses, setExpenses]             = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setLoadingExpenses(false);
      return;
    }

    // Real-time listener: auto-updates UI whenever Firestore changes
    const colRef = collection(db, "users", user.uid, "expenses");
    const q      = query(colRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setExpenses(data);
      setLoadingExpenses(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ── CREATE ──────────────────────────────────────────────────────────────
  const addExpense = async (data) => {
    // 1. Write to Firestore (source of truth)
    const colRef = collection(db, "users", user.uid, "expenses");
    const docRef = await addDoc(colRef, {
      ...data,
      amount:    parseFloat(data.amount),
      createdAt: serverTimestamp(),
    });

    // 2. Mirror to MongoDB
    await mongoSync("POST", "", {
      firestoreId: docRef.id,
      userId:      user.uid,
      ...data,
      amount:      parseFloat(data.amount),
      createdAt:   new Date().toISOString(),
    });
  };

  // ── UPDATE ──────────────────────────────────────────────────────────────
  const updateExpense = async (id, data) => {
    // 1. Update in Firestore
    const docRef = doc(db, "users", user.uid, "expenses", id);
    await updateDoc(docRef, {
      ...data,
      amount:    parseFloat(data.amount),
      updatedAt: serverTimestamp(),
    });

    // 2. Mirror update to MongoDB
    await mongoSync("PUT", `/${id}`, {
      ...data,
      amount:    parseFloat(data.amount),
      updatedAt: new Date().toISOString(),
    });
  };

  // ── DELETE ──────────────────────────────────────────────────────────────
  const deleteExpense = async (id) => {
    // 1. Delete from Firestore
    const docRef = doc(db, "users", user.uid, "expenses", id);
    await deleteDoc(docRef);

    // 2. Mirror delete to MongoDB
    await mongoSync("DELETE", `/${id}`);
  };

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategory = CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses
      .filter((e) => e.category === cat.id)
      .reduce((sum, e) => sum + Number(e.amount), 0),
    count: expenses.filter((e) => e.category === cat.id).length,
  })).filter((c) => c.total > 0);

  return (
    <ExpenseContext.Provider
      value={{ expenses, addExpense, updateExpense, deleteExpense, totalSpent, byCategory, CATEGORIES, loadingExpenses }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  return useContext(ExpenseContext);
}
