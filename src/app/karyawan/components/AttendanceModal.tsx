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
  onClockIn: (isEmergency?: boolean) => void;
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
              letterSpacing: "0.5px",
            }}
          >
            Status Presensi Masuk
          </p>
          <p
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: activeAttendance ? "#15803d" : "var(--ink-secondary)",
              marginTop: "2px",
            }}
          >
            {activeAttendance
              ? "✅ Sedang Bertugas (Sudah Absen)"
              : "⏳ Belum Absen Masuk"}
          </p>
          {activeAttendance && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "var(--ink-muted)",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <span>
                🕒 Jam Masuk:{" "}
                <strong style={{ color: "var(--ink-primary)" }}>
                  {formatTimeOnly(activeAttendance.clockIn)} WIB
                </strong>
              </span>
              <span>
                📍 Lokasi Presensi:{" "}
                <strong style={{ color: "var(--ink-primary)" }}>
                  {activeAttendance.distanceMeters} meter dari outlet
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Geofence Info Card */}
        <div
          style={{
            backgroundColor: "var(--bg-app)",
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--r-md)",
            padding: "12px 14px",
            marginBottom: "16px",
            fontSize: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-muted)" }}>Lokasi Outlet:</span>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onClockIn(false)}
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
                  <span>{absenError ? "Coba Lagi Deteksi GPS" : "Klik Untuk Absen Masuk"}</span>
                </>
              )}
            </button>

            {absenError && (
              <button
                type="button"
                onClick={() => onClockIn(true)}
                disabled={isAbsenLoading}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--r-pill)",
                  border: "1.5px solid #fde68a",
                  backgroundColor: "#fffbeb",
                  color: "#92400e",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: isAbsenLoading ? "not-allowed" : "pointer",
                }}
              >
                ⚠️ Sinyal GPS Bermasalah? Presensi Darurat (Bypass)
              </button>
            )}
          </div>
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
