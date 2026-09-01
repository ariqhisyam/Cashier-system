"use client";
import React from "react";
import { useQrisCard } from "@/hooks";
import { QrCode, UploadSimple, SpinnerGap, CheckCircle } from "@phosphor-icons/react";

export default function QrisSettingCard() {
  const {
    qrisUrl,
    fileInputRef,
    savedToast,
    isBusy,
    triggerFileInput,
    handleFileUpload,
  } = useQrisCard();

  return (
    <div className="card" style={{ padding: "16px" }}>
      {/* Card Header & Update Trigger */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              flexShrink: 0,
            }}
          >
            <QrCode size={20} weight="fill" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
              Pengaturan QRIS Toko
            </h3>
            <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
              Ditampilkan saat kasir checkout
            </p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          style={{ display: "none" }}
        />
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={isBusy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary)",
            border: "1px solid var(--primary-border, #bbf7d0)",
            borderRadius: "var(--r-pill)",
            padding: "7px 14px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: isBusy ? "not-allowed" : "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
          title="Upload & Ganti Gambar QRIS"
        >
          {isBusy ? (
            <SpinnerGap size={15} className="animate-spin" />
          ) : (
            <UploadSimple size={15} weight="bold" />
          )}
          <span>{isBusy ? "Mengunggah..." : "Update QRIS"}</span>
        </button>
      </div>

      {/* QRIS Active Preview */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          backgroundColor: "var(--bg-app)",
          padding: "12px",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--surface-border)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrisUrl || "/qris.jpg"}
          alt="QRIS Preview"
          style={{
            width: "64px",
            height: "84px",
            objectFit: "cover",
            borderRadius: "6px",
            border: "1px solid var(--surface-border)",
            backgroundColor: "#ffffff",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink-primary)" }}>
            MATCHA KYOTO PERDANA 4RQ
          </p>
          <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
            NMID: ID1026582264820 · PNTNK BR
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
            <span
              style={{
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "9999px",
                backgroundColor: "#dcfce7",
                color: "#15803d",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ✓ QRIS Aktif (Supabase)
            </span>
            {savedToast && (
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  animation: "fadeIn 0.2s ease",
                }}
              >
                <CheckCircle size={12} weight="fill" /> Berhasil Diperbarui!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
