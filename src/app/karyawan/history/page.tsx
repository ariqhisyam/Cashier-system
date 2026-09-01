"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Transaction, ShiftReport, AttendanceRecord } from "@/lib/types";
import { getCurrentPositionAsync, calculateDistanceMeters } from "@/lib/geo";
import BottomNav from "@/components/BottomNav";
import Receipt from "@/components/Receipt";
import { Receipt as ReceiptIcon, Coffee, ClockAfternoon, X, MapPin, Clock, CheckCircle, SpinnerGap } from "@phosphor-icons/react";

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
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [shiftNotes, setShiftNotes] = useState("");

  // Attendance state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isAbsenLoading, setIsAbsenLoading] = useState(false);
  const [absenError, setAbsenError] = useState("");
  const [absenSuccessToast, setAbsenSuccessToast] = useState<string | null>(null);

  const now = new Date();
  const isSameDay = (ts: number, ref: Date) => {
    const d = new Date(ts);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
  };

  // Find the last closed shift for THIS specific active employee today
  const lastClosedShift = (state.shiftReports || []).find((sr) => {
    const isThisEmployee = sr.employeeId
      ? sr.employeeId === state.activeEmployee?.id
      : sr.closedBy === (state.activeEmployee?.name || "Kasir");
    return isThisEmployee && isSameDay(sr.closedAt, now);
  });

  const shiftStartTime = lastClosedShift ? lastClosedShift.closedAt : 0;

  // Active shift transactions: made by THIS employee today and AFTER their last closed shift
  const shiftTxs = state.transactions.filter((tx) => {
    const matchCashier = tx.cashierId
      ? tx.cashierId === state.activeEmployee?.id
      : tx.cashierName === (state.activeEmployee?.name || "Kasir Utama");
    return matchCashier && isSameDay(tx.timestamp, now) && tx.timestamp > shiftStartTime;
  });

  // Cup calculations for this active employee's shift
  const todayCups = shiftTxs.reduce((sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0), 0);
  const todayCashCups = shiftTxs
    .filter((tx) => tx.paymentMethod === "cash")
    .reduce((sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0), 0);
  const todayQrisCups = shiftTxs
    .filter((tx) => tx.paymentMethod === "qris")
    .reduce((sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0), 0);

  // Active attendance record for this employee today
  const activeAttendance = (state.attendanceRecords || []).find((rec) => {
    const isThisEmp = rec.employeeId === (state.activeEmployee?.id || "default");
    return isThisEmp && isSameDay(rec.clockIn, now) && !rec.clockOut;
  });

  async function handleDoClockIn() {
    setAbsenError("");
    setIsAbsenLoading(true);

    const locationConfig = state.outletLocation;
    const employeeId = state.activeEmployee?.id || "default";
    const employeeName = state.activeEmployee?.name || "Kasir";

    if (locationConfig?.isEnabled) {
      try {
        const coords = await getCurrentPositionAsync();
        const distance = calculateDistanceMeters(
          coords.latitude,
          coords.longitude,
          locationConfig.latitude,
          locationConfig.longitude
        );

        if (distance > locationConfig.radiusMeters) {
          setIsAbsenLoading(false);
          setAbsenError(
            `📍 Anda berada di luar area outlet (Jarak: ${distance}m dari toko). Batas radius presensi: ${locationConfig.radiusMeters}m.`
          );
          return;
        }

        const attendance: AttendanceRecord = {
          id: crypto.randomUUID(),
          employeeId,
          employeeName,
          clockIn: Date.now(),
          latitude: coords.latitude,
          longitude: coords.longitude,
          distanceMeters: distance,
          dateString: new Date().toISOString().split("T")[0],
        };
        dispatch({ type: "RECORD_CLOCK_IN", payload: attendance });
        setAbsenSuccessToast(`✅ Presensi Masuk Berhasil (${formatTime(attendance.clockIn)} WIB · ${distance}m dari toko)`);
        setTimeout(() => setAbsenSuccessToast(null), 3000);
        setShowAttendanceModal(false);
      } catch (err: unknown) {
        setIsAbsenLoading(false);
        const msg = err instanceof Error ? err.message : "Gagal mengambil lokasi GPS.";
        setAbsenError(msg);
        return;
      }
    } else {
      const attendance: AttendanceRecord = {
        id: crypto.randomUUID(),
        employeeId,
        employeeName,
        clockIn: Date.now(),
        latitude: locationConfig?.latitude ?? 0,
        longitude: locationConfig?.longitude ?? 0,
        distanceMeters: 0,
        dateString: new Date().toISOString().split("T")[0],
      };
      dispatch({ type: "RECORD_CLOCK_IN", payload: attendance });
      setAbsenSuccessToast(`✅ Presensi Masuk Berhasil (${formatTime(attendance.clockIn)} WIB)`);
      setTimeout(() => setAbsenSuccessToast(null), 3000);
      setShowAttendanceModal(false);
    }
    setIsAbsenLoading(false);
  }

  function handleConfirmCloseShift() {
    const shiftGross = shiftTxs.reduce((s, tx) => s + tx.total, 0);
    const shiftCash = shiftTxs.filter((tx) => tx.paymentMethod === "cash").reduce((s, tx) => s + tx.total, 0);
    const shiftQris = shiftTxs.filter((tx) => tx.paymentMethod === "qris").reduce((s, tx) => s + tx.total, 0);
    const cashCount = shiftTxs.filter((tx) => tx.paymentMethod === "cash").length;
    const qrisCount = shiftTxs.filter((tx) => tx.paymentMethod === "qris").length;

    const shiftHpp = shiftTxs.reduce((sum, tx) => {
      return sum + tx.items.reduce((s, item) => {
        const product = state.products.find((p) => p.name === item.name);
        return s + (product ? product.rawMaterialCost * item.quantity : 0);
      }, 0);
    }, 0);

    const employeeSalaryCost = Math.round((state.activeEmployee?.monthlySalary ?? 0) / 30);
    const shiftExpenses = (state.expenses ?? []).filter((ex) => isSameDay(ex.timestamp, now) && ex.timestamp > shiftStartTime);
    const shiftExpenseTotal = shiftExpenses.reduce((s, ex) => s + ex.amount, 0);

    const netProfit = shiftGross - shiftHpp - employeeSalaryCost - shiftExpenseTotal;

    const report: ShiftReport = {
      id: crypto.randomUUID(),
      shiftName: `Shift ${state.activeEmployee?.name || "Kasir"}`,
      closedAt: Date.now(),
      closedBy: state.activeEmployee?.name || "Kasir",
      employeeId: state.activeEmployee?.id,
      totalGrossRevenue: shiftGross,
      totalCups: todayCups,
      totalTransactions: shiftTxs.length,
      totalHpp: shiftHpp,
      dailySalaryCost: employeeSalaryCost,
      totalExpenses: shiftExpenseTotal,
      netProfit: netProfit,
      cashRevenue: shiftCash,
      qrisRevenue: shiftQris,
      cashCups: todayCashCups,
      qrisCups: todayQrisCups,
      cashCount: cashCount,
      qrisCount: qrisCount,
      notes: shiftNotes.trim() || undefined,
    };

    dispatch({
      type: "RECORD_CLOCK_OUT",
      payload: { employeeId: state.activeEmployee?.id || "default", clockOut: Date.now() },
    });
    dispatch({ type: "CLOSE_SHIFT", payload: report });
    router.replace("/");
  }

  return (
    <div className="page-root">
      <div className="page-content">
        {/* Header */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--surface-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                4rq Cashier System
              </span>
              <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "9999px", backgroundColor: "var(--primary-light)", color: "var(--primary)", fontWeight: 700 }}>
                {state.activeEmployee?.name || "Kasir"}
              </span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.5px" }}>
              Penjualan Shift Ini
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* Tombol Absen */}
            <button
              type="button"
              onClick={() => {
                setAbsenError("");
                setShowAttendanceModal(true);
              }}
              style={{
                backgroundColor: activeAttendance ? "#f0fdf4" : "var(--primary-light)",
                color: activeAttendance ? "#16a34a" : "var(--primary)",
                border: `1px solid ${activeAttendance ? "#86efac" : "#a7f3d0"}`,
                borderRadius: "var(--r-pill)",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Presensi / Absensi Karyawan"
            >
              <MapPin size={14} weight="fill" />
              <span>{activeAttendance ? `${formatTime(activeAttendance.clockIn)}` : "Absen"}</span>
            </button>

            {/* Tombol Tutup Shift */}
            <button
              type="button"
              onClick={() => setShowCloseShiftModal(true)}
              style={{
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
                borderRadius: "var(--r-pill)",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Tutup Shift Operasional"
            >
              <ClockAfternoon size={14} weight="bold" />
              <span>Tutup Shift</span>
            </button>
          </div>
        </div>

        {/* Toast Absen Sukses */}
        {absenSuccessToast && (
          <div style={{ backgroundColor: "#15803d", color: "#ffffff", padding: "10px 16px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", animation: "fadeIn 0.2s ease" }}>
            <CheckCircle size={18} weight="fill" />
            <span>{absenSuccessToast}</span>
          </div>
        )}

        {/* Reminder Banner jika belum absen */}
        {!activeAttendance && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              borderBottom: "1px solid #fde68a",
              padding: "8px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={14} color="#d97706" weight="bold" />
              <p style={{ fontSize: "11px", color: "#92400e", fontWeight: 600 }}>
                Belum absen masuk shift ini
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAbsenError("");
                setShowAttendanceModal(true);
              }}
              style={{
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                border: "none",
                borderRadius: "var(--r-pill)",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Absen Sekarang
            </button>
          </div>
        )}

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Today Summary Card - Focused on Active Shift Cups */}
          <div
            style={{
              backgroundColor: "var(--ink-primary)",
              borderRadius: "var(--r-lg)",
              padding: "18px 20px",
              boxShadow: "0 8px 24px rgba(20,31,25,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                  Total Cup Terjual Shift Ini
                </p>
                <p style={{ color: "#ffffff", fontSize: "32px", fontWeight: 800, lineHeight: 1 }}>
                  {todayCups} <span style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Cup</span>
                </p>
              </div>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#52b788",
                }}
              >
                <Coffee size={24} weight="fill" />
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 600 }}>💵 Cash</p>
                <p style={{ color: "#4ade80", fontSize: "14px", fontWeight: 800, marginTop: "2px" }}>{todayCashCups} Cup</p>
              </div>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 600 }}>📱 QRIS</p>
                <p style={{ color: "#60a5fa", fontSize: "14px", fontWeight: 800, marginTop: "2px" }}>{todayQrisCups} Cup</p>
              </div>
              <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 600 }}>🧾 Struk</p>
                <p style={{ color: "var(--primary)", fontSize: "14px", fontWeight: 800, marginTop: "2px" }}>{shiftTxs.length}</p>
              </div>
            </div>
          </div>

          {/* Transaction list */}
          {shiftTxs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-muted)" }}>
              <p style={{ fontSize: "36px", marginBottom: "8px" }}>🍵</p>
              <p style={{ fontSize: "14px", fontWeight: 600 }}>Belum ada transaksi di shift ini</p>
              <p style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "2px" }}>Transaksi baru akan terhitung pada shift Anda</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-muted)" }}>
                {shiftTxs.length} transaksi · {todayCups} cup shift ini
              </p>
              {shiftTxs.map((tx) => {
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
                        <p style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "2px" }}>
                          {formatTime(tx.timestamp)} · {tx.items.map(i => `${i.name} (${i.quantity})`).join(", ")}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary)", flexShrink: 0, marginLeft: "8px" }}>
                      {txCups} Cup
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedTx && <Receipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />}

      {/* Close Shift Modal */}
      {showCloseShiftModal && (
        <div className="modal-overlay" onClick={() => setShowCloseShiftModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drag-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
                  <ClockAfternoon size={20} weight="fill" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)" }}>
                    Tutup Shift Kasir
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                    Kasir: <strong style={{ color: "var(--ink-primary)" }}>{state.activeEmployee?.name || "Kasir"}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="btn-icon"
                style={{ width: "30px", height: "30px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Summary metrics for employee */}
            <div
              style={{
                backgroundColor: "var(--ink-primary)",
                borderRadius: "var(--r-md)",
                padding: "14px 16px",
                marginBottom: "14px",
                color: "#ffffff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase" }}>
                  Total Cup Terjual Shift Ini
                </p>
                <p style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>
                  {todayCups} <span style={{ fontSize: "12px", fontWeight: 500 }}>Cup</span>
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "6px", padding: "6px 8px" }}>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>💵 Cash</p>
                  <p style={{ fontSize: "12px", fontWeight: 800, color: "#4ade80" }}>{todayCashCups} Cup</p>
                </div>
                <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "6px", padding: "6px 8px" }}>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>📱 QRIS</p>
                  <p style={{ fontSize: "12px", fontWeight: 800, color: "#60a5fa" }}>{todayQrisCups} Cup</p>
                </div>
                <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "6px", padding: "6px 8px" }}>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>🧾 Struk</p>
                  <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--primary)" }}>{shiftTxs.length}</p>
                </div>
              </div>
            </div>

            {/* Notes input */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                Catatan Shift Kasir <span style={{ fontWeight: 500, color: "var(--ink-muted)" }}>(Opsional)</span>
              </label>
              <textarea
                placeholder="Contoh: Sisa stok cup 45, laci kasir klop, operasional lancar..."
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                className="input"
                style={{ height: "70px", resize: "none", fontSize: "12px", paddingTop: "8px" }}
              />
            </div>

            <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a", borderRadius: "var(--r-md)", padding: "10px 12px", marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", color: "#92400e", lineHeight: 1.4 }}>
                ℹ️ Laporan shift harian akan otomatis dikirim dan tersimpan ke <strong>Admin History</strong>. Sesi kasir Anda akan otomatis keluar setelah penutupan shift.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "var(--r-pill)",
                  border: "1.5px solid var(--surface-border)",
                  backgroundColor: "var(--surface)",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--ink-primary)",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseShift}
                style={{
                  flex: 2,
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "var(--r-pill)",
                  padding: "12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(220,38,38,0.25)",
                }}
              >
                <ClockAfternoon size={16} weight="bold" />
                <span>Konfirmasi Tutup Shift</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance / Presensi Modal */}
      {showAttendanceModal && (
        <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drag-handle" />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                  <MapPin size={20} weight="fill" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)" }}>
                    Presensi Kehadiran Kasir
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                    {state.activeEmployee?.name || "Kasir"} · {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="btn-icon"
                style={{ width: "30px", height: "30px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Attendance Status Card */}
            <div style={{ backgroundColor: activeAttendance ? "#f0fdf4" : "#f8fafc", border: `1.5px solid ${activeAttendance ? "#86efac" : "var(--surface-border)"}`, borderRadius: "var(--r-md)", padding: "14px 16px", marginBottom: "14px" }}>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase" }}>Status Presensi Hari Ini</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <p style={{ fontSize: "15px", fontWeight: 800, color: activeAttendance ? "#16a34a" : "var(--ink-primary)" }}>
                  {activeAttendance ? "🟢 Sudah Absen Masuk" : "⚪ Belum Absen Masuk"}
                </p>
                {activeAttendance && (
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#166534" }}>
                    {formatTime(activeAttendance.clockIn)} WIB
                  </span>
                )}
              </div>
              {activeAttendance && (
                <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "4px" }}>
                  📍 Jarak terdeteksi: {activeAttendance.distanceMeters}m dari outlet
                </p>
              )}
            </div>

            {/* Outlet Info */}
            <div style={{ backgroundColor: "var(--bg-app)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>Lokasi Toko:</span>
                <strong style={{ color: "var(--ink-primary)" }}>{state.outletLocation?.addressName || "Outlet Pontianak"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>Status Geofence:</span>
                <span style={{ fontWeight: 700, color: state.outletLocation?.isEnabled ? "var(--primary)" : "#64748b" }}>
                  {state.outletLocation?.isEnabled ? `Aktif (Maks ${state.outletLocation.radiusMeters}m)` : "Nonaktif"}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {absenError && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--r-md)", padding: "10px 12px", marginBottom: "14px" }}>
                <p style={{ fontSize: "12px", color: "#dc2626", fontWeight: 600, lineHeight: 1.4 }}>
                  {absenError}
                </p>
              </div>
            )}

            {/* Action Button */}
            {!activeAttendance ? (
              <button
                type="button"
                className="btn-primary"
                onClick={handleDoClockIn}
                disabled={isAbsenLoading}
                style={{ width: "100%" }}
              >
                {isAbsenLoading ? (
                  <>
                    <SpinnerGap size={18} className="animate-spin" />
                    <span>Memverifikasi Lokasi GPS...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={18} weight="fill" />
                    <span>Klik Untuk Absen Masuk Sekarang</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowAttendanceModal(false)}
                style={{ width: "100%" }}
              >
                <span>Tutup</span>
              </button>
            )}
          </div>
        </div>
      )}

      <BottomNav role="karyawan" />
    </div>
  );
}
