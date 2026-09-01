"use client";
import React from "react";
import type { Product } from "@/lib/types";
import { formatRupiah } from "@/lib/store";
import { PencilSimple, Trash } from "@phosphor-icons/react";

interface ProductCardProps {
  product: Product;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  isDeleting?: boolean;
}

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  isDeleting = false,
}: ProductCardProps) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 14px",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          width: "54px",
          height: "54px",
          borderRadius: "var(--r-sm)",
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
          backgroundColor: "var(--bg-app)",
          border: "1px solid var(--surface-border)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl || "/matcha-latte.jpg"}
          alt={product.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
          {product.name}
        </p>
        <p style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 800, marginTop: "1px" }}>
          {formatRupiah(product.price)}
        </p>
        <div style={{ display: "flex", gap: "8px", marginTop: "4px", alignItems: "center" }}>
          <span className="badge badge-muted" style={{ padding: "2px 8px", fontSize: "10px" }}>
            Stok: {product.stock}
          </span>
          <span style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
            HPP: {formatRupiah(product.rawMaterialCost)}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onEdit(product.id)}
          className="btn-icon"
          style={{ width: "34px", height: "34px" }}
          title="Edit"
        >
          <PencilSimple size={16} weight="bold" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(product.id, product.name)}
          disabled={isDeleting}
          className="btn-icon"
          style={{ width: "34px", height: "34px", color: "#ef4444", borderColor: "#fecaca" }}
          title="Hapus"
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
}
