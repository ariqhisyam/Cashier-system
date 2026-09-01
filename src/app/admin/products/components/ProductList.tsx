"use client";
import React from "react";
import type { Product } from "@/lib/types";
import EditProductRow from "./EditProductRow";
import ProductCard from "./ProductCard";
import { Image as ImageIcon, WarningCircle } from "@phosphor-icons/react";

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  editingId: string | null;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSavedEdit: () => void;
  onDelete: (id: string, name: string) => void;
  isDeleting?: boolean;
  onRetry: () => void;
}

export default function ProductList({
  products,
  isLoading,
  isError,
  error,
  editingId,
  onEdit,
  onCancelEdit,
  onSavedEdit,
  onDelete,
  isDeleting,
  onRetry,
}: ProductListProps) {
  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="card"
            style={{
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              opacity: 0.6,
            }}
          >
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "var(--r-sm)",
                backgroundColor: "var(--surface-border)",
              }}
            />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ height: "14px", width: "40%", backgroundColor: "var(--surface-border)", borderRadius: "4px" }} />
              <div style={{ height: "12px", width: "25%", backgroundColor: "var(--surface-border)", borderRadius: "4px" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          padding: "16px",
          backgroundColor: "#fef2f2",
          borderRadius: "var(--r-md)",
          border: "1px solid #fecaca",
          color: "#991b1b",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <WarningCircle size={20} weight="fill" />
        <div style={{ flex: 1, fontSize: "12px" }}>
          <p style={{ fontWeight: 700 }}>Gagal memuat data menu dari server</p>
          <p style={{ opacity: 0.8 }}>{error?.message || "Pastikan backend NestJS aktif di port 3001"}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="btn-ghost"
          style={{ padding: "6px 10px", fontSize: "11px", color: "#991b1b" }}
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "32px 16px",
          textAlign: "center",
          color: "var(--ink-muted)",
        }}
      >
        <ImageIcon size={36} weight="light" style={{ margin: "0 auto 8px", opacity: 0.5 }} />
        <p style={{ fontSize: "14px", fontWeight: 700 }}>Belum ada menu ditemukan</p>
        <p style={{ fontSize: "12px", marginTop: "2px" }}>
          Klik tombol Tambah Menu untuk membuat produk baru.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {products.map((product) => (
        <div key={product.id}>
          {editingId === product.id ? (
            <EditProductRow
              product={product}
              onCancel={onCancelEdit}
              onSaved={onSavedEdit}
            />
          ) : (
            <ProductCard
              product={product}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          )}
        </div>
      ))}
    </div>
  );
}
