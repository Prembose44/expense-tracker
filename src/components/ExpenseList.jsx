import { useState } from "react";
import { useExpenses } from "../context/ExpenseContext";

export default function ExpenseList({ onEdit }) {
  const { expenses, deleteExpense, CATEGORIES, loadingExpenses } = useExpenses();
  const [search, setSearch]               = useState("");
  const [filterCat, setFilterCat]         = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]           = useState(false);

  const getCat = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

  const filtered = expenses.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.note || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || e.category === filterCat;
    return matchSearch && matchCat;
  });

  const confirmDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteExpense(id);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  if (loadingExpenses) {
    return (
      <div className="empty-state">
        <p className="empty-icon">⏳</p>
        <p className="empty-title">Loading your expenses…</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-icon">🧾</p>
        <p className="empty-title">No expenses yet</p>
        <p className="empty-sub">Add your first expense to start tracking</p>
      </div>
    );
  }

  return (
    <div className="expense-list-section">
      <div className="list-controls">
        <input
          className="search-input"
          placeholder="Search expenses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="cat-filter" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="no-results">No expenses match your search.</p>
      ) : (
        <div className="expense-items">
          {filtered.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              cat={getCat(e.category)}
              onEdit={onEdit}
              onDelete={() => setDeleteConfirm(e.id)}
            />
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="confirm-box">
            <p className="confirm-title">Delete this expense?</p>
            <p className="confirm-sub">This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
              <button className="btn-danger" onClick={() => confirmDelete(deleteConfirm)} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Individual expense row + receipt viewer modal
───────────────────────────────────────────── */
function ExpenseRow({ expense: e, cat, onEdit, onDelete }) {
  const [viewReceipt, setViewReceipt] = useState(false);

  const handleDownload = async () => {
    try {
      const res  = await fetch(e.receiptUrl);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = e.receiptName || "receipt";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab if cross-origin fetch blocks download
      window.open(e.receiptUrl, "_blank");
    }
  };

  return (
    <>
      {/* ── Expense row ── */}
      <div className="expense-item">
        <div className="expense-cat-icon" style={{ background: cat.color + "22", color: cat.color }}>
          {cat.icon}
        </div>

        <div className="expense-details">
          <p className="expense-title">{e.title}</p>
          <p className="expense-meta">
            <span className="cat-pill" style={{ background: cat.color + "22", color: cat.color }}>{cat.label}</span>
            <span className="expense-date">
              {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {e.note && <span className="expense-note" title={e.note}>📝 {e.note}</span>}
            {e.receiptUrl && (
              <button className="receipt-thumb-btn" onClick={() => setViewReceipt(true)}>
                🧾 View receipt
              </button>
            )}
          </p>
        </div>

        <div className="expense-right">
          <p className="expense-amount">
            ₹{Number(e.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="expense-actions">
            <button className="action-btn edit" onClick={() => onEdit(e)} title="Edit">✏️</button>
            <button className="action-btn delete" onClick={onDelete} title="Delete">🗑️</button>
          </div>
        </div>
      </div>

      {/* ── Receipt viewer modal ── */}
      {viewReceipt && (
        <div
          className="modal-overlay"
          onClick={(ev) => ev.target === ev.currentTarget && setViewReceipt(false)}
        >
          <div className="receipt-viewer-modal">

            {/* Header */}
            <div className="receipt-viewer-header">
              <div className="receipt-viewer-title">
                <span>🧾</span>
                <span>{e.receiptName || "Receipt"}</span>
              </div>
              <button className="close-btn" onClick={() => setViewReceipt(false)}>✕</button>
            </div>

            {/* Full-size image */}
            <div className="receipt-viewer-img-wrap">
              <img
                src={e.receiptUrl}
                alt={e.receiptName || "Receipt"}
                className="receipt-viewer-img"
              />
            </div>

            {/* Expense info bar */}
            <div className="receipt-viewer-info">
              <div className="receipt-viewer-expense">
                <span className="receipt-viewer-expense-title">{e.title}</span>
                <span className="receipt-viewer-expense-amount">
                  ₹{Number(e.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="receipt-viewer-expense-date">
                {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>

            {/* Download / Open actions */}
            <div className="receipt-viewer-actions">
              <a
                href={e.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost receipt-action-btn"
              >
                🔗 Open in browser
              </a>
              <button className="btn-primary receipt-action-btn" onClick={handleDownload}>
                ⬇️ Download
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
