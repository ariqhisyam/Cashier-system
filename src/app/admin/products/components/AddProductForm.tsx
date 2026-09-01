"use client";
import React from "react";
import { useAddProductForm } from "@/hooks";
import { Check, X, UploadSimple, SpinnerGap, CheckCircle, ImageSquare } from "@phosphor-icons/react";

interface AddProductFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddProductForm({ onClose, onSuccess }: AddProductFormProps) {
  const {
    register,
    errors,
    fileInputRef,
    imagePreview,
    uploadedUrl,
    imageError,
    triggerFileInput,
    handleImageUpload,
    onSubmit,
    isUploading,
    isCreating,
  } = useAddProductForm({ onClose, onSuccess });

  const isBusy = isUploading || isCreating;

  return (
    <form
      onSubmit={onSubmit}
      style={{
        padding: "16px",
        backgroundColor: "#f0fdf4",
        borderRadius: "var(--r-md)",
        border: "1.5px solid #86efac",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: "13px", fontWeight: 800, color: "#166534" }}>
          Tambah Menu Baru (Supabase Storage)
        </p>
        <span
          style={{
            fontSize: "10px",
            padding: "2px 8px",
            borderRadius: "12px",
            backgroundColor: uploadedUrl ? "#dcfce7" : "#fee2e2",
            color: uploadedUrl ? "#15803d" : "#b91c1c",
            fontWeight: 700,
          }}
        >
          {uploadedUrl ? "Foto Terunggah" : "Wajib Upload Foto"}
        </span>
      </div>

      {/* Mandatory Image Uploader */}
      <div>
        <label
          style={{
            fontSize: "11px",
            color: "var(--ink-secondary)",
            display: "block",
            marginBottom: "4px",
            fontWeight: 700,
          }}
        >
          Foto Menu (Wajib Object Storage) *
        </label>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div
            onClick={triggerFileInput}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "var(--r-sm)",
              overflow: "hidden",
              position: "relative",
              backgroundColor: uploadedUrl ? "#dcfce7" : "#f1f5f9",
              border: uploadedUrl ? "2px solid #22c55e" : "2px dashed #cbd5e1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isUploading ? "not-allowed" : "pointer",
              flexShrink: 0,
            }}
          >
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <ImageSquare size={24} color="#94a3b8" />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={isUploading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                backgroundColor: uploadedUrl ? "#ffffff" : "#166534",
                border: uploadedUrl ? "1px solid #86efac" : "none",
                borderRadius: "var(--r-sm)",
                fontSize: "12px",
                fontWeight: 700,
                color: uploadedUrl ? "#166534" : "#ffffff",
                cursor: isUploading ? "not-allowed" : "pointer",
              }}
            >
              {isUploading ? (
                <SpinnerGap size={14} className="animate-spin" />
              ) : (
                <UploadSimple size={14} weight="bold" />
              )}
              <span>
                {isUploading
                  ? "Mengupload ke Supabase..."
                  : uploadedUrl
                  ? "Ganti Foto Menu"
                  : "Pilih Foto Menu (Wajib)"}
              </span>
            </button>

            {uploadedUrl ? (
              <p
                style={{
                  fontSize: "11px",
                  color: "#15803d",
                  fontWeight: 700,
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <CheckCircle size={13} weight="fill" /> Tersimpan di Supabase Storage (.webp)
              </p>
            ) : (
              <p style={{ fontSize: "10px", color: "var(--ink-muted)", marginTop: "3px" }}>
                Format didukung: JPG, PNG, WEBP, AVIF (Auto WebP compression)
              </p>
            )}
          </div>
        </div>
        {imageError && (
          <p style={{ fontSize: "11px", color: "#ef4444", fontWeight: 700, marginTop: "4px" }}>
            {imageError}
          </p>
        )}
      </div>

      {/* Nama Menu */}
      <div>
        <label style={{ fontSize: "11px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 700 }}>
          Nama Menu *
        </label>
        <input
          type="text"
          placeholder="Contoh: Matcha Sakura Latte"
          {...register("name", { required: "Nama menu wajib diisi" })}
          className="input"
          style={{ padding: "8px 12px", fontSize: "13px" }}
        />
        {errors.name && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px" }}>{errors.name.message}</p>}
      </div>

      {/* Harga Jual & Stok */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label style={{ fontSize: "11px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 700 }}>
            Harga Jual (Rp) *
          </label>
          <input
            type="number"
            placeholder="18000"
            {...register("price", { required: "Harga wajib diisi", min: 0 })}
            className="input"
            style={{ padding: "8px 12px", fontSize: "13px" }}
          />
          {errors.price && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px" }}>{errors.price.message}</p>}
        </div>
        <div>
          <label style={{ fontSize: "11px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 700 }}>
            Stok Awal
          </label>
          <input
            type="number"
            placeholder="50"
            {...register("stock", { min: 0 })}
            className="input"
            style={{ padding: "8px 12px", fontSize: "13px" }}
          />
        </div>
      </div>

      {/* HPP */}
      <div>
        <label style={{ fontSize: "11px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 700 }}>
          Harga Bahan Baku (HPP) (Rp)
        </label>
        <input
          type="number"
          placeholder="7500"
          {...register("rawMaterialCost", { min: 0 })}
          className="input"
          style={{ padding: "8px 12px", fontSize: "13px" }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button
          type="submit"
          disabled={isBusy || !uploadedUrl}
          className="btn-primary"
          style={{
            fontSize: "13px",
            padding: "10px",
            flex: 1,
            opacity: !uploadedUrl || isBusy ? 0.6 : 1,
            cursor: !uploadedUrl || isBusy ? "not-allowed" : "pointer",
          }}
        >
          {isCreating ? (
            <SpinnerGap size={14} className="animate-spin" />
          ) : (
            <Check size={14} weight="bold" />
          )}
          <span>{isCreating ? "Menyimpan..." : "Simpan Menu Baru"}</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="btn-ghost"
          style={{ fontSize: "13px", padding: "10px", flex: 1 }}
        >
          <X size={14} weight="bold" /> Batal
        </button>
      </div>
    </form>
  );
}
