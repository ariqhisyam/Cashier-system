import { formatRupiah } from "@/lib/store";
import type { Transaction } from "@/lib/types";

interface Props {
  transaction: Transaction;
  onClose: () => void;
  onDelete?: () => void;
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatDate(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Receipt({ transaction, onClose, onDelete }: Props) {
  const isCash = transaction.paymentMethod === "cash";

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
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-primary)" }}>Pembayaran Berhasil</h2>
          <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}>
            Matcha Kyoto · {formatDate(transaction.timestamp)}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "4px" }}>
            <p style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700 }}>
              Kasir: {transaction.cashierName || "Kasir Utama"}
            </p>
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: "9999px", fontWeight: 700,
              backgroundColor: isCash ? "#f0fdf4" : "#eff6ff",
              color: isCash ? "#16a34a" : "#2563eb",
              border: `1px solid ${isCash ? "#86efac" : "#93c5fd"}`,
            }}>
              {isCash ? "💵 Cash" : "📱 QRIS"}
            </span>
          </div>
          <p style={{ fontSize: 11, color: "var(--ink-muted)", fontFamily: "var(--font-geist-mono)", marginTop: 4 }}>
            #{transaction.id.slice(-6).toUpperCase()}
          </p>
        </div>

        {/* Items */}
        <div style={{ background: "var(--bg-app)", borderRadius: "var(--r-md)", padding: "12px 14px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {transaction.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-primary)" }}>{item.name}</p>
                <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 1 }}>
                  {item.quantity}× {formatRupiah(item.price)}
                </p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-primary)" }}>{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Total + Cash Info */}
        <div style={{ borderRadius: "var(--r-md)", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", backgroundColor: "var(--primary)" }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 600 }}>Total Pembayaran</span>
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{formatRupiah(transaction.total)}</span>
          </div>
          {isCash && transaction.cashPaid !== undefined && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "#f0fdf4" }}>
                <span style={{ color: "#166534", fontSize: 13, fontWeight: 600 }}>Uang Diterima</span>
                <span style={{ color: "#16a34a", fontSize: 14, fontWeight: 700 }}>{formatRupiah(transaction.cashPaid)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "#dcfce7" }}>
                <span style={{ color: "#166534", fontSize: 13, fontWeight: 700 }}>Kembalian</span>
                <span style={{ color: "#16a34a", fontSize: 16, fontWeight: 800 }}>{formatRupiah(transaction.changeAmount ?? 0)}</span>
              </div>
            </>
          )}
        </div>

        {/* QRIS Proof */}
        {!isCash && transaction.qrisProofUrl && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-secondary)", marginBottom: 6 }}>Bukti Pembayaran QRIS</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={transaction.qrisProofUrl}
              alt="Bukti QRIS"
              style={{ width: "100%", maxHeight: "140px", objectFit: "contain", borderRadius: "var(--r-md)", border: "1px solid var(--surface-border)", backgroundColor: "#f8fafc" }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "var(--r-pill)",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                border: "1.5px solid #fecaca",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              🗑️ Hapus Transaksi
            </button>
          )}
          <button className="btn-primary" style={{ flex: onDelete ? 1 : undefined, width: onDelete ? undefined : "100%" }} onClick={onClose}>
            Tutup Struk
          </button>
        </div>
      </div>
    </div>
  );
}
