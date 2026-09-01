"use client";
import React from "react";
import { ShoppingCart } from "@phosphor-icons/react";
import { formatRupiah } from "@/lib/store";

interface FloatingCartBarProps {
  cartCount: number;
  total: number;
  onOpenCheckout: () => void;
}

export default function FloatingCartBar({
  cartCount,
  total,
  onOpenCheckout,
}: FloatingCartBarProps) {
  if (cartCount === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "72px",
        left: "16px",
        right: "16px",
        zIndex: 45,
        animation: "slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <button
        type="button"
        onClick={onOpenCheckout}
        style={{
          width: "100%",
          padding: "12px 16px",
          backgroundColor: "var(--ink-primary)",
          borderRadius: "var(--r-pill)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <ShoppingCart size={18} weight="fill" />
          </div>
          <div style={{ textAlign: "left" }}>
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {cartCount} item dipilih
            </p>
            <p style={{ color: "#ffffff", fontSize: "15px", fontWeight: 800 }}>
              {formatRupiah(total)}
            </p>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "var(--primary)",
            color: "#ffffff",
            borderRadius: "var(--r-pill)",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          Bayar
        </div>
      </button>
    </div>
  );
}
