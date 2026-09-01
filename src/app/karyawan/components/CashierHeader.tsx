"use client";
import React from "react";
import {
  MapPin,
  ClockAfternoon,
  SignOut,
  Clock,
  CheckCircle,
} from "@phosphor-icons/react";
import type { AttendanceRecord, Employee } from "@/lib/types";
import { formatTimeOnly } from "@/hooks/useKaryawanCashier";

interface CashierHeaderProps {
  activeEmployee?: Employee | null;
  activeAttendance?: AttendanceRecord;
  absenSuccessToast?: string | null;
  onOpenAttendanceModal: () => void;
  onOpenCloseShiftModal: () => void;
  onLogout: () => void;
}

export default function CashierHeader({
  activeEmployee,
  activeAttendance,
  absenSuccessToast,
  onOpenAttendanceModal,
  onOpenCloseShiftModal,
  onLogout,
}: CashierHeaderProps) {
  return (
    <>
      <div
        style={{
          backgroundColor: "var(--surface)",
          padding: "20px 20px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--surface-border)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "11px",
                color: "var(--ink-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              4rq cashier system
            </span>
            <span
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "9999px",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
                fontWeight: 700,
              }}
            >
              {activeEmployee?.name || "Kasir"}
            </span>
          </div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--ink-primary)",
              letterSpacing: "-0.5px",
            }}
          >
            Pilih Menu
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Tombol Absen */}
          <button
            type="button"
            onClick={onOpenAttendanceModal}
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
            <span>
              {activeAttendance
                ? `${formatTimeOnly(activeAttendance.clockIn)}`
                : "Absen"}
            </span>
          </button>

          {/* Tombol Tutup Shift */}
          <button
            type="button"
            onClick={onOpenCloseShiftModal}
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

          {/* Logout button */}
          <button
            type="button"
            className="btn-icon"
            onClick={onLogout}
            title="Keluar"
            style={{ width: "32px", height: "32px" }}
          >
            <SignOut size={16} />
          </button>
        </div>
      </div>

      {/* Toast Absen Sukses */}
      {absenSuccessToast && (
        <div
          style={{
            backgroundColor: "#15803d",
            color: "#ffffff",
            padding: "10px 16px",
            fontSize: "12px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "fadeIn 0.2s ease",
          }}
        >
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
            onClick={onOpenAttendanceModal}
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
    </>
  );
}
