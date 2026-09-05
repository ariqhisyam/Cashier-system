"use client";
import { useState } from "react";
import type { Transaction } from "@/lib/types";
import { formatTimeOnly, useKaryawanCashier } from "@/hooks/useKaryawanCashier";
import BottomNav from "@/components/BottomNav";
import Receipt from "@/components/Receipt";
import AttendanceModal from "../components/AttendanceModal";
import CloseShiftModal from "../components/CloseShiftModal";
import {
  Receipt as ReceiptIcon,
  Coffee,
  ClockAfternoon,
  MapPin,
  Clock,
  CheckCircle,
} from "@phosphor-icons/react";

export default function KaryawanHistoryPage() {
  const {
    activeEmployee,
    shiftTxs,
    todayCups,
    todayCashCups,
    todayQrisCups,
    activeAttendance,
    showAttendanceModal,
    setShowAttendanceModal,
    isAbsenLoading,
    absenError,
    setAbsenError,
    absenSuccessToast,
    handleDoClockIn,
    outletLocation,
    showCloseShiftModal,
    setShowCloseShiftModal,
    shiftNotes,
    setShiftNotes,
    handleConfirmCloseShift,
  } = useKaryawanCashier();

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

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
                {activeEmployee?.name || "Kasir"}
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
              <span>{activeAttendance ? `${formatTimeOnly(activeAttendance.clockIn)}` : "Absen"}</span>
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
              <p style={{ fontSize: "32px", marginBottom: "8px" }}>🍵</p>
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
                        <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
                          {formatTimeOnly(tx.timestamp)} WIB
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "1px" }}>
                          {tx.items.map((i) => `${i.name} (${i.quantity})`).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary)", display: "block" }}>
                        Rp {tx.total.toLocaleString("id-ID")}
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
        </div>
      </div>

      {/* Transaction Receipt Modal */}
      {selectedTx && <Receipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />}

      {/* Close Shift Modal */}
      {showCloseShiftModal && (
        <CloseShiftModal
          activeEmployee={activeEmployee}
          shiftTxs={shiftTxs}
          todayCups={todayCups}
          todayCashCups={todayCashCups}
          todayQrisCups={todayQrisCups}
          shiftNotes={shiftNotes}
          setShiftNotes={setShiftNotes}
          onConfirmCloseShift={handleConfirmCloseShift}
          onClose={() => setShowCloseShiftModal(false)}
        />
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <AttendanceModal
          activeEmployee={activeEmployee}
          activeAttendance={activeAttendance}
          outletLocation={outletLocation}
          absenError={absenError}
          isAbsenLoading={isAbsenLoading}
          onClockIn={handleDoClockIn}
          onClose={() => setShowAttendanceModal(false)}
        />
      )}

      <BottomNav role="karyawan" />
    </div>
  );
}
