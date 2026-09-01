"use client";
import React from "react";
import { ArrowClockwise } from "@phosphor-icons/react";

interface ProductHeaderProps {
  onRefresh: () => void;
}

export default function ProductHeader({ onRefresh }: ProductHeaderProps) {
  return (
    <header
      style={{
        backgroundColor: "var(--surface)",
        padding: "20px 20px 16px",
        borderBottom: "1px solid var(--surface-border)",
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <p
          style={{
            fontSize: "11px",
            color: "var(--ink-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Matcha Kyoto Backend API
        </p>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "var(--ink-primary)",
            letterSpacing: "-0.5px",
          }}
        >
          Kelola Menu &amp; QRIS
        </h1>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="btn-icon"
        title="Refresh Data"
        style={{ width: "36px", height: "36px" }}
      >
        <ArrowClockwise size={18} />
      </button>
    </header>
  );
}
