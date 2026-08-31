"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStore, formatRupiah } from "@/lib/store";
import type { Product } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import { PencilSimple, Trash, Plus, Check, X, QrCode } from "@phosphor-icons/react";

function EditRow({ product, onSave, onCancel }: { product: Product; onSave: (p: Product) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(product);

  function field(key: keyof Product) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
      setDraft((prev) => ({ ...prev, [key]: val }));
    };
  }

  return (
    <div style={{ padding: "14px 16px", backgroundColor: "#fffbeb", borderRadius: "var(--r-md)", border: "1.5px solid #fde68a", display: "flex", flexDirection: "column", gap: "10px" }}>
      <p style={{ fontSize: "13px", fontWeight: 800, color: "#92400e" }}>Edit: {product.name}</p>
      {([
        { key: "name", label: "Nama Menu", type: "text" },
        { key: "price", label: "Harga Jual (Rp)", type: "number" },
        { key: "stock", label: "Jumlah Stok", type: "number" },
        { key: "rawMaterialCost", label: "Harga Bahan Baku (HPP)", type: "number" },
        { key: "imageUrl", label: "URL Gambar", type: "text" },
      ] as { key: keyof Product; label: string; type: string }[]).map(({ key, label, type }) => (
        <div key={key}>
          <label style={{ fontSize: "11px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 700 }}>{label}</label>
          <input type={type} value={String(draft[key])} onChange={field(key)} className="input" style={{ padding: "8px 12px", fontSize: "13px", backgroundColor: "#ffffff" }} />
        </div>
      ))}
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button type="button" onClick={() => onSave(draft)} className="btn-primary" style={{ fontSize: "13px", padding: "10px" }}>
          <Check size={14} weight="bold" /> Simpan
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost" style={{ fontSize: "13px", padding: "10px" }}>
          <X size={14} weight="bold" /> Batal
        </button>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [qrisInput, setQrisInput] = useState(state.qrisImageUrl);
  const [qrisSaved, setQrisSaved] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>({
    name: "", price: 0, stock: 0, rawMaterialCost: 0, imageUrl: "",
  });

  useEffect(() => {
    if (state.session !== "admin") router.replace("/");
  }, [state.session, router]);
  if (state.session !== "admin") return null;

  function saveProduct(p: Product) { dispatch({ type: "UPDATE_PRODUCT", payload: p }); setEditingId(null); }
  function deleteProduct(id: string) { if (confirm("Hapus menu ini?")) dispatch({ type: "DELETE_PRODUCT", payload: id }); }
  function addProduct() {
    if (!newProduct.name) return;
    dispatch({ type: "ADD_PRODUCT", payload: { ...newProduct, id: crypto.randomUUID(), imageUrl: newProduct.imageUrl || "/matcha-latte.jpg" } });
    setShowAddForm(false);
    setNewProduct({ name: "", price: 0, stock: 0, rawMaterialCost: 0, imageUrl: "" });
  }
  function saveQris() {
    dispatch({ type: "SET_QRIS", payload: qrisInput });
    setQrisSaved(true);
    setTimeout(() => setQrisSaved(false), 2000);
  }

  return (
    <div className="page-root">
      <div className="page-content">
        {/* Header */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--surface-border)",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Matcha Kyoto
          </p>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.5px" }}>
            Kelola Menu &amp; QRIS
          </h1>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* QRIS Setting Card */}
          <div className="card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                <QrCode size={20} weight="fill" />
              </div>
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>Pengaturan QRIS Toko</h3>
                <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>Ditampilkan saat kasir checkout</p>
              </div>
            </div>
            <input
              type="url"
              placeholder="Masukkan URL gambar QRIS..."
              value={qrisInput}
              onChange={(e) => { setQrisInput(e.target.value); setQrisSaved(false); }}
              className="input"
              style={{ fontSize: "13px", marginBottom: "10px" }}
            />
            <button type="button" onClick={saveQris} className="btn-primary" style={{ fontSize: "13px", padding: "10px 16px" }}>
              {qrisSaved ? "✓ QRIS Tersimpan!" : "Simpan URL QRIS"}
            </button>
          </div>

          {/* Product Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink-primary)" }}>
              Daftar Menu ({state.products.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
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

          {/* Add form modal/box */}
          {showAddForm && (
            <div style={{ padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "var(--r-md)", border: "1.5px solid #86efac", display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ fontSize: "13px", fontWeight: 800, color: "#166534" }}>Tambah Menu Baru</p>
              {([
                { key: "name", label: "Nama Menu", type: "text" },
                { key: "price", label: "Harga Jual (Rp)", type: "number" },
                { key: "stock", label: "Stok Awal", type: "number" },
                { key: "rawMaterialCost", label: "Harga Bahan Baku (HPP)", type: "number" },
                { key: "imageUrl", label: "URL Gambar (opsional)", type: "text" },
              ] as const).map(({ key, label, type }) => (
                <div key={key}>
                  <label style={{ fontSize: "11px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 700 }}>{label}</label>
                  <input
                    type={type}
                    placeholder={label}
                    value={String(newProduct[key])}
                    onChange={(e) => setNewProduct((p) => ({ ...p, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                    className="input"
                    style={{ padding: "8px 12px", fontSize: "13px" }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button type="button" onClick={addProduct} className="btn-primary" style={{ fontSize: "13px", padding: "10px" }}>
                  <Check size={14} weight="bold" /> Simpan Menu
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost" style={{ fontSize: "13px", padding: "10px" }}>
                  <X size={14} weight="bold" /> Batal
                </button>
              </div>
            </div>
          )}

          {/* Product cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {state.products.map((product) => (
              <div key={product.id}>
                {editingId === product.id ? (
                  <EditRow product={product} onSave={saveProduct} onCancel={() => setEditingId(null)} />
                ) : (
                  <div className="card" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px" }}>
                    <div style={{ width: "54px", height: "54px", borderRadius: "var(--r-sm)", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                      <Image src={product.imageUrl} alt={product.name} fill sizes="54px" style={{ objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>{product.name}</p>
                      <p style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 800, marginTop: "1px" }}>{formatRupiah(product.price)}</p>
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
                        onClick={() => setEditingId(product.id)}
                        className="btn-icon"
                        style={{ width: "34px", height: "34px" }}
                        title="Edit"
                      >
                        <PencilSimple size={16} weight="bold" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        className="btn-icon"
                        style={{ width: "34px", height: "34px", color: "#ef4444", borderColor: "#fecaca" }}
                        title="Hapus"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav role="admin" />
    </div>
  );
}
