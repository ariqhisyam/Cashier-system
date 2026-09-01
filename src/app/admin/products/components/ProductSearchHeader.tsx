"use client";
import React from "react";
import { Plus, MagnifyingGlass } from "@phosphor-icons/react";

interface ProductSearchHeaderProps {
  totalProducts: number;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onOpenAddForm: () => void;
}

export default function ProductSearchHeader({
  totalProducts,
  searchQuery,
  onSearchChange,
  onOpenAddForm,
}: ProductSearchHeaderProps) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink-primary)" }}>
          Daftar Menu ({totalProducts})
        </h3>
        <button
          type="button"
          onClick={onOpenAddForm}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "var(--primary)",
            color: "#ffffff",
            border: "none",
            borderRadius: "var(--r-pill)",
            padding: "8px 14px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Plus size={14} weight="bold" />
          <span>Tambah Menu</span>
        </button>
      </div>

      {/* Search Input */}
      <div style={{ position: "relative" }}>
        <MagnifyingGlass
          size={16}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--ink-muted)",
          }}
        />
        <input
          type="text"
          placeholder="Cari menu matcha..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input"
          style={{ paddingLeft: "36px", fontSize: "13px" }}
        />
      </div>
    </section>
  );
}
