"use client";
import React from "react";
import { X, ClockAfternoon } from "@phosphor-icons/react";
import type { Employee, Transaction } from "@/lib/types";

interface CloseShiftModalProps {
  activeEmployee?: Employee | null;
  shiftTxs: Transaction[];
  todayCups: number;
  todayCashCups: number;
  todayQrisCups: number;
  shiftNotes: string;
  setShiftNotes: (val: string) => void;
  onConfirmCloseShift: () => void;
  onClose: () => void;
}

export default function CloseShiftModal({
  activeEmployee,
  shiftTxs,
  todayCups,
  todayCashCups,
  todayQrisCups,
  shiftNotes,
  setShiftNotes,
  onConfirmCloseShift,
  onClose,
}: CloseShiftModalProps) {
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
                backgroundColor: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#dc2626",
              }}
            >
              <ClockAfternoon size={20} weight="fill" />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)" }}>
                Tutup Shift Kasir
              </h3>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                Kasir:{" "}
                <strong style={{ color: "var(--ink-primary)" }}>
                  {activeEmployee?.name || "Kasir"}
                </strong>
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Total Cup Terjual Shift Ini
            </p>
            <p style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>
              {todayCups} <span style={{ fontSize: "12px", fontWeight: 500 }}>Cup</span>
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: "6px",
                padding: "6px 8px",
              }}
            >
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>💵 Cash</p>
              <p style={{ fontSize: "12px", fontWeight: 800, color: "#4ade80" }}>
                {todayCashCups} Cup
              </p>
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: "6px",
                padding: "6px 8px",
              }}
            >
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>📱 QRIS</p>
              <p style={{ fontSize: "12px", fontWeight: 800, color: "#60a5fa" }}>
                {todayQrisCups} Cup
              </p>
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: "6px",
                padding: "6px 8px",
              }}
            >
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>🧾 Struk</p>
              <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--primary)" }}>
                {shiftTxs.length}
              </p>
            </div>
          </div>
        </div>

        {/* Notes input */}
        <div style={{ marginBottom: "14px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--ink-secondary)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Catatan Shift Kasir{" "}
            <span style={{ fontWeight: 500, color: "var(--ink-muted)" }}>(Opsional)</span>
          </label>
          <textarea
            placeholder="Contoh: Sisa stok cup 45, laci kasir klop, operasional lancar..."
            value={shiftNotes}
            onChange={(e) => setShiftNotes(e.target.value)}
            className="input"
            style={{ height: "70px", resize: "none", fontSize: "12px", paddingTop: "8px" }}
          />
        </div>

        <div
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #fde68a",
            borderRadius: "var(--r-md)",
            padding: "10px 12px",
            marginBottom: "16px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#92400e", lineHeight: 1.4 }}>
            ℹ️ Laporan shift harian akan otomatis dikirim dan tersimpan ke{" "}
            <strong>Admin History</strong>. Sesi kasir Anda akan otomatis keluar setelah
            penutupan shift.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={onClose}
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
            onClick={onConfirmCloseShift}
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
  );
}
