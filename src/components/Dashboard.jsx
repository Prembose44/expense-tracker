import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useExpenses } from "../context/ExpenseContext";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import CategoryChart from "./CategoryChart";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { expenses, totalSpent, byCategory } = useExpenses();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const thisMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const monthlyExpenses = expenses.filter((e) => {
    const d = new Date(e.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlyTotal = monthlyExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const openEdit = (expense) => { setEditTarget(expense); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditTarget(null); };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <span className="logo-icon">💰</span>
          <span className="logo-text">ExpenseVault</span>
        </div>
        <div className="topbar-right">
          <span className="user-name">Hi, {(user.displayName || user.email).split(" ")[0]}</span>
          <button className="btn-ghost" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="main-content">
        <div className="page-header">
          <div>
            <h2 className="page-title">Your expenses</h2>
            <p className="page-sub">{thisMonth}</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add expense</button>
        </div>

        <div className="summary-grid">
          <div className="summary-card accent">
            <p className="summary-label">This month</p>
            <p className="summary-amount">₹{monthlyTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            <p className="summary-meta">{monthlyExpenses.length} transactions</p>
          </div>
          <div className="summary-card">
            <p className="summary-label">All time</p>
            <p className="summary-amount">₹{totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            <p className="summary-meta">{expenses.length} total entries</p>
          </div>
          <div className="summary-card">
            <p className="summary-label">Categories used</p>
            <p className="summary-amount">{byCategory.length}</p>
            <p className="summary-meta">of 8 available</p>
          </div>
        </div>

        {byCategory.length > 0 && <CategoryChart data={byCategory} total={totalSpent} />}

        <ExpenseList onEdit={openEdit} />
      </main>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeForm()}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{editTarget ? "Edit expense" : "Add expense"}</h3>
              <button className="close-btn" onClick={closeForm}>✕</button>
            </div>
            <ExpenseForm onClose={closeForm} editTarget={editTarget} />
          </div>
        </div>
      )}
    </div>
  );
}
