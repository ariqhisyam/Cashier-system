"use client";
import React from "react";
import {
  X,
  MapPin,
  SpinnerGap,
} from "@phosphor-icons/react";
import type { AttendanceRecord, Employee, OutletLocation } from "@/lib/types";
import { formatTimeOnly } from "@/hooks/useKaryawanCashier";

interface AttendanceModalProps {
  activeEmployee?: Employee | null;
  activeAttendance?: AttendanceRecord;
  outletLocation?: OutletLocation;
  isAbsenLoading: boolean;
  absenError: string;
  onClockIn: () => void;
  onClose: () => void;
}

export default function AttendanceModal({
  activeEmployee,
  activeAttendance,
  outletLocation,
  isAbsenLoading,
  absenError,
  onClockIn,
  onClose,
}: AttendanceModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="drag-handle" />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                backgroundColor: "var(--primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              <MapPin size={20} weight="fill" />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)" }}>
                Presensi Kehadiran Kasir
              </h3>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                {activeEmployee?.name || "Kasir"} ·{" "}
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ width: "30px", height: "30px" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Attendance Status Card */}
        <div
          style={{
            backgroundColor: activeAttendance ? "#f0fdf4" : "#f8fafc",
            border: `1.5px solid ${
              activeAttendance ? "#86efac" : "var(--surface-border)"
            }`,
            borderRadius: "var(--r-md)",
            padding: "14px 16px",
            marginBottom: "14px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "var(--ink-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Status Presensi Hari Ini
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "4px",
            }}
          >
            <p
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: activeAttendance ? "#16a34a" : "var(--ink-primary)",
              }}
            >
              {activeAttendance ? "🟢 Sudah Absen Masuk" : "⚪ Belum Absen Masuk"}
            </p>
            {activeAttendance && (
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#166534" }}>
                {formatTimeOnly(activeAttendance.clockIn)} WIB
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
        <div
          style={{
            backgroundColor: "var(--bg-app)",
            borderRadius: "var(--r-md)",
            padding: "10px 14px",
            marginBottom: "14px",
            fontSize: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-muted)" }}>Lokasi Toko:</span>
            <strong style={{ color: "var(--ink-primary)" }}>
              {outletLocation?.addressName || "Outlet Pontianak"}
            </strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-muted)" }}>Status Geofence:</span>
            <span
              style={{
                fontWeight: 700,
                color: outletLocation?.isEnabled ? "var(--primary)" : "#64748b",
              }}
            >
              {outletLocation?.isEnabled
                ? `Aktif (Maks ${outletLocation.radiusMeters}m)`
                : "Nonaktif"}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {absenError && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "var(--r-md)",
              padding: "10px 12px",
              marginBottom: "14px",
            }}
          >
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
            onClick={onClockIn}
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
            onClick={onClose}
            style={{ width: "100%" }}
          >
            <span>Tutup</span>
          </button>
        )}
      </div>
    </div>
  );
}
