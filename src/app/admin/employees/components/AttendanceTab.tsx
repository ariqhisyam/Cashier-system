"use client";
import React from "react";
import { Clock, MapPin, Trash, CheckCircle, XCircle } from "@phosphor-icons/react";
import type { AttendanceRecord } from "@/lib/types";

interface AttendanceTabProps {
  attendanceRecords: AttendanceRecord[];
  onDeleteAttendance: (id: string) => void;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AttendanceTab({
  attendanceRecords,
  onDeleteAttendance,
}: AttendanceTabProps) {
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "32px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "var(--bg-app)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-muted)",
          }}
        >
          <Clock size={24} weight="duotone" />
        </div>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
          Belum Ada Catatan Presensi
        </p>
        <p style={{ fontSize: "12px", color: "var(--ink-muted)", maxWidth: "240px" }}>
          Presensi masuk dan keluar kasir akan tercatat otomatis di sini.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
          Riwayat Presensi Staff
        </h3>
        <span style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
          {attendanceRecords.length} sesi tercatat
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {attendanceRecords.map((rec) => (
          <div
            key={rec.id}
            className="card"
            style={{
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink-primary)" }}>
                  {rec.employeeName}
                </h4>
                <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                  {formatDate(rec.clockIn)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onDeleteAttendance(rec.id)}
                className="btn-icon"
                style={{ width: "26px", height: "26px", color: "#dc2626" }}
                title="Hapus Catatan Presensi"
              >
                <Trash size={13} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                backgroundColor: "var(--bg-app)",
                padding: "8px 10px",
                borderRadius: "var(--r-md)",
                fontSize: "11px",
              }}
            >
              <div>
                <span style={{ color: "var(--ink-muted)", display: "block" }}>Masuk</span>
                <strong style={{ color: "#16a34a" }}>{formatTime(rec.clockIn)} WIB</strong>
              </div>
              <div>
                <span style={{ color: "var(--ink-muted)", display: "block" }}>Keluar</span>
                <strong style={{ color: rec.clockOut ? "#dc2626" : "#d97706" }}>
                  {rec.clockOut ? `${formatTime(rec.clockOut)} WIB` : "Sedang Bertugas"}
                </strong>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--ink-muted)" }}>
              <MapPin size={12} weight="fill" color="var(--primary)" />
              <span>Jarak ke toko: {rec.distanceMeters} meter</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
