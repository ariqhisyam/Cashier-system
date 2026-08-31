"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, formatRupiah } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import Receipt from "@/components/Receipt";
import { Receipt as ReceiptIcon, CalendarBlank } from "@phosphor-icons/react";

type Filter = "harian" | "bulanan";

function pad(n: number) { return String(n).padStart(2, "0"); }
function isSameDay(ts: number, ref: Date) {
  const d = new Date(ts);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}
function isSameMonth(ts: number, ref: Date) {
  const d = new Date(ts);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}
function formatTime(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function KaryawanHistoryPage() {
  const { state } = useStore();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("harian");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (state.session !== "karyawan") router.replace("/");
  }, [state.session, router]);
  if (state.session !== "karyawan") return null;

  const now = new Date();
  const filtered = state.transactions.filter((tx) =>
    filter === "harian" ? isSameDay(tx.timestamp, now) : isSameMonth(tx.timestamp, now)
  );
  const totalPeriod = filtered.reduce((s, tx) => s + tx.total, 0);

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
            Matcha Kyoto
          </p>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.5px" }}>
            Riwayat Penjualan
          </h1>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: "8px" }}>
            {(["harian", "bulanan"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "var(--r-pill)",
                  cursor: "pointer",
                  backgroundColor: filter === f ? "var(--ink-primary)" : "var(--surface)",
                  color: filter === f ? "#ffffff" : "var(--ink-secondary)",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: filter === f ? "none" : "1.5px solid var(--surface-border)",
                  boxShadow: filter === f ? "var(--shadow-sm)" : "none",
                  textTransform: "capitalize",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <CalendarBlank size={16} />
                <span>{f === "harian" ? "Hari Ini" : "Bulan Ini"}</span>
              </button>
            ))}
          </div>

          {/* Summary card */}
          <div
            style={{
              backgroundColor: "var(--primary)",
              borderRadius: "var(--r-lg)",
              padding: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 8px 20px rgba(30,112,72,0.25)",
            }}
          >
            <div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", fontWeight: 600 }}>
                Total Pendapatan ({filter === "harian" ? "Hari Ini" : "Bulan Ini"})
              </p>
              <p style={{ color: "#ffffff", fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>
                {formatRupiah(totalPeriod)}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", fontWeight: 600 }}>Total Struk</p>
              <p style={{ color: "#ffffff", fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>{filtered.length}</p>
            </div>
          </div>

          {/* Transaction list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-muted)" }}>
              <p style={{ fontSize: "36px", marginBottom: "8px" }}>🍵</p>
              <p style={{ fontSize: "14px", fontWeight: 600 }}>Belum ada transaksi</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filtered.map((tx) => (
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
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary-light)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ReceiptIcon size={20} weight="fill" />
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
                        #{tx.id.slice(-6).toUpperCase()}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "2px" }}>
                        {formatTime(tx.timestamp)} &middot; {tx.items.length} menu
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--primary)" }}>
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
