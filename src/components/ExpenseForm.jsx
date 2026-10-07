import { useState, useRef } from "react";
import { useExpenses } from "../context/ExpenseContext";
import { useAuth } from "../context/AuthContext";
import { uploadReceipt } from "../dropbox/uploadReceipt";

export default function ExpenseForm({ onClose, editTarget }) {
  const { addExpense, updateExpense, CATEGORIES } = useExpenses();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title:    editTarget?.title    || "",
    amount:   editTarget?.amount   || "",
    category: editTarget?.category || "food",
    date:     editTarget?.date     || new Date().toISOString().split("T")[0],
    note:     editTarget?.note     || "",
  });

  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState(editTarget?.receiptUrl  || null);
  const [receiptName, setReceiptName] = useState(editTarget?.receiptName || null);
  const [keepExisting, setKeepExisting] = useState(!!editTarget?.receiptUrl);

  const [error, setError]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [uploadProgress, setUploadProgress] = useState(""); // status text

  const fileInputRef = useRef();

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) return setError("Only image files are allowed.");
    if (selected.size > 10 * 1024 * 1024)    return setError("File must be under 10 MB.");
    setError("");
    setFile(selected);
    setKeepExisting(false);
    setReceiptName(selected.name);
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(selected);
  };

  const removeReceipt = () => {
    setFile(null);
    setPreview(null);
    setReceiptName(null);
    setKeepExisting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim())  return setError("Title is required.");
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      return setError("Enter a valid amount.");

    setSaving(true);
    try {
      let receiptUrl  = keepExisting ? editTarget?.receiptUrl  : null;
      let receiptPath = keepExisting ? editTarget?.receiptPath : null;
      let finalReceiptName = keepExisting ? editTarget?.receiptName : null;

      // Upload new file to Dropbox if one was selected
      if (file) {
        setUploadProgress("Uploading receipt to Dropbox…");
        const result = await uploadReceipt(file, user.uid);
        receiptUrl       = result.url;
        receiptPath      = result.path;
        finalReceiptName = result.name;
        setUploadProgress("Saving expense…");
      }

      const data = {
        ...form,
        amount: parseFloat(form.amount),
        receiptUrl:  receiptUrl  || null,
        receiptPath: receiptPath || null,
        receiptName: finalReceiptName || null,
      };

      if (editTarget) {
        await updateExpense(editTarget.id, data);
      } else {
        await addExpense(data);
      }
      onClose();
    } catch (err) {
      console.error("[ExpenseForm] save error:", err);
      // Build a detailed message so we can diagnose without DevTools
      const dropboxSummary = err?.error?.error_summary || "";
      const dropboxStatus  = err?.status ? `HTTP ${err.status}` : "";
      const detail = dropboxSummary || dropboxStatus || err?.message || "unknown error";
      setError(`Save failed: ${detail}`);
    } finally {
      setSaving(false);
      setUploadProgress("");
    }
  };

  return (
    <form onSubmit={submit} className="expense-form">
      <div className="form-row">
        <div className="field">
          <label>Title</label>
          <input name="title" value={form.title} onChange={handle} placeholder="e.g. Lunch at Saravana" />
        </div>
        <div className="field">
          <label>Amount (₹)</label>
          <input type="number" name="amount" value={form.amount} onChange={handle} placeholder="0.00" min="0" step="0.01" />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label>Category</label>
          <select name="category" value={form.category} onChange={handle}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" name="date" value={form.date} onChange={handle} />
        </div>
      </div>

      <div className="field">
        <label>Note (optional)</label>
        <textarea name="note" value={form.note} onChange={handle} placeholder="Any extra details…" rows={2} />
      </div>

      {/* Receipt upload */}
      <div className="field">
        <label>Receipt (optional)</label>

        {preview ? (
          <div className="receipt-preview-card">
            <img src={preview} alt="Receipt preview" className="receipt-preview-img" />
            <div className="receipt-preview-info">
              <p className="receipt-preview-name">📎 {receiptName || "receipt"}</p>
              <p className="receipt-preview-hint">Stored in Dropbox</p>
            </div>
            <button type="button" className="remove-receipt-btn" onClick={removeReceipt} disabled={saving}>
              Remove
            </button>
          </div>
        ) : (
          <div className="upload-area">
            <button
              type="button"
              className="upload-option-btn"
              onClick={() => fileInputRef.current.click()}
              disabled={saving}
            >
              <span>🖼️</span>
              <span>Choose image from device</span>
            </button>

            <p className="upload-hint-text">PNG, JPG, WEBP · max 10 MB · saved to Dropbox</p>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </div>

      {error && <p className="form-error">{error}</p>}
      {uploadProgress && <p className="upload-progress">{uploadProgress}</p>}

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? (uploadProgress || "Saving…") : editTarget ? "Save changes" : "Add expense"}
        </button>
      </div>
    </form>
  );
}
