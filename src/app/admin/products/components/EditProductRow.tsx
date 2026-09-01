"use client";
import React from "react";
import type { Product } from "@/lib/types";
import { useEditProductRow } from "@/hooks";
import { Check, X, UploadSimple, SpinnerGap, CheckCircle, ImageSquare } from "@phosphor-icons/react";

interface EditProductRowProps {
  product: Product;
  onCancel: () => void;
  onSaved: () => void;
}

export default function EditProductRow({ product, onCancel, onSaved }: EditProductRowProps) {
  const {
    register,
    errors,
    fileInputRef,
    imagePreview,
    uploadedUrl,
    triggerFileInput,
    handleImageUpload,
    onSubmit,
    isUploading,
    isUpdating,
  } = useEditProductRow(product, { onSaved });

  const isBusy = isUploading || isUpdating;

  return (
    <form
      onSubmit={onSubmit}
      style={{
        padding: "16px",
        backgroundColor: "#fffbeb",
        borderRadius: "var(--r-md)",
        border: "1.5px solid #fde68a",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: "13px", fontWeight: 800, color: "#92400e" }}>
          Edit Menu: {product.name}
        </p>
        <span style={{ fontSize: "11px", color: "#b45309", fontWeight: 600 }}>
          ID: {product.id.slice(0, 8)}...
        </span>
      </div>

      {/* Image Upload / Preview */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div
          onClick={triggerFileInput}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--r-sm)",
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#fef3c7",
            border: "1px solid #fde68a",
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
            <ImageSquare size={24} color="#b45309" />
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
              padding: "6px 12px",
              backgroundColor: "#ffffff",
              border: "1px solid #fde68a",
              borderRadius: "var(--r-sm)",
              fontSize: "11px",
              fontWeight: 700,
              color: "#92400e",
              cursor: isUploading ? "not-allowed" : "pointer",
            }}
          >
            {isUploading ? (
              <SpinnerGap size={14} className="animate-spin" />
            ) : (
              <UploadSimple size={14} weight="bold" />
            )}
            <span>{isUploading ? "Mengupload ke Supabase..." : "Ganti Foto (Object Storage)"}</span>
          </button>

          {uploadedUrl && uploadedUrl.includes("supabase.co") && (
            <p
              style={{
                fontSize: "10px",
                color: "#15803d",
                fontWeight: 700,
                marginTop: "3px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <CheckCircle size={12} weight="fill" /> Foto Tersimpan di Supabase Storage (.webp)
            </p>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div>
        <label style={{ fontSize: "11px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 700 }}>
          Nama Menu *
        </label>
        <input
          type="text"
          {...register("name", { required: "Nama menu wajib diisi" })}
          className="input"
          style={{ padding: "8px 12px", fontSize: "13px", backgroundColor: "#ffffff" }}
        />
        {errors.name && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px" }}>{errors.name.message}</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label style={{ fontSize: "11px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 700 }}>
            Harga Jual (Rp) *
          </label>
          <input
            type="number"
            {...register("price", { required: "Harga wajib diisi", min: 0 })}
            className="input"
            style={{ padding: "8px 12px", fontSize: "13px", backgroundColor: "#ffffff" }}
          />
          {errors.price && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px" }}>{errors.price.message}</p>}
        </div>
        <div>
          <label style={{ fontSize: "11px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 700 }}>
            Stok
          </label>
          <input
            type="number"
            {...register("stock", { min: 0 })}
            className="input"
            style={{ padding: "8px 12px", fontSize: "13px", backgroundColor: "#ffffff" }}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: "11px", color: "var(--ink-secondary)", display: "block", marginBottom: "4px", fontWeight: 700 }}>
          Harga Bahan Baku / HPP (Rp)
        </label>
        <input
          type="number"
          {...register("rawMaterialCost", { min: 0 })}
          className="input"
          style={{ padding: "8px 12px", fontSize: "13px", backgroundColor: "#ffffff" }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button
          type="submit"
          disabled={isBusy}
          className="btn-primary"
          style={{ fontSize: "13px", padding: "10px", flex: 1 }}
        >
          {isUpdating ? (
            <SpinnerGap size={14} className="animate-spin" />
          ) : (
            <Check size={14} weight="bold" />
          )}
          <span>{isUpdating ? "Menyimpan..." : "Simpan Perubahan"}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
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
