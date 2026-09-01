"use client";
import React from "react";
import Image from "next/image";
import { Plus, Minus } from "@phosphor-icons/react";
import type { Product } from "@/lib/types";
import { formatRupiah } from "@/lib/store";

interface CashierMenuGridProps {
  products: Product[];
  getQty: (productId: string) => number;
  adjustCart: (productId: string, delta: number) => void;
}

export default function CashierMenuGrid({
  products,
  getQty,
  adjustCart,
}: CashierMenuGridProps) {
  return (
    <div
      style={{
        padding: "16px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        paddingBottom: "100px",
      }}
    >
      {products.map((product) => {
        const qty = getQty(product.id);
        const outOfStock = product.stock === 0;

        return (
          <div
            key={product.id}
            className="card"
            style={{ display: "flex", flexDirection: "column" }}
          >
            {/* Product image */}
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1",
                overflow: "hidden",
                backgroundColor: "#e2ebe7",
              }}
            >
              <Image
                src={product.imageUrl || "/matcha-latte.jpg"}
                alt={product.name}
                fill
                sizes="(max-width: 430px) 50vw"
                style={{
                  objectFit: "cover",
                  filter: outOfStock ? "grayscale(70%)" : "none",
                }}
              />
              <div style={{ position: "absolute", top: "8px", left: "8px" }}>
                <span
                  className="badge"
                  style={{
                    backgroundColor: outOfStock
                      ? "#ef4444"
                      : "rgba(255,255,255,0.95)",
                    color: outOfStock ? "#ffffff" : "var(--ink-primary)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                  }}
                >
                  {outOfStock ? "Habis" : `Stok ${product.stock}`}
                </span>
              </div>
              {qty > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    backgroundColor: "var(--primary)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(30,112,72,0.4)",
                  }}
                >
                  {qty}
                </div>
              )}
            </div>

            {/* Info & Action */}
            <div
              style={{
                padding: "12px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--ink-primary)",
                    lineHeight: 1.3,
                  }}
                >
                  {product.name}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--primary)",
                    fontWeight: 800,
                    marginTop: "4px",
                  }}
                >
                  {formatRupiah(product.price)}
                </p>
              </div>

              <div>
                {qty === 0 ? (
                  <button
                    type="button"
                    onClick={() => !outOfStock && adjustCart(product.id, 1)}
                    disabled={outOfStock}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--r-pill)",
                      border: "none",
                      cursor: outOfStock ? "not-allowed" : "pointer",
                      backgroundColor: outOfStock
                        ? "var(--surface-border)"
                        : "var(--primary)",
                      color: outOfStock ? "var(--ink-muted)" : "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Plus size={14} weight="bold" />
                    <span>Tambah</span>
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <button
                      type="button"
                      className="qty-btn minus"
                      onClick={() => adjustCart(product.id, -1)}
                    >
                      <Minus size={14} weight="bold" />
                    </button>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "var(--ink-primary)",
                      }}
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      className="qty-btn plus"
                      onClick={() => adjustCart(product.id, 1)}
                      disabled={qty >= product.stock}
                    >
                      <Plus size={14} weight="bold" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
