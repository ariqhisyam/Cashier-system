"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, formatRupiah, isSameDayWib, isSameWeekWib, isSameMonthWib, calculateDailySalary, calculateWeeklySalary } from "@/lib/store";
import type { Transaction, ShiftReport } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import Receipt from "@/components/Receipt";
import { useShiftReports, useTransactions, useUsers, useExpensesQuery, useDeleteTransaction, useDeleteShiftReport } from "@/hooks";
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
  Trash,
} from "@phosphor-icons/react";

type Filter = "harian" | "mingguan" | "bulanan";
type ViewMode = "shifts" | "transactions";

function pad(n: number) { return String(n).padStart(2, "0"); }

function formatDateFull(ts: number | string | Date) {
  const d = new Date(ts);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d).replace(/\./g, ":") + " WIB";
}

function formatDateShort(ts: number | string | Date) {
  const d = new Date(ts);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatTimeWib(ts: number | string | Date) {
  const d = new Date(ts);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d).replace(/\./g, ":");
}

const FILTER_LABELS: Record<Filter, string> = {
  harian: "Hari Ini",
  mingguan: "Minggu Ini",
  bulanan: "Bulan Ini",
};

export default function AdminHistoryPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const { data: liveShiftReports } = useShiftReports();
  const { data: liveTransactionsData } = useTransactions({ limit: 500 });
  const { data: usersData } = useUsers({ limit: 100 });
  const { data: liveExpensesData } = useExpensesQuery();
  const deleteTransactionMutation = useDeleteTransaction();
  const deleteShiftReportMutation = useDeleteShiftReport();
  const [viewMode, setViewMode] = useState<ViewMode>("shifts");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftReport | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("harian");

  const now = new Date();

  // Prefer live backend transactions from database when available, fallback to local store
  const allTxs: Transaction[] = liveTransactionsData !== undefined
    ? (liveTransactionsData.items || []).map((it) => ({
        id: it.id,
        timestamp: new Date(it.createdAt).getTime(),
        total: it.total,
        cashierId: it.cashierId,
        cashierName: it.cashierName,
        paymentMethod: it.paymentMethod === "CASH" ? "cash" : "qris",
        cashPaid: it.cashPaid,
        changeAmount: it.changeAmount,
        qrisProofUrl: it.qrisProofUrl,
        items: it.items.map((i) => ({
          name: i.productName,
          quantity: i.quantity,
          price: i.price,
          subtotal: i.subtotal,
          rawMaterialCost: i.rawMaterialCost,
        })),
      }))
    : state.transactions;

  // Prefer live backend shift reports from PostgreSQL database, fallback to local store
  const allShifts: ShiftReport[] = liveShiftReports !== undefined
    ? liveShiftReports.map((sr) => ({
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
        notes: sr.notes || undefined,
      }))
    : state.shiftReports || [];

  // ── Helper: HPP cost for a tx ──────────────────────────────────────────────
  function txHpp(tx: Transaction): number {
    return tx.items.reduce((s, item) => {
      if ((item as any).rawMaterialCost) {
        return s + (item as any).rawMaterialCost * item.quantity;
      }
      const product = state.products.find((p) => p.name === item.name);
      return s + (product ? product.rawMaterialCost * item.quantity : 0);
    }, 0);
  }

  // ── Staff from live backend database (fallback to local state) ────────────
  const allStaff = usersData?.users?.length ? usersData.users : state.employees;
  const activeStaffWithSalary = allStaff.filter(
    (e: any) => e.isActive && (e.monthlySalary ?? 0) > 0
  );

  // Proportional salary costs per period:
  // Harian = Monthly / 30 (e.g. 800.000 / 30 = 26.666)
  // Mingguan = Monthly / 4 (e.g. 800.000 / 4 = 200.000)
  // Bulanan = Monthly (e.g. 800.000)
  const dailySalaryCost = activeStaffWithSalary.reduce(
    (s: number, e: any) => s + calculateDailySalary(e.monthlySalary),
    0
  );
  const weeklySalaryCost = activeStaffWithSalary.reduce(
    (s: number, e: any) => s + calculateWeeklySalary(e.monthlySalary),
    0
  );
  const monthlySalaryCost = activeStaffWithSalary.reduce(
    (s: number, e: any) => s + (e.monthlySalary ?? 0),
    0
  );

  // ── Live Expenses from backend + local store ──────────────────────────────
  const allExpenses = liveExpensesData?.length ? liveExpensesData : state.expenses ?? [];
  const todayExpenses = allExpenses.filter((ex) => isSameDayWib(ex.timestamp, now));
  const todayExpenseTotal = todayExpenses.reduce((s, ex) => s + ex.amount, 0);

  // ── Today's Transaction Metrics (always in WIB) ───────────────────────────
  const todayTxs = allTxs.filter((tx) => isSameDayWib(tx.timestamp, now));
  const todayRevenue = todayTxs.reduce((s, tx) => s + tx.total, 0);
  const todayCups = todayTxs.reduce((sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0), 0);
  const todayCash = todayTxs.filter((tx) => tx.paymentMethod === "cash").reduce((s, tx) => s + tx.total, 0);
  const todayQris = todayTxs.filter((tx) => tx.paymentMethod === "qris").reduce((s, tx) => s + tx.total, 0);
  const todayHpp = todayTxs.reduce((s, tx) => s + txHpp(tx), 0);
  const todayNetRevenue = todayRevenue - todayHpp - dailySalaryCost - todayExpenseTotal;

  // ── Filter period matcher (WIB timezone consistency) ───────────────────────
  const matchPeriod = (ts: number | string | Date): boolean => {
    if (filter === "harian") return isSameDayWib(ts, now);
    if (filter === "mingguan") return isSameWeekWib(ts, now);
    return isSameMonthWib(ts, now);
  };

  // ── Shift Reports in Period ───────────────────────────────────────────────
  const periodShifts = allShifts.filter((sr) => matchPeriod(sr.closedAt));
  const shiftGross = periodShifts.reduce((s, sr) => s + sr.totalGrossRevenue, 0);
  const shiftCups = periodShifts.reduce((s, sr) => s + sr.totalCups, 0);
  const shiftCash = periodShifts.reduce((s, sr) => s + sr.cashRevenue, 0);
  const shiftQris = periodShifts.reduce((s, sr) => s + sr.qrisRevenue, 0);
  const shiftHpp = periodShifts.reduce((s, sr) => s + sr.totalHpp, 0);
  const periodExpenses = allExpenses.filter((ex) => matchPeriod(ex.timestamp));
  const periodExpenseTotal = periodExpenses.reduce((s, ex) => s + ex.amount, 0);

  // Distinct employees who worked shifts in this period
  const distinctShiftCashiers = Array.from(
    new Set(periodShifts.map((sr) => sr.closedBy).filter(Boolean))
  );
  const shiftStaffCount = Math.max(1, distinctShiftCashiers.length);

  // Gaji Karyawan pada Ringkasan Shift:
  // Harian = Rp 26.666/hari per karyawan (atau sum dailySalaryCost shift)
  // Mingguan = Rp 200.000/minggu per 1 karyawan (hasil kalkulasi 800.000 / 4)
  // Bulanan = Rp 800.000/bulan per 1 karyawan
  const shiftPeriodSalary =
    filter === "harian"
      ? periodShifts.reduce((s, sr) => s + sr.dailySalaryCost, 0) || (shiftStaffCount * 26667)
      : filter === "mingguan"
      ? shiftStaffCount * 200000
      : shiftStaffCount * 800000;

  // Laba Bersih Ringkasan Shift: Omzet - HPP - Gaji Periode - Pengeluaran Periode Aktual
  const shiftNet =
    shiftGross -
    shiftHpp -
    shiftPeriodSalary -
    periodExpenseTotal;

  // ── Transactions in Period (for Transaction View) ─────────────────────────
  const periodTxs = allTxs.filter((tx) => matchPeriod(tx.timestamp));
  const periodRevenue = periodTxs.reduce((s, tx) => s + tx.total, 0);
  const periodTxCups = periodTxs.reduce((sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0), 0);

  // Distinct cashiers in period transactions
  const distinctTxCashiers = Array.from(
    new Set(periodTxs.map((tx) => tx.cashierName).filter(Boolean))
  );
  const txStaffCount = Math.max(1, distinctTxCashiers.length);

  // Exact period salary cost matching user specification (26.667/day, 200.000/week, 800.000/month per karyawan)
  const periodSalaryCost =
    filter === "harian"
      ? txStaffCount * 26667
      : filter === "mingguan"
      ? txStaffCount * 200000
      : txStaffCount * 800000;

  const periodHpp = periodTxs.reduce((s, tx) => s + txHpp(tx), 0);
  const periodNetRevenue = periodRevenue - periodHpp - periodSalaryCost - periodExpenseTotal;

  const filteredTxs = periodTxs.filter(
    (tx) => search === "" || tx.id.slice(-6).toUpperCase().includes(search.toUpperCase())
  );

  const handleConfirmDeleteShift = async (sr: ShiftReport, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const idShort = sr.id.slice(-6).toUpperCase();
    const confirmed = window.confirm(
      `Hapus Laporan Shift #${idShort}?\n\nKasir: ${sr.closedBy}\nTanggal: ${formatDateShort(sr.closedAt)} ${formatTimeWib(sr.closedAt)} WIB\nOmzet: ${formatRupiah(sr.totalGrossRevenue)}\n\n⚠️ PERINGATAN: Hanya laporan shift ini yang akan dihapus. Data shift lainnya tetap aman.`
    );
    if (!confirmed) return;

    try {
      await deleteShiftReportMutation.mutateAsync(sr.id);
    } catch (err: any) {
      console.warn("Laporan shift tidak ditemukan di server (sudah terhapus), tetap bersihkan dari lokal:", err);
    } finally {
      dispatch({ type: "DELETE_SHIFT_REPORT", payload: sr.id });
      if (selectedShift?.id === sr.id) {
        setSelectedShift(null);
      }
    }
  };

  const handleConfirmDeleteTransaction = async (tx: Transaction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const idShort = tx.id.slice(-6).toUpperCase();
    const confirmed = window.confirm(
      `Hapus Transaksi #${idShort}?\n\nTotal: ${formatRupiah(tx.total)}\nMetode: ${tx.paymentMethod.toUpperCase()}\n\n⚠️ PERINGATAN: Hanya transaksi ini yang akan dihapus. Stok produk pada transaksi ini akan dikembalikan otomatis.`
    );
    if (!confirmed) return;

    try {
      await deleteTransactionMutation.mutateAsync(tx.id);
    } catch (err: any) {
      console.warn("Transaksi tidak ditemukan di server (sudah terhapus), tetap bersihkan dari lokal:", err);
    } finally {
      dispatch({ type: "DELETE_TRANSACTION", payload: tx.id });
      if (selectedTx?.id === tx.id) {
        setSelectedTx(null);
      }
    }
  };

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

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Period Filter Tabs (Harian, Mingguan, Bulanan) */}
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
                      Ringkasan Shift · {FILTER_LABELS[filter]}
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
                    <p style={{ color: "var(--primary)", fontSize: "14px", fontWeight: 800, marginTop: "2px" }}>{periodShifts.length} Selesai</p>
                  </div>
                </div>

                {/* Financial breakdown chips row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px", fontSize: "11px" }}>
                  <span style={{ backgroundColor: "rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: "6px", color: "rgba(255,255,255,0.85)" }}>
                    📦 HPP: <strong style={{ color: "#fca5a5" }}>−{formatRupiah(shiftHpp)}</strong>
                  </span>
                  <span style={{ backgroundColor: "rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: "6px", color: "rgba(255,255,255,0.85)" }}>
                    💼 Gaji: <strong style={{ color: "#fde68a" }}>−{formatRupiah(shiftPeriodSalary)}</strong>
                    <span style={{ fontSize: "10px", opacity: 0.75, marginLeft: "4px" }}>
                      ({shiftStaffCount} Karyawan · {filter === "harian" ? "26.667/hr" : filter === "mingguan" ? "200.000/mg" : "800.000/bln"})
                    </span>
                  </span>
                  {periodExpenseTotal > 0 && (
                    <span style={{ backgroundColor: "rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: "6px", color: "rgba(255,255,255,0.85)" }}>
                      🧾 Beban: <strong style={{ color: "#fca5a5" }}>−{formatRupiah(periodExpenseTotal)}</strong>
                    </span>
                  )}
                </div>

                {/* Breakdown Row */}
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    fontSize: "11px",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>💵 Cash: <strong style={{ color: "#ffffff" }}>{formatRupiah(shiftCash)}</strong></span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>📱 QRIS: <strong style={{ color: "#ffffff" }}>{formatRupiah(shiftQris)}</strong></span>
                </div>
              </div>

              {/* Section Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
                  Daftar Laporan Shift
                </h3>
                <span style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                  {periodShifts.length} laporan · {FILTER_LABELS[filter]}
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
                                Ditutup jam {formatTimeWib(sr.closedAt)} WIB · oleh <strong style={{ color: "var(--primary)" }}>{sr.closedBy}</strong>
                              </p>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "9999px", fontWeight: 700, backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac" }}>
                              Shift Selesai
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleConfirmDeleteShift(sr, e)}
                              title="Hapus laporan shift ini"
                              style={{
                                padding: "5px",
                                borderRadius: "6px",
                                border: "1px solid #fecaca",
                                backgroundColor: "#fef2f2",
                                color: "#dc2626",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <Trash size={14} />
                            </button>
                          </div>
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
                  Total Pendapatan · {FILTER_LABELS[filter]}
                </p>
                <p style={{ color: "#ffffff", fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>
                  {formatRupiah(periodRevenue)}
                </p>

                {/* Sub metrics */}
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", marginBottom: "8px" }}>
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

                {/* Financial breakdown chips row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", fontSize: "11px", paddingTop: "4px" }}>
                  <span style={{ backgroundColor: "rgba(255,255,255,0.12)", padding: "3px 8px", borderRadius: "6px", color: "rgba(255,255,255,0.9)" }}>
                    📦 HPP: <strong style={{ color: "#fca5a5" }}>−{formatRupiah(periodHpp)}</strong>
                  </span>
                  <span style={{ backgroundColor: "rgba(255,255,255,0.12)", padding: "3px 8px", borderRadius: "6px", color: "rgba(255,255,255,0.9)" }}>
                    💼 Gaji: <strong style={{ color: "#fde68a" }}>−{formatRupiah(periodSalaryCost)}</strong>
                    <span style={{ fontSize: "10px", opacity: 0.75, marginLeft: "4px" }}>
                      ({txStaffCount} Karyawan · {filter === "harian" ? "26.667/hr" : filter === "mingguan" ? "200.000/mg" : "800.000/bln"})
                    </span>
                  </span>
                  {periodExpenseTotal > 0 && (
                    <span style={{ backgroundColor: "rgba(255,255,255,0.12)", padding: "3px 8px", borderRadius: "6px", color: "rgba(255,255,255,0.9)" }}>
                      🧾 Beban: <strong style={{ color: "#fca5a5" }}>−{formatRupiah(periodExpenseTotal)}</strong>
                    </span>
                  )}
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
                  placeholder={`Cari struk transaksi di ${FILTER_LABELS[filter]}...`}
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
                  <p style={{ fontSize: "12px", marginTop: "4px" }}>{FILTER_LABELS[filter]}</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-muted)", paddingBottom: "2px" }}>
                    {filteredTxs.length} transaksi · {FILTER_LABELS[filter]}
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
                              {tx.items.map((i) => `${i.name} (${i.quantity})`).join(", ")}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "8px" }}>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary)", display: "block" }}>
                              {formatRupiah(tx.total)}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600 }}>
                              {txCups} Cup
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleConfirmDeleteTransaction(tx, e)}
                            title="Hapus transaksi ini"
                            style={{
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid #fecaca",
                              backgroundColor: "#fef2f2",
                              color: "#dc2626",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Trash size={15} />
                          </button>
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
      {selectedTx && (
        <Receipt
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onDelete={() => handleConfirmDeleteTransaction(selectedTx)}
        />
      )}

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
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--surface-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Pengeluaran Tambahan</span>
                  <p style={{ fontSize: "10px", color: "var(--ink-muted)", marginTop: "1px" }}>Beban operasional toko dicatat di ringkasan</p>
                </div>
                <span style={{ fontSize: "13px", color: selectedShift.totalExpenses > 0 ? "#dc2626" : "var(--ink-muted)", fontWeight: 700 }}>
                  {selectedShift.totalExpenses > 0 ? `−${formatRupiah(selectedShift.totalExpenses)}` : "Rp 0"}
                </span>
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

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => handleConfirmDeleteShift(selectedShift)}
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
                  transition: "all 0.15s ease",
                }}
              >
                <Trash size={16} />
                <span>Hapus Laporan Ini</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedShift(null)}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="admin" />
    </div>
  );
}
//test
