"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, formatRupiah } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import Receipt from "@/components/Receipt";
import { MagnifyingGlass, Receipt as ReceiptIcon, CalendarBlank, ChartLineUp, TrendDown } from "@phosphor-icons/react";

type Filter = "harian" | "mingguan" | "bulanan";

function pad(n: number) { return String(n).padStart(2, "0"); }

function isSameDay(ts: number, ref: Date) {
  const d = new Date(ts);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}
function isSameWeek(ts: number, ref: Date) {
  const d = new Date(ts);
  const startOfWeek = new Date(ref);
  startOfWeek.setDate(ref.getDate() - ref.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}
function isSameMonth(ts: number, ref: Date) {
  const d = new Date(ts);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}
function formatDateFull(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const FILTER_LABELS: Record<Filter, string> = {
  harian: "Hari Ini",
  mingguan: "Minggu Ini",
  bulanan: "Bulan Ini",
};

export default function AdminHistoryPage() {
  const { state } = useStore();
  const router = useRouter();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("harian");

  useEffect(() => {
    if (state.session !== "admin") router.replace("/");
  }, [state.session, router]);
  if (state.session !== "admin") return null;

  const now = new Date();

  // ── Helper: HPP cost for a tx ──────────────────────────────────────────────
  function txHpp(tx: Transaction): number {
    return tx.items.reduce((s, item) => {
      const product = state.products.find((p) => p.name === item.name);
      return s + (product ? product.rawMaterialCost * item.quantity : 0);
    }, 0);
  }

  // ── Daily salary per day ───────────────────────────────────────────────────
  const dailySalaryCost = state.employees
    .filter((e) => e.isActive && e.monthlySalary)
    .reduce((s, e) => s + Math.round((e.monthlySalary ?? 0) / 30), 0);

  // ── Today ──────────────────────────────────────────────────────────────────
  const todayTxs = state.transactions.filter((tx) => isSameDay(tx.timestamp, now));
  const todayRevenue = todayTxs.reduce((s, tx) => s + tx.total, 0);
  const todayCash = todayTxs.filter((tx) => tx.paymentMethod === "cash").reduce((s, tx) => s + tx.total, 0);
  const todayQris = todayTxs.filter((tx) => tx.paymentMethod === "qris").reduce((s, tx) => s + tx.total, 0);
  const todayExpenses = (state.expenses ?? []).filter((ex) => isSameDay(ex.timestamp, now));
  const todayExpenseTotal = todayExpenses.reduce((s, ex) => s + ex.amount, 0);
  const todayHpp = todayTxs.reduce((s, tx) => s + txHpp(tx), 0);
  const todayNetRevenue = todayRevenue - todayHpp - dailySalaryCost - todayExpenseTotal;

  // ── Period (driven by filter tab) ─────────────────────────────────────────
  const matchPeriod = (ts: number): boolean => {
    if (filter === "harian") return isSameDay(ts, now);
    if (filter === "mingguan") return isSameWeek(ts, now);
    return isSameMonth(ts, now);
  };

  const periodTxs = state.transactions.filter((tx) => matchPeriod(tx.timestamp));
  const periodRevenue = periodTxs.reduce((s, tx) => s + tx.total, 0);
  const periodCash = periodTxs.filter((tx) => tx.paymentMethod === "cash").reduce((s, tx) => s + tx.total, 0);
  const periodQris = periodTxs.filter((tx) => tx.paymentMethod === "qris").reduce((s, tx) => s + tx.total, 0);
  const periodHpp = periodTxs.reduce((s, tx) => s + txHpp(tx), 0);

  // Salary & expense deduction scaled to period
  const periodDays = filter === "harian" ? 1 : filter === "mingguan" ? 7 : 30;
  const periodSalaryCost = dailySalaryCost * periodDays;
  const periodExpenses = (state.expenses ?? []).filter((ex) => matchPeriod(ex.timestamp));
  const periodExpenseTotal = periodExpenses.reduce((s, ex) => s + ex.amount, 0);
  const periodNetRevenue = periodRevenue - periodHpp - periodSalaryCost - periodExpenseTotal;

  // ── Search ─────────────────────────────────────────────────────────────────
  const filtered = periodTxs.filter(
    (tx) => search === "" || tx.id.slice(-6).toUpperCase().includes(search.toUpperCase())
  );

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
            4rq cashier system
          </p>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.5px" }}>
            Riwayat Transaksi
          </h1>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Today's Revenue Card — always visible */}
          <div
            style={{
              backgroundColor: "var(--ink-primary)",
              borderRadius: "var(--r-lg)",
              padding: "18px 20px",
              boxShadow: "0 8px 24px rgba(20,31,25,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Pendapatan Hari Ini
                </p>
                <p style={{ color: "#ffffff", fontSize: "26px", fontWeight: 800, marginTop: "2px", lineHeight: 1 }}>
                  {formatRupiah(todayRevenue)}
                </p>
              </div>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChartLineUp size={20} color="#ffffff" weight="fill" />
              </div>
            </div>

            {/* Gross mini tiles */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "7px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 600 }}>💵 Cash</p>
                <p style={{ color: "#4ade80", fontSize: "12px", fontWeight: 800, marginTop: "2px" }}>{formatRupiah(todayCash)}</p>
              </div>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "7px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 600 }}>📱 QRIS</p>
                <p style={{ color: "#60a5fa", fontSize: "12px", fontWeight: 800, marginTop: "2px" }}>{formatRupiah(todayQris)}</p>
              </div>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "7px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 600 }}>🧾 Struk</p>
                <p style={{ color: "var(--primary)", fontSize: "12px", fontWeight: 800, marginTop: "2px" }}>{todayTxs.length}</p>
              </div>
            </div>

            {/* Net revenue row */}
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: "8px",
                padding: "9px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <TrendDown size={14} color="rgba(255,255,255,0.5)" />
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", fontWeight: 600 }}>
                  Bersih (−HPP−Gaji−Pengeluaran)
                </p>
              </div>
              <p style={{ color: todayNetRevenue >= 0 ? "#4ade80" : "#f87171", fontSize: "14px", fontWeight: 800 }}>
                {formatRupiah(todayNetRevenue)}
              </p>
            </div>
          </div>

          {/* Period Filter Tabs */}
          <div style={{ display: "flex", gap: "6px" }}>
            {(["harian", "mingguan", "bulanan"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => { setFilter(f); setSearch(""); }}
                style={{
                  flex: 1,
                  padding: "9px 4px",
                  borderRadius: "var(--r-pill)",
                  cursor: "pointer",
                  backgroundColor: filter === f ? "var(--ink-primary)" : "var(--surface)",
                  color: filter === f ? "#ffffff" : "var(--ink-secondary)",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: filter === f ? "none" : "1.5px solid var(--surface-border)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <CalendarBlank size={13} />
                <span>{FILTER_LABELS[f].split(" ")[0]}</span>
              </button>
            ))}
          </div>

          {/* Period Summary Card — shows for all filters */}
          <div
            style={{
              backgroundColor: "var(--primary)",
              borderRadius: "var(--r-lg)",
              padding: "16px 18px",
              boxShadow: "0 6px 16px rgba(30,112,72,0.2)",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Pendapatan · {FILTER_LABELS[filter]}
            </p>
            <p style={{ color: "#ffffff", fontSize: "22px", fontWeight: 800, marginTop: "4px" }}>
              {formatRupiah(periodRevenue)}
            </p>

            {/* Gross tiles */}
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: "8px", padding: "7px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px", fontWeight: 600 }}>💵 Cash</p>
                <p style={{ color: "#ffffff", fontSize: "12px", fontWeight: 800 }}>{formatRupiah(periodCash)}</p>
              </div>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: "8px", padding: "7px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px", fontWeight: 600 }}>📱 QRIS</p>
                <p style={{ color: "#ffffff", fontSize: "12px", fontWeight: 800 }}>{formatRupiah(periodQris)}</p>
              </div>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: "8px", padding: "7px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px", fontWeight: 600 }}>🧾 Struk</p>
                <p style={{ color: "#ffffff", fontSize: "12px", fontWeight: 800 }}>{periodTxs.length}</p>
              </div>
            </div>

            {/* Net revenue for period */}
            <div
              style={{
                backgroundColor: "rgba(0,0,0,0.15)",
                borderRadius: "8px",
                padding: "10px 12px",
                marginTop: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: 600 }}>
                  Keuntungan Bersih {FILTER_LABELS[filter]}
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", marginTop: "2px" }}>
                  −HPP − Gaji ({periodDays}hr) − Pengeluaran
                </p>
              </div>
              <p style={{ color: periodNetRevenue >= 0 ? "#a7f3d0" : "#fca5a5", fontSize: "18px", fontWeight: 800 }}>
                {formatRupiah(periodNetRevenue)}
              </p>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <MagnifyingGlass
              size={16}
              color="var(--ink-muted)"
              style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder={`Cari di ${FILTER_LABELS[filter]}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: "38px", fontSize: "13px" }}
            />
          </div>

          {/* Transaction list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-muted)" }}>
              <p style={{ fontSize: "32px", marginBottom: "8px" }}>🍵</p>
              <p style={{ fontSize: "14px", fontWeight: 600 }}>Tidak ada transaksi</p>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>{FILTER_LABELS[filter]}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-muted)", paddingBottom: "2px" }}>
                {filtered.length} transaksi · {FILTER_LABELS[filter]}
              </p>
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
