export default function CategoryChart({ data, total }) {
  const sorted = [...data].sort((a, b) => b.total - a.total);

  return (
    <div className="chart-card">
      <h3 className="chart-title">Spending by category</h3>
      <div className="chart-bars">
        {sorted.map((cat) => {
          const pct = total > 0 ? (cat.total / total) * 100 : 0;
          return (
            <div key={cat.id} className="chart-row">
              <div className="chart-label">
                <span>{cat.icon} {cat.label}</span>
                <span className="chart-count">{cat.count} {cat.count === 1 ? "entry" : "entries"}</span>
              </div>
              <div className="chart-bar-track">
                <div
                  className="chart-bar-fill"
                  style={{ width: `${pct}%`, background: cat.color }}
                />
              </div>
              <div className="chart-values">
                <span className="chart-amount">₹{cat.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                <span className="chart-pct">{pct.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
