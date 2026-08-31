"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, formatRupiah } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import Receipt from "@/components/Receipt";
import { MagnifyingGlass, Receipt as ReceiptIcon } from "@phosphor-icons/react";

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatDateFull(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminHistoryPage() {
  const { state } = useStore();
  const router = useRouter();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (state.session !== "admin") router.replace("/");
  }, [state.session, router]);
  if (state.session !== "admin") return null;

  const filtered = state.transactions.filter(
    (tx) => tx.id.slice(-6).toUpperCase().includes(search.toUpperCase()) || search === ""
  );
  const totalRevenue = filtered.reduce((s, tx) => s + tx.total, 0);

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
            Semua Transaksi
          </h1>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Search bar */}
          <div style={{ position: "relative" }}>
            <MagnifyingGlass
              size={18}
              color="var(--ink-muted)"
              style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Cari ID transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: "40px", fontSize: "13px" }}
            />
          </div>

          {/* Summary card */}
          <div
            style={{
              backgroundColor: "var(--ink-primary)",
              borderRadius: "var(--r-lg)",
              padding: "18px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 8px 20px rgba(20,31,25,0.2)",
            }}
          >
            <div>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px", fontWeight: 600 }}>Total Pendapatan</p>
              <p style={{ color: "#ffffff", fontSize: "20px", fontWeight: 800, marginTop: "4px" }}>
                {formatRupiah(totalRevenue)}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px", fontWeight: 600 }}>Total Struk</p>
              <p style={{ color: "var(--primary)", fontSize: "22px", fontWeight: 800 }}>{filtered.length}</p>
            </div>
          </div>

          {/* Transaction list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-muted)" }}>
              <p style={{ fontSize: "36px", marginBottom: "8px" }}>🍵</p>
              <p style={{ fontSize: "14px", fontWeight: 600 }}>Tidak ada transaksi</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                      <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
                        {formatDateFull(tx.timestamp)}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "1px" }}>
                        {tx.items.map((i) => i.name).join(", ")}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary)", flexShrink: 0, marginLeft: "8px" }}>
                    {formatRupiah(tx.total)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTx && <Receipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />}
      <BottomNav role="admin" />
    </div>
  );
}
