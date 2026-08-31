import { formatRupiah } from "@/lib/store";
import type { Transaction } from "@/lib/types";

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatDate(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Receipt({ transaction, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="drag-handle" />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--primary-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px", fontSize: 24,
          }}>✅</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>Pembayaran Berhasil</h2>
          <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}>
            Matcha Kyoto &middot; {formatDate(transaction.timestamp)}
          </p>
          <p style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, marginTop: 2 }}>
            Kasir: {transaction.cashierName || "Kasir Utama"}
          </p>
          <p style={{ fontSize: 11, color: "var(--ink-muted)", fontFamily: "var(--font-geist-mono)", marginTop: 2 }}>
            #{transaction.id.slice(-6).toUpperCase()}
          </p>
        </div>

        {/* Items */}
        <div style={{ background: "var(--bg)", borderRadius: "var(--r-md)", padding: "12px 14px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {transaction.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{item.name}</p>
                <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 1 }}>
                  {item.quantity}x &times; {formatRupiah(item.price)}
                </p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 16px",
          background: "var(--primary)", borderRadius: "var(--r-md)",
          marginBottom: 20,
        }}>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 600 }}>Total Pembayaran</span>
          <span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>{formatRupiah(transaction.total)}</span>
        </div>

        <button className="btn-primary" onClick={onClose}>Tutup Struk</button>
      </div>
    </div>
  );
}
