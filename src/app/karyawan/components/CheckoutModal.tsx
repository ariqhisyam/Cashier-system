"use client";
import React from "react";
import {
  X,
  Money,
  QrCode,
  Camera,
  CheckCircle,
} from "@phosphor-icons/react";
import type { CartItem, Product } from "@/lib/types";
import { formatRupiah } from "@/lib/store";
import type { PaymentMethod, CheckoutStep } from "@/hooks/useKaryawanCashier";

interface CheckoutModalProps {
  cart: CartItem[];
  products: Product[];
  total: number;
  checkoutStep: CheckoutStep;
  setCheckoutStep: (step: CheckoutStep) => void;
  cashInput: string;
  setCashInput: (val: string) => void;
  cashPaid: number;
  changeAmount: number;
  cashIsEnough: boolean;
  qrisProofUrl: string;
  qrisImageUrl: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectMethod: (method: PaymentMethod) => void;
  onCashConfirm: () => void;
  onQrisProofUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQrisDirectConfirm?: () => void;
  onRetakePhoto: () => void;
  onFinalize: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
  isUploadingProof?: boolean;
}

export default function CheckoutModal({
  cart,
  products,
  total,
  checkoutStep,
  setCheckoutStep,
  cashInput,
  setCashInput,
  cashPaid,
  changeAmount,
  cashIsEnough,
  qrisProofUrl,
  qrisImageUrl,
  fileInputRef,
  onSelectMethod,
  onCashConfirm,
  onQrisProofUpload,
  onQrisDirectConfirm,
  onRetakePhoto,
  onFinalize,
  onClose,
  isSubmitting = false,
  isUploadingProof = false,
}: CheckoutModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <div className="drag-handle" />

        {/* Hidden persistent Camera Input with ID for native label binding */}
        <input
          id="qris-camera-input"
          ref={fileInputRef as any}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onQrisProofUpload}
          style={{
            position: "fixed",
            top: "-1000px",
            left: "-1000px",
            opacity: 0,
            pointerEvents: "none",
          }}
        />

        {/* STEP 1: PILIH METODE PEMBAYARAN */}
        {checkoutStep === "method" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "var(--ink-primary)",
                }}
              >
                Metode Pembayaran
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="btn-icon"
                style={{ width: "32px", height: "32px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Order summary */}
            <div
              style={{
                backgroundColor: "var(--bg-app)",
                borderRadius: "var(--r-md)",
                padding: "12px 14px",
                marginBottom: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {cart.map((c) => {
                const p = products.find((pr) => pr.id === c.productId);
                if (!p) return null;
                return (
                  <div
                    key={c.productId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "var(--ink-secondary)" }}>
                      {p.name} ×{c.quantity}
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {formatRupiah(p.price * c.quantity)}
                    </span>
                  </div>
                );
              })}
              <div
                style={{
                  borderTop: "1px dashed var(--surface-border)",
                  paddingTop: "8px",
                  marginTop: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: 700 }}>Total Bayar</span>
                <span
                  style={{
                    color: "var(--primary)",
                    fontSize: "16px",
                    fontWeight: 800,
                  }}
                >
                  {formatRupiah(total)}
                </span>
              </div>
            </div>

            {/* Method Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => onSelectMethod("cash")}
                style={{
                  padding: "20px 14px",
                  borderRadius: "var(--r-lg)",
                  backgroundColor: "var(--bg-app)",
                  border: "2px solid var(--surface-border)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Money size={26} color="#16a34a" weight="fill" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
                    Cash
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
                    Hitung kembalian
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectMethod("qris")}
                style={{
                  padding: "20px 14px",
                  borderRadius: "var(--r-lg)",
                  backgroundColor: "var(--bg-app)",
                  border: "2px solid var(--surface-border)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <QrCode size={26} color="#2563eb" weight="fill" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
                    QRIS
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
                    Scan &amp; foto bukti
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* STEP 2: CASH PAYMENT */}
        {checkoutStep === "cash" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink-primary)" }}>
                Pembayaran Cash
              </h2>
              <button
                type="button"
                onClick={() => setCheckoutStep("method")}
                className="btn-icon"
                style={{ width: "32px", height: "32px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Total display */}
            <div
              style={{
                backgroundColor: "var(--primary)",
                borderRadius: "var(--r-md)",
                padding: "14px 16px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: 600 }}>
                Total Tagihan
              </span>
              <span style={{ color: "#ffffff", fontSize: "20px", fontWeight: 800 }}>
                {formatRupiah(total)}
              </span>
            </div>

            {/* Cash input */}
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
                Uang yang Diterima
              </label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Contoh: 100000"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                className="input"
                autoFocus
              />
            </div>

            {/* Quick amount buttons */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {[20000, 50000, 100000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() =>
                    setCashInput(String(Math.ceil(total / amount) * amount))
                  }
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--r-pill)",
                    border: "1px solid var(--surface-border)",
                    backgroundColor: "var(--surface)",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--ink-secondary)",
                    cursor: "pointer",
                  }}
                >
                  Rp{amount / 1000}k
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCashInput(String(total))}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--r-pill)",
                  border: "1px solid var(--primary)",
                  backgroundColor: "var(--primary-light)",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--primary)",
                  cursor: "pointer",
                }}
              >
                Pas
              </button>
            </div>

            {/* Change calculation */}
            {cashPaid > 0 && (
              <div
                style={{
                  backgroundColor: cashIsEnough ? "#f0fdf4" : "#fff1f2",
                  border: `1.5px solid ${cashIsEnough ? "#86efac" : "#fca5a5"}`,
                  borderRadius: "var(--r-md)",
                  padding: "12px 14px",
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: cashIsEnough ? "#16a34a" : "#dc2626",
                  }}
                >
                  {cashIsEnough ? "💰 Kembalian" : "⚠️ Kurang"}
                </span>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: cashIsEnough ? "#16a34a" : "#dc2626",
                  }}
                >
                  {cashIsEnough
                    ? formatRupiah(changeAmount)
                    : formatRupiah(total - cashPaid)}
                </span>
              </div>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={onCashConfirm}
              disabled={!cashIsEnough || isSubmitting}
              style={{ opacity: cashIsEnough && !isSubmitting ? 1 : 0.5 }}
            >
              {isSubmitting ? "Memproses Transaksi..." : "Selesai & Cetak Struk"}
            </button>
          </>
        )}

        {/* STEP 3: QRIS PAYMENT */}
        {checkoutStep === "qris" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink-primary)" }}>
                Pembayaran QRIS
              </h2>
              <button
                type="button"
                onClick={() => setCheckoutStep("method")}
                className="btn-icon"
                style={{ width: "32px", height: "32px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Total */}
            <div
              style={{
                backgroundColor: "var(--primary)",
                borderRadius: "var(--r-md)",
                padding: "14px 16px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: 600 }}>
                Total Tagihan
              </span>
              <span style={{ color: "#ffffff", fontSize: "20px", fontWeight: 800 }}>
                {formatRupiah(total)}
              </span>
            </div>

            {/* QR Code */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                padding: "16px",
                backgroundColor: "#ffffff",
                borderRadius: "var(--r-lg)",
                border: "1.5px solid var(--surface-border)",
                marginBottom: "16px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink-primary)" }}>
                  MATCHA KYOTO PERDANA 4RQ
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    color: "var(--ink-muted)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  NMID: ID1026582264820 · PNTNK BR
                </p>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrisImageUrl}
                alt="QRIS Matcha Kyoto Perdana 4RQ"
                style={{
                  width: "100%",
                  maxWidth: "260px",
                  height: "auto",
                  borderRadius: "10px",
                  border: "1px solid var(--surface-border)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              />

              <p style={{ fontSize: "11px", color: "var(--ink-muted)", textAlign: "center", lineHeight: 1.3 }}>
                Scan menggunakan BCA, Mandiri, GoPay, OVO, Dana, ShopeePay, dll.
              </p>
            </div>

            {/* Upload proof or direct confirm buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
              <label
                htmlFor="qris-camera-input"
                className="btn-primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  cursor: isUploadingProof ? "not-allowed" : "pointer",
                  opacity: isUploadingProof ? 0.7 : 1,
                  width: "100%",
                }}
              >
                <Camera size={18} weight="bold" />
                <span>{isUploadingProof ? "Memproses Bukti..." : "Foto Bukti Pembayaran"}</span>
              </label>

              {onQrisDirectConfirm && (
                <button
                  type="button"
                  onClick={onQrisDirectConfirm}
                  disabled={isSubmitting}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--r-pill)",
                    border: "1.5px solid var(--surface-border)",
                    backgroundColor: "transparent",
                    color: "var(--ink-secondary)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  Konfirmasi Langsung (Tanpa Foto)
                </button>
              )}
            </div>
          </>
        )}

        {/* STEP 4: QRIS PROOF PREVIEW */}
        {checkoutStep === "qris_proof" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink-primary)" }}>
                Konfirmasi Bukti QRIS
              </h2>
              <button
                type="button"
                onClick={() => setCheckoutStep("qris")}
                className="btn-icon"
                style={{ width: "32px", height: "32px" }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: "var(--r-md)",
                padding: "10px 14px",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle size={18} color="#16a34a" weight="fill" />
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a" }}>
                {isUploadingProof ? "Sedang mengunggah foto ke storage..." : "Bukti pembayaran berhasil dipilih"}
              </p>
            </div>

            {/* Proof preview */}
            {qrisProofUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrisProofUrl}
                alt="Bukti Pembayaran"
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "contain",
                  borderRadius: "var(--r-lg)",
                  border: "1.5px solid var(--surface-border)",
                  marginBottom: "16px",
                  backgroundColor: "#f8fafc",
                }}
              />
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={onRetakePhoto}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "var(--r-pill)",
                  border: "1.5px solid var(--surface-border)",
                  backgroundColor: "var(--surface)",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--ink-primary)",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Foto Ulang
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={onFinalize}
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Menyimpan Transaksi..." : "Selesai & Cetak Struk"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
