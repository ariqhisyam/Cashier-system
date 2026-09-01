"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, formatRupiah } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import Receipt from "@/components/Receipt";
import { Receipt as ReceiptIcon } from "@phosphor-icons/react";

function pad(n: number) { return String(n).padStart(2, "0"); }
function isSameDay(ts: number, ref: Date) {
  const d = new Date(ts);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}
function formatTime(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function KaryawanHistoryPage() {
  const { state } = useStore();
  const router = useRouter();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (state.session !== "karyawan") router.replace("/");
  }, [state.session, router]);
  if (state.session !== "karyawan") return null;

  const now = new Date();
  const todayTxs = state.transactions.filter((tx) => isSameDay(tx.timestamp, now));
  const todayRevenue = todayTxs.reduce((s, tx) => s + tx.total, 0);
  const todayCash = todayTxs.filter((tx) => tx.paymentMethod === "cash").reduce((s, tx) => s + tx.total, 0);
  const todayQris = todayTxs.filter((tx) => tx.paymentMethod === "qris").reduce((s, tx) => s + tx.total, 0);

  return (
    <div className="page-root">
      <div className="page-content">
        {/* Header */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--surface-border)",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            4rq Cashier System
          </p>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.5px" }}>
            Penjualan Hari Ini
          </h1>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Today Summary Card */}
          <div
            style={{
              backgroundColor: "var(--ink-primary)",
              borderRadius: "var(--r-lg)",
              padding: "18px 20px",
              boxShadow: "0 8px 24px rgba(20,31,25,0.25)",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
              Total Pendapatan Hari Ini
            </p>
            <p style={{ color: "#ffffff", fontSize: "28px", fontWeight: 800, lineHeight: 1 }}>
              {formatRupiah(todayRevenue)}
            </p>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 600 }}>💵 Cash</p>
                <p style={{ color: "#4ade80", fontSize: "13px", fontWeight: 800, marginTop: "2px" }}>{formatRupiah(todayCash)}</p>
              </div>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 600 }}>📱 QRIS</p>
                <p style={{ color: "#60a5fa", fontSize: "13px", fontWeight: 800, marginTop: "2px" }}>{formatRupiah(todayQris)}</p>
              </div>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 600 }}>🧾 Struk</p>
                <p style={{ color: "var(--primary)", fontSize: "13px", fontWeight: 800, marginTop: "2px" }}>{todayTxs.length}</p>
              </div>
            </div>
          </div>

          {/* Transaction list */}
          {todayTxs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-muted)" }}>
              <p style={{ fontSize: "36px", marginBottom: "8px" }}>🍵</p>
              <p style={{ fontSize: "14px", fontWeight: 600 }}>Belum ada transaksi hari ini</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-muted)" }}>
                {todayTxs.length} transaksi hari ini
              </p>
              {todayTxs.map((tx) => (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => setSelectedTx(tx)}
                  className="card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    border: "1px solid var(--surface-border)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        backgroundColor: "var(--primary-light)", color: "var(--primary)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}
                    >
                      <ReceiptIcon size={20} weight="fill" />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
                          #{tx.id.slice(-6).toUpperCase()}
                        </p>
                        <span style={{
                          fontSize: "10px", padding: "1px 6px", borderRadius: "9999px", fontWeight: 700,
                          backgroundColor: tx.paymentMethod === "cash" ? "#f0fdf4" : "#eff6ff",
                          color: tx.paymentMethod === "cash" ? "#16a34a" : "#2563eb",
                          border: `1px solid ${tx.paymentMethod === "cash" ? "#86efac" : "#93c5fd"}`,
                        }}>
                          {tx.paymentMethod === "cash" ? "💵 Cash" : "📱 QRIS"}
                        </span>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "2px" }}>
                        {formatTime(tx.timestamp)} · {tx.items.length} menu
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--primary)", flexShrink: 0 }}>
                    {formatRupiah(tx.total)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTx && <Receipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />}
      <BottomNav role="karyawan" />
    </div>
  );
}
