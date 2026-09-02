"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, formatRupiah } from "@/lib/store";
import type { Transaction, ShiftReport, Product } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import Receipt from "@/components/Receipt";
import { useTransactions, useShiftReports } from "@/hooks/useTransactions";
import { useProducts } from "@/hooks/useProducts";
import { useUsers } from "@/hooks/useUsers";
import {
  MagnifyingGlass,
  Receipt as ReceiptIcon,
  CalendarBlank,
  ChartLineUp,
  TrendDown,
  TrendUp,
  Coffee,
  Coins,
  CreditCard,
  User,
  ClockAfternoon,
  X,
  FileText,
  Money,
  CheckCircle,
  CaretLeft,
  CaretRight,
  ArrowsClockwise,
  Calendar,
} from "@phosphor-icons/react";

type Filter = "harian" | "mingguan" | "bulanan" | "kustom";
type ViewMode = "shifts" | "transactions";

function pad(n: number) { return String(n).padStart(2, "0"); }

const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAYS_FULL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MONTHS_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

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
function formatDateShort(ts: number) {
  const d = new Date(ts);
  return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
function toDateInputValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const FILTER_LABELS: Record<Filter, string> = {
  harian: "Harian",
  mingguan: "Mingguan",
  bulanan: "Bulanan",
  kustom: "Kustom",
};

export default function AdminHistoryPage() {
  const { state } = useStore();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("shifts");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftReport | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("harian");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [customStartDate, setCustomStartDate] = useState<string>(toDateInputValue(new Date()));
  const [customEndDate, setCustomEndDate] = useState<string>(toDateInputValue(new Date()));

  // Live data from backend
  const { data: transactionsData } = useTransactions({ limit: 100 });
  const { data: shiftReportsData } = useShiftReports();
  const { data: productsData } = useProducts({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  const now = new Date();

  // Navigation handlers
  function handlePrev() {
    const d = new Date(selectedDate);
    if (filter === "harian") {
      d.setDate(d.getDate() - 1);
    } else if (filter === "mingguan") {
      d.setDate(d.getDate() - 7);
    } else if (filter === "bulanan") {
      d.setMonth(d.getMonth() - 1);
    }
    setSelectedDate(d);
  }

  function handleNext() {
    const d = new Date(selectedDate);
    if (filter === "harian") {
      d.setDate(d.getDate() + 1);
    } else if (filter === "mingguan") {
      d.setDate(d.getDate() + 7);
    } else if (filter === "bulanan") {
      d.setMonth(d.getMonth() + 1);
    }
    setSelectedDate(d);
  }

  function handleResetToday() {
    setSelectedDate(new Date());
  }

  // Time label generator
  function getTimeLabel() {
    if (filter === "harian") {
      const isToday = isSameDay(selectedDate.getTime(), now);
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = isSameDay(selectedDate.getTime(), yesterday);
      const formatted = `${DAYS_FULL[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTHS_SHORT[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
      if (isToday) return `${formatted} (Hari Ini)`;
      if (isYesterday) return `${formatted} (Kemarin)`;
      return formatted;
    }
    if (filter === "mingguan") {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.getDate()} ${MONTHS_SHORT[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${MONTHS_SHORT[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`;
    }
    if (filter === "bulanan") {
      return `${MONTHS_FULL[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
    if (filter === "kustom") {
      return `${customStartDate} s/d ${customEndDate}`;
    }
    return "";
  }

  function getHeroTimeLabel() {
    if (filter === "harian") {
      const isToday = isSameDay(selectedDate.getTime(), now);
      if (isToday) return "Hari Ini";
      return `${selectedDate.getDate()} ${MONTHS_SHORT[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
    if (filter === "mingguan") {
      return "Minggu Ini";
    }
    if (filter === "bulanan") {
      return `${MONTHS_SHORT[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
    if (filter === "kustom") {
      return "Rentang Kustom";
    }
    return "";
  }

  // Map backend database transactions
  const liveTransactions: Transaction[] = transactionsData?.items
    ? transactionsData.items.map((tx) => ({
        id: tx.id,
        items: (tx.items || []).map((it) => ({
          name: it.productName,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.subtotal,
        })),
        total: tx.total,
        timestamp: new Date(tx.createdAt).getTime(),
        cashierId: tx.cashierId,
        cashierName: tx.cashierName,
        paymentMethod: (tx.paymentMethod ? tx.paymentMethod.toLowerCase() : "cash") as "cash" | "qris",
        cashPaid: tx.cashPaid ?? undefined,
        changeAmount: tx.changeAmount ?? undefined,
        qrisProofUrl: tx.qrisProofUrl ?? undefined,
      }))
    : state.transactions || [];

  // Map backend products for HPP
  const liveProducts: Product[] = productsData?.products
    ? productsData.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        imageUrl: p.imageUrl || "/matcha-latte.jpg",
        rawMaterialCost: p.rawMaterialCost || 0,
      }))
    : state.products || [];

  // Map backend employees for salary
  const liveEmployees = usersData?.users
    ? usersData.users.filter((u) => u.role === "KARYAWAN")
    : state.employees || [];

  // ── Helper: HPP cost for a tx ──────────────────────────────────────────────
  function txHpp(tx: Transaction): number {
    return tx.items.reduce((s, item) => {
      const product = liveProducts.find((p) => p.name === item.name);
      return s + (product ? product.rawMaterialCost * item.quantity : 0);
    }, 0);
  }

  // ── Daily salary per day ───────────────────────────────────────────────────
  const dailySalaryCost = liveEmployees
    .filter((e: any) => e.isActive && e.monthlySalary)
    .reduce((s: number, e: any) => s + Math.round((e.monthlySalary ?? 0) / 30), 0);

  // Map backend database shift reports
  const liveShiftReports: ShiftReport[] = shiftReportsData
    ? shiftReportsData.map((sr) => ({
        id: sr.id,
        shiftName: sr.shiftName,
        closedAt: new Date(sr.closedAt).getTime(),
        closedBy: sr.closedBy,
        employeeId: sr.employeeId,
        totalGrossRevenue: sr.totalGrossRevenue,
        totalCups: sr.totalCups,
        totalTransactions: sr.totalTransactions,
        totalHpp: sr.totalHpp,
        dailySalaryCost: sr.dailySalaryCost,
        totalExpenses: sr.totalExpenses,
        netProfit: sr.netProfit,
        cashRevenue: sr.cashRevenue,
        qrisRevenue: sr.qrisRevenue,
        cashCups: sr.cashCups,
        qrisCups: sr.qrisCups,
        cashCount: sr.cashCount,
        qrisCount: sr.qrisCount,
        notes: sr.notes,
      }))
    : state.shiftReports || [];

  // ── Filter period matcher ──────────────────────────────────────────────────
  const matchPeriod = (ts: number): boolean => {
    if (filter === "harian") {
      return isSameDay(ts, selectedDate);
    }
    if (filter === "mingguan") {
      return isSameWeek(ts, selectedDate);
    }
    if (filter === "bulanan") {
      return isSameMonth(ts, selectedDate);
    }
    if (filter === "kustom") {
      const start = customStartDate ? new Date(`${customStartDate}T00:00:00`).getTime() : 0;
      const end = customEndDate ? new Date(`${customEndDate}T23:59:59`).getTime() : Infinity;
      return ts >= start && ts <= end;
    }
    return true;
  };

  // ── Shift Reports in Period ───────────────────────────────────────────────
  const allShifts = liveShiftReports;
  const periodShifts = allShifts.filter((sr) => matchPeriod(sr.closedAt));
  const shiftGross = periodShifts.reduce((s, sr) => s + sr.totalGrossRevenue, 0);
  const shiftCups = periodShifts.reduce((s, sr) => s + sr.totalCups, 0);
  const shiftNet = periodShifts.reduce((s, sr) => s + sr.netProfit, 0);
  const shiftCash = periodShifts.reduce((s, sr) => s + sr.cashRevenue, 0);
  const shiftQris = periodShifts.reduce((s, sr) => s + sr.qrisRevenue, 0);

  // ── Transactions in Period (for Transaction View) ─────────────────────────
  const periodTxs = liveTransactions.filter((tx) => matchPeriod(tx.timestamp));
  const periodRevenue = periodTxs.reduce((s, tx) => s + tx.total, 0);
  const periodTxCups = periodTxs.reduce((sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0), 0);
  const periodDays = filter === "harian" ? 1 : filter === "mingguan" ? 7 : 30;
  const periodSalaryCost = dailySalaryCost * periodDays;
  const periodExpenses = (state.expenses ?? []).filter((ex) => matchPeriod(ex.timestamp));
  const periodExpenseTotal = periodExpenses.reduce((s, ex) => s + ex.amount, 0);
  const periodHpp = periodTxs.reduce((s, tx) => s + txHpp(tx), 0);
  const periodNetRevenue = periodRevenue - periodHpp - periodSalaryCost - periodExpenseTotal;

  const filteredTxs = periodTxs.filter((tx) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const matchId = tx.id.toLowerCase().includes(q);
    const matchCashier = (tx.cashierName || "").toLowerCase().includes(q);
    const matchItems = tx.items.some((i) => i.name.toLowerCase().includes(q));
    return matchId || matchCashier || matchItems;
  });

  return (
    <div className="page-root">
      <div className="page-content">
        {/* Header */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            padding: "20px 20px 14px",
            borderBottom: "1px solid var(--surface-border)",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                4rq cashier system
              </p>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.5px" }}>
                Riwayat & Laporan
              </h1>
            </div>

            {/* View Mode Toggle: Laporan Shift vs Transaksi */}
            <div
              style={{
                display: "flex",
                backgroundColor: "var(--bg-app)",
                padding: "3px",
                borderRadius: "var(--r-pill)",
                border: "1px solid var(--surface-border)",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("shifts")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--r-pill)",
                  border: "none",
                  backgroundColor: viewMode === "shifts" ? "var(--ink-primary)" : "transparent",
                  color: viewMode === "shifts" ? "#ffffff" : "var(--ink-secondary)",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Laporan Shift
              </button>
              <button
                type="button"
                onClick={() => setViewMode("transactions")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--r-pill)",
                  border: "none",
                  backgroundColor: viewMode === "transactions" ? "var(--ink-primary)" : "transparent",
                  color: viewMode === "transactions" ? "#ffffff" : "var(--ink-secondary)",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Transaksi
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Period Filter Tabs (Harian, Mingguan, Bulanan, Kustom) */}
          <div style={{ display: "flex", gap: "6px" }}>
            {(["harian", "mingguan", "bulanan", "kustom"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => { setFilter(f); setSearch(""); }}
                style={{
                  flex: 1,
                  padding: "8px 2px",
                  borderRadius: "var(--r-pill)",
                  cursor: "pointer",
                  backgroundColor: filter === f ? "var(--ink-primary)" : "var(--surface)",
                  color: filter === f ? "#ffffff" : "var(--ink-secondary)",
                  fontSize: "11.5px",
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
                <span>{FILTER_LABELS[f]}</span>
              </button>
            ))}
          </div>

          {/* Interactive Date Navigator Bar */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-md)",
              padding: "8px 12px",
              border: "1px solid var(--surface-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            {filter !== "kustom" ? (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="btn-icon"
                  style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid var(--surface-border)" }}
                  title="Periode Sebelumnya"
                >
                  <CaretLeft size={15} weight="bold" />
                </button>

                {/* Center Date Picker & Label */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    position: "relative",
                    padding: "4px 8px",
                    borderRadius: "6px",
                  }}
                  title="Klik untuk memilih tanggal"
                >
                  <Calendar size={15} color="var(--primary)" weight="bold" />
                  <span style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--ink-primary)" }}>
                    {getTimeLabel()}
                  </span>
                  <input
                    type={filter === "bulanan" ? "month" : "date"}
                    value={filter === "bulanan" ? `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth()+1)}` : toDateInputValue(selectedDate)}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const parts = e.target.value.split("-");
                      if (filter === "bulanan" && parts.length >= 2) {
                        setSelectedDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
                      } else if (parts.length >= 3) {
                        setSelectedDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {!isSameDay(selectedDate.getTime(), now) && (
                    <button
                      type="button"
                      onClick={handleResetToday}
                      style={{
                        background: "var(--primary-light)",
                        border: "none",
                        color: "var(--primary)",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                      title="Kembali ke Hari Ini"
                    >
                      <ArrowsClockwise size={12} weight="bold" />
                      <span>Hari Ini</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-icon"
                    style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid var(--surface-border)" }}
                    title="Periode Berikutnya"
                  >
                    <CaretRight size={15} weight="bold" />
                  </button>
                </div>
              </>
            ) : (
              /* Custom Date Range Selector */
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-muted)" }}>Dari:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="input"
                    style={{ padding: "4px 8px", fontSize: "12px", flex: 1 }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-muted)" }}>S/d:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="input"
                    style={{ padding: "4px 8px", fontSize: "12px", flex: 1 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: LAPORAN SHIFT VIEW                                                  */}
          {/* ========================================================================= */}
          {viewMode === "shifts" && (
            <>
              {/* Aggregated Period Summary Card */}
              <div
                style={{
                  backgroundColor: "var(--ink-primary)",
                  borderRadius: "var(--r-lg)",
                  padding: "18px 20px",
                  boxShadow: "0 8px 24px rgba(20,31,25,0.25)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Ringkasan Shift · {getHeroTimeLabel()}
                    </p>
                    <p style={{ color: "#ffffff", fontSize: "26px", fontWeight: 800, marginTop: "2px", lineHeight: 1 }}>
                      {formatRupiah(shiftGross)}
                    </p>
                  </div>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChartLineUp size={20} color="#ffffff" weight="fill" />
                  </div>
                </div>

                {/* 3 Core Highlight Tiles: Cup, Net Profit, Shift Count */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 10px" }}>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 600 }}>🥤 Total Cup</p>
                    <p style={{ color: "#ffffff", fontSize: "14px", fontWeight: 800, marginTop: "2px" }}>{shiftCups} Cup</p>
                  </div>
                  <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 10px" }}>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 600 }}>✨ Laba Bersih</p>
                    <p style={{ color: shiftNet >= 0 ? "#4ade80" : "#f87171", fontSize: "14px", fontWeight: 800, marginTop: "2px" }}>
                      {formatRupiah(shiftNet)}
                    </p>
                  </div>
                  <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 10px" }}>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 600 }}>📋 Shift</p>
                    <p style={{ color: "#ffffff", fontSize: "14px", fontWeight: 800, marginTop: "2px" }}>{periodShifts.length} Selesai</p>
                  </div>
                </div>

                {/* Bottom Cash vs QRIS row */}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px", fontSize: "12px" }}>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>💵 Cash: <strong style={{ color: "#ffffff" }}>{formatRupiah(shiftCash)}</strong></span>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>📱 QRIS: <strong style={{ color: "#ffffff" }}>{formatRupiah(shiftQris)}</strong></span>
                </div>
              </div>

              {/* Section Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
                  Daftar Laporan Shift
                </h3>
                <span style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                  {periodShifts.length} laporan · {getTimeLabel()}
                </span>
              </div>

              {/* Shift Reports List */}
              {periodShifts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "44px 16px", color: "var(--ink-muted)", backgroundColor: "var(--surface)", borderRadius: "var(--r-lg)", border: "1px dashed var(--surface-border)" }}>
                  <p style={{ fontSize: "36px", marginBottom: "8px" }}>📋</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>Belum Ada Laporan Shift</p>
                  <p style={{ fontSize: "12px", marginTop: "4px", maxWidth: "280px", marginInline: "auto", lineHeight: 1.4 }}>
                    Laporan shift harian akan otomatis dibuat saat karyawan menekan <strong>"Tutup Shift"</strong> pada akun kasir.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {periodShifts.map((sr) => {
                    const d = new Date(sr.closedAt);
                    return (
                      <button
                        key={sr.id}
                        type="button"
                        onClick={() => setSelectedShift(sr)}
                        className="card"
                        style={{
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          cursor: "pointer",
                          textAlign: "left",
                          border: "1px solid var(--surface-border)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {/* Top Info: Date & Cashier Name */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <ClockAfternoon size={18} weight="fill" />
                            </div>
                            <div>
                              <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink-primary)" }}>
                                {formatDateShort(sr.closedAt)}
                              </p>
                              <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                                Ditutup jam {pad(d.getHours())}:{pad(d.getMinutes())} · oleh <strong style={{ color: "var(--primary)" }}>{sr.closedBy}</strong>
                              </p>
                            </div>
                          </div>

                          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "9999px", fontWeight: 700, backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac" }}>
                            Shift Selesai
                          </span>
                        </div>

                        {/* 3 Core Metrics Highlight Box */}
                        <div
                          style={{
                            backgroundColor: "var(--bg-app)",
                            borderRadius: "var(--r-md)",
                            padding: "10px 12px",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "8px",
                          }}
                        >
                          <div>
                            <p style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600 }}>Omzet Kotor</p>
                            <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink-primary)", marginTop: "2px" }}>
                              {formatRupiah(sr.totalGrossRevenue)}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600 }}>Cup Terjual</p>
                            <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--primary)", marginTop: "2px" }}>
                              {sr.totalCups} Cup
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600 }}>Laba Bersih</p>
                            <p style={{ fontSize: "13px", fontWeight: 800, color: sr.netProfit >= 0 ? "#16a34a" : "#dc2626", marginTop: "2px" }}>
                              {formatRupiah(sr.netProfit)}
                            </p>
                          </div>
                        </div>

                        {/* Financial Sub-breakdown chips */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", fontSize: "11px" }}>
                          <span style={{ backgroundColor: "#f8fafc", padding: "3px 8px", borderRadius: "6px", color: "var(--ink-secondary)", border: "1px solid var(--surface-border)" }}>
                            💵 Cash: {formatRupiah(sr.cashRevenue)} ({sr.cashCups} cup)
                          </span>
                          <span style={{ backgroundColor: "#f8fafc", padding: "3px 8px", borderRadius: "6px", color: "var(--ink-secondary)", border: "1px solid var(--surface-border)" }}>
                            📱 QRIS: {formatRupiah(sr.qrisRevenue)} ({sr.qrisCups} cup)
                          </span>
                          {sr.dailySalaryCost > 0 && (
                            <span style={{ backgroundColor: "#fffbeb", padding: "3px 8px", borderRadius: "6px", color: "#b45309", border: "1px solid #fde68a" }}>
                              💼 Gaji: {formatRupiah(sr.dailySalaryCost)}
                            </span>
                          )}
                          {sr.totalExpenses > 0 && (
                            <span style={{ backgroundColor: "#fef2f2", padding: "3px 8px", borderRadius: "6px", color: "#dc2626", border: "1px solid #fecaca" }}>
                              🧾 Biaya: {formatRupiah(sr.totalExpenses)}
                            </span>
                          )}
                        </div>

                        {/* Notes if any */}
                        {sr.notes && (
                          <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontStyle: "italic", borderTop: "1px dashed var(--surface-border)", paddingTop: "8px" }}>
                            &ldquo;{sr.notes}&rdquo;
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: INDIVIDUAL TRANSACTIONS VIEW                                       */}
          {/* ========================================================================= */}
          {viewMode === "transactions" && (
            <>
              {/* Period Transaction Summary Card */}
              <div
                style={{
                  backgroundColor: "var(--primary)",
                  borderRadius: "var(--r-lg)",
                  padding: "16px 18px",
                  boxShadow: "0 6px 16px rgba(30,112,72,0.2)",
                }}
              >
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Total Pendapatan · {getHeroTimeLabel()}
                </p>
                <p style={{ color: "#ffffff", fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>
                  {formatRupiah(periodRevenue)}
                </p>

                {/* Sub metrics */}
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: "8px", padding: "7px 10px" }}>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px", fontWeight: 600 }}>🥤 Total Cup</p>
                    <p style={{ color: "#ffffff", fontSize: "13px", fontWeight: 800 }}>{periodTxCups} Cup</p>
                  </div>
                  <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: "8px", padding: "7px 10px" }}>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px", fontWeight: 600 }}>✨ Laba Bersih</p>
                    <p style={{ color: periodNetRevenue >= 0 ? "#a7f3d0" : "#fca5a5", fontSize: "13px", fontWeight: 800 }}>
                      {formatRupiah(periodNetRevenue)}
                    </p>
                  </div>
                  <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: "8px", padding: "7px 10px" }}>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px", fontWeight: 600 }}>🧾 Struk</p>
                    <p style={{ color: "#ffffff", fontSize: "13px", fontWeight: 800 }}>{periodTxs.length}</p>
                  </div>
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
                  placeholder="Cari ID struk, kasir, atau menu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input"
                  style={{ paddingLeft: "38px", fontSize: "13px" }}
                />
              </div>

              {/* Transaction list */}
              {filteredTxs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-muted)" }}>
                  <p style={{ fontSize: "32px", marginBottom: "8px" }}>🍵</p>
                  <p style={{ fontSize: "14px", fontWeight: 600 }}>Tidak ada transaksi</p>
                  <p style={{ fontSize: "12px", marginTop: "4px" }}>{getTimeLabel()}</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-muted)", paddingBottom: "2px" }}>
                    {filteredTxs.length} transaksi · {getTimeLabel()}
                  </p>
                  {filteredTxs.map((tx) => {
                    const txCups = tx.items.reduce((s, item) => s + item.quantity, 0);
                    return (
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
                                #{tx.id.slice(0, 8).toUpperCase()}
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
                              {formatDateFull(tx.timestamp)} · 👤 {tx.cashierName || "Kasir"}
                            </p>
                            <p style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "1px" }}>
                              {(tx.items || []).map((i) => `${i.name} (${i.quantity})`).join(", ")}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary)", display: "block" }}>
                            {formatRupiah(tx.total)}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600 }}>
                            {txCups} Cup
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Modal: Transaction Receipt */}
      {selectedTx && <Receipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />}

      {/* Modal: Detailed Shift Report */}
      {selectedShift && (
        <div className="modal-overlay" onClick={() => setSelectedShift(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drag-handle" />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                  <FileText size={20} weight="fill" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)" }}>
                    Detail Laporan Shift
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                    #{selectedShift.id.slice(-6).toUpperCase()} · {formatDateFull(selectedShift.closedAt)}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedShift(null)} className="btn-icon" style={{ width: "30px", height: "30px" }}>
                <X size={16} />
              </button>
            </div>

            {/* Officer info */}
            <div style={{ backgroundColor: "#f8fafc", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: "14px", border: "1px solid var(--surface-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase" }}>Kasir Penutup</p>
                <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>{selectedShift.closedBy}</p>
              </div>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "9999px", backgroundColor: "#f0fdf4", color: "#16a34a", fontWeight: 700 }}>
                Shift Closed
              </span>
            </div>

            {/* Core Breakdown Table */}
            <div style={{ backgroundColor: "var(--surface)", borderRadius: "var(--r-md)", border: "1px solid var(--surface-border)", overflow: "hidden", marginBottom: "14px" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--surface-border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Total Cup Terjual</span>
                <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>{selectedShift.totalCups} Cup</strong>
              </div>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--surface-border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Total Struk / Transaksi</span>
                <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>{selectedShift.totalTransactions} Struk</strong>
              </div>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--surface-border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Total Pendapatan Kotor</span>
                <strong style={{ fontSize: "13px", color: "var(--ink-primary)" }}>{formatRupiah(selectedShift.totalGrossRevenue)}</strong>
              </div>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--surface-border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Biaya Bahan Baku (HPP)</span>
                <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: 700 }}>−{formatRupiah(selectedShift.totalHpp)}</span>
              </div>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--surface-border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Beban Gaji Karyawan</span>
                <span style={{ fontSize: "13px", color: "#d97706", fontWeight: 700 }}>−{formatRupiah(selectedShift.dailySalaryCost)}</span>
              </div>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--surface-border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Pengeluaran Tambahan</span>
                <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: 700 }}>−{formatRupiah(selectedShift.totalExpenses)}</span>
              </div>
              <div style={{ padding: "12px 14px", backgroundColor: "var(--ink-primary)", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>Keuntungan Bersih Akhir</span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: selectedShift.netProfit >= 0 ? "#4ade80" : "#f87171" }}>
                  {formatRupiah(selectedShift.netProfit)}
                </span>
              </div>
            </div>

            {/* Payment Method Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>💵 Penerimaan Cash</p>
                <p style={{ fontSize: "15px", fontWeight: 800, color: "#16a34a", marginTop: "2px" }}>
                  {formatRupiah(selectedShift.cashRevenue)}
                </p>
                <p style={{ fontSize: "10px", color: "#166534", marginTop: "2px" }}>
                  {selectedShift.cashCups} cup · {selectedShift.cashCount} transaksi
                </p>
              </div>

              <div style={{ backgroundColor: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb" }}>📱 Penerimaan QRIS</p>
                <p style={{ fontSize: "15px", fontWeight: 800, color: "#2563eb", marginTop: "2px" }}>
                  {formatRupiah(selectedShift.qrisRevenue)}
                </p>
                <p style={{ fontSize: "10px", color: "#1e40af", marginTop: "2px" }}>
                  {selectedShift.qrisCups} cup · {selectedShift.qrisCount} transaksi
                </p>
              </div>
            </div>

            {/* Notes if present */}
            {selectedShift.notes && (
              <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--r-md)", padding: "10px 12px", marginBottom: "14px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#92400e" }}>Catatan Kasir:</p>
                <p style={{ fontSize: "12px", color: "#78350f", marginTop: "2px" }}>&ldquo;{selectedShift.notes}&rdquo;</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedShift(null)}
              className="btn-primary"
              style={{ width: "100%" }}
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

      <BottomNav role="admin" />
    </div>
  );
}
