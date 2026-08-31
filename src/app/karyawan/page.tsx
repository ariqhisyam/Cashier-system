"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Minus, SignOut, ShoppingCart, X } from "@phosphor-icons/react";
import { useStore, formatRupiah } from "@/lib/store";
import type { CartItem, Transaction } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import Receipt from "@/components/Receipt";

export default function KaryawanPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (state.session !== "karyawan") router.replace("/");
  }, [state.session, router]);
  if (state.session !== "karyawan") return null;

  function getQty(productId: string) {
    return cart.find((c) => c.productId === productId)?.quantity ?? 0;
  }

  function adjustCart(productId: string, delta: number) {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      const currentQty = existing?.quantity ?? 0;
      const newQty = Math.max(0, Math.min(currentQty + delta, product.stock));
      if (newQty === 0) return prev.filter((c) => c.productId !== productId);
      if (existing) return prev.map((c) => c.productId === productId ? { ...c, quantity: newQty } : c);
      return [...prev, { productId, quantity: newQty }];
    });
  }

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const total = cart.reduce((sum, c) => {
    const p = state.products.find((pr) => pr.id === c.productId);
    return sum + (p ? p.price * c.quantity : 0);
  }, 0);

  function handleSelesai() {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      total,
      cashierName: state.activeEmployee?.name || "Kasir Utama",
      items: cart.map((c) => {
        const p = state.products.find((pr) => pr.id === c.productId)!;
        return { name: p.name, quantity: c.quantity, price: p.price, subtotal: p.price * c.quantity };
      }),
    };
    dispatch({ type: "ADD_TRANSACTION", payload: tx });
    setLastTransaction(tx);
    setCart([]);
    setShowCheckout(false);
    setShowReceipt(true);
  }

  const qrisUrl = `https://chart.googleapis.com/chart?cht=qr&chs=220x220&chl=${encodeURIComponent(
    state.qrisImageUrl || `MATCHA-KYOTO-PAY-${total}`
  )}&choe=UTF-8`;

  return (
    <div className="page-root">
      <div className="page-content">
        {/* Header */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            padding: "20px 20px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--surface-border)",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Matcha Kyoto
              </span>
              <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "9999px", backgroundColor: "var(--primary-light)", color: "var(--primary)", fontWeight: 700 }}>
                {state.activeEmployee?.name || "Kasir"}
              </span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.5px" }}>
              Pilih Menu
            </h1>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => {
              dispatch({ type: "LOGOUT" });
              router.replace("/");
            }}
            title="Keluar"
          >
            <SignOut size={18} />
          </button>
        </div>

        {/* Menu grid */}
        <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingBottom: "100px" }}>
          {state.products.map((product) => {
            const qty = getQty(product.id);
            const outOfStock = product.stock === 0;

            return (
              <div key={product.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                {/* Product image */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "1", overflow: "hidden", backgroundColor: "#e2ebe7" }}>
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 430px) 50vw"
                    style={{ objectFit: "cover", filter: outOfStock ? "grayscale(70%)" : "none" }}
                  />
                  {/* Stock badge */}
                  <div style={{ position: "absolute", top: "8px", left: "8px" }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: outOfStock ? "#ef4444" : "rgba(255,255,255,0.95)",
                        color: outOfStock ? "#ffffff" : "var(--ink-primary)",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                      }}
                    >
                      {outOfStock ? "Habis" : `Stok ${product.stock}`}
                    </span>
                  </div>

                  {/* Selected count tag */}
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
                <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "10px" }}>
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)", lineHeight: 1.3 }}>
                      {product.name}
                    </h3>
                    <p style={{ fontSize: "14px", color: "var(--primary)", fontWeight: 800, marginTop: "4px" }}>
                      {formatRupiah(product.price)}
                    </p>
                  </div>

                  {/* Quantity Actions */}
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
                          backgroundColor: outOfStock ? "var(--surface-border)" : "var(--primary)",
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
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button type="button" className="qty-btn minus" onClick={() => adjustCart(product.id, -1)}>
                          <Minus size={14} weight="bold" />
                        </button>
                        <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink-primary)" }}>
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
      </div>

      {/* Floating Checkout Bar anchored right above BottomNav */}
      {cartCount > 0 && (
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
            onClick={() => setShowCheckout(true)}
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
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: 600 }}>
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
              Bayar QRIS
            </div>
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="drag-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink-primary)" }}>Pembayaran QRIS</h2>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="btn-icon"
                style={{ width: "32px", height: "32px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Order items */}
            <div style={{ backgroundColor: "var(--bg-app)", borderRadius: "var(--r-md)", padding: "14px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {cart.map((c) => {
                const p = state.products.find((pr) => pr.id === c.productId)!;
                return (
                  <div key={c.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                        <Image src={p.imageUrl} alt={p.name} fill sizes="36px" style={{ objectFit: "cover" }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--ink-primary)" }}>{p.name}</p>
                        <p style={{ color: "var(--ink-muted)", fontSize: "11px" }}>{c.quantity}x @ {formatRupiah(p.price)}</p>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--ink-primary)" }}>
                      {formatRupiah(p.price * c.quantity)}
                    </span>
                  </div>
                );
              })}
              <div style={{ borderTop: "1px dashed var(--surface-border)", paddingTop: "10px", marginTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "14px" }}>Total Bayar</span>
                <span style={{ color: "var(--primary)", fontSize: "18px", fontWeight: 800 }}>{formatRupiah(total)}</span>
              </div>
            </div>

            {/* QR Code Container */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "20px", padding: "16px", backgroundColor: "#ffffff", borderRadius: "var(--r-lg)", border: "1.5px solid var(--surface-border)" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)" }}>Scan QRIS untuk Bayar</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.qrisImageUrl || qrisUrl}
                alt="QRIS Pembayaran"
                width={200}
                height={200}
                style={{ borderRadius: "12px", border: "1px solid var(--surface-border)" }}
              />
              <p style={{ fontSize: "11px", color: "var(--ink-muted)", textAlign: "center" }}>
                {state.qrisImageUrl ? "QRIS Toko Aktif" : "Menampilkan QRIS Otomatis"}
              </p>
            </div>

            <button type="button" className="btn-primary" onClick={handleSelesai}>
              Selesai &amp; Cetak Struk
            </button>
          </div>
        </div>
      )}

      {showReceipt && lastTransaction && (
        <Receipt transaction={lastTransaction} onClose={() => setShowReceipt(false)} />
      )}

      <BottomNav role="karyawan" />
    </div>
  );
}
