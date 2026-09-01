"use client";
import React, { useState } from "react";
import {
  X,
  Key,
  ArrowsClockwise,
  PencilSimple,
  ShieldCheck,
  User as UserIcon,
} from "@phosphor-icons/react";
import { generateEmployeeKey, formatRupiah } from "@/lib/store";
import { useUpdateUser } from "@/hooks/useUsers";
import type { User, UserRole } from "@/lib/types";

interface EditEmployeeModalProps {
  user: User;
  onClose: () => void;
  onSuccess: (name: string) => void;
  onError: (msg: string) => void;
}

export default function EditEmployeeModal({
  user,
  onClose,
  onSuccess,
  onError,
}: EditEmployeeModalProps) {
  const [name, setName] = useState(user.name);
  const [key, setKey] = useState(user.key);
  const [role, setRole] = useState<UserRole>(user.role || "KARYAWAN");
  const [monthlySalary, setMonthlySalary] = useState(
    user.monthlySalary ? String(user.monthlySalary) : ""
  );
  const [isActive, setIsActive] = useState(user.isActive);

  const updateUserMutation = useUpdateUser();

  function handleRegenerateKey() {
    setKey(generateEmployeeKey());
  }

  function handleSalaryChange(val: string) {
    const raw = val.replace(/\D/g, "");
    setMonthlySalary(raw);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      onError("Nama karyawan wajib diisi.");
      return;
    }
    if (!key.trim()) {
      onError("Kunci akses login wajib diisi.");
      return;
    }

    const salaryNum = monthlySalary ? parseInt(monthlySalary, 10) : 0;

    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          name: name.trim(),
          key: key.trim(),
          role,
          monthlySalary: salaryNum,
          isActive,
        },
      });

      onSuccess(name.trim());
      onClose();
    } catch (err: any) {
      onError(err?.response?.data?.message || err.message || "Gagal memperbarui karyawan.");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="drag-handle" />

        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "var(--primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              <PencilSimple size={20} weight="bold" />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)" }}>
                Edit Data Karyawan
              </h3>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                Ubah informasi profil, role, atau gaji staff
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ width: "32px", height: "32px" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Role selector */}
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--ink-secondary)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Role Pengguna
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setRole("KARYAWAN")}
                style={{
                  padding: "10px",
                  borderRadius: "var(--r-md)",
                  border: `1.5px solid ${role === "KARYAWAN" ? "var(--primary)" : "var(--surface-border)"}`,
                  backgroundColor: role === "KARYAWAN" ? "var(--primary-light)" : "var(--surface)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: role === "KARYAWAN" ? "var(--primary)" : "var(--ink-secondary)",
                }}
              >
                <UserIcon size={16} weight={role === "KARYAWAN" ? "fill" : "bold"} />
                <span>Kasir (Karyawan)</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                style={{
                  padding: "10px",
                  borderRadius: "var(--r-md)",
                  border: `1.5px solid ${role === "ADMIN" ? "#2563eb" : "var(--surface-border)"}`,
                  backgroundColor: role === "ADMIN" ? "#eff6ff" : "var(--surface)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: role === "ADMIN" ? "#2563eb" : "var(--ink-secondary)",
                }}
              >
                <ShieldCheck size={16} weight={role === "ADMIN" ? "fill" : "bold"} />
                <span>Admin Toko</span>
              </button>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--ink-secondary)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>

          {/* Key Input */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)" }}>
                Kunci Akses
              </label>
              <button
                type="button"
                onClick={handleRegenerateKey}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--primary)",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  cursor: "pointer",
                }}
              >
                <ArrowsClockwise size={12} weight="bold" />
                <span>Acak Kunci Baru</span>
              </button>
            </div>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="input"
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
              required
            />
          </div>

          {/* Monthly Salary Input */}
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--ink-secondary)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Gaji Pokok Bulanan (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 2500000"
              value={monthlySalary ? formatRupiah(parseInt(monthlySalary, 10)) : ""}
              onChange={(e) => handleSalaryChange(e.target.value)}
              className="input"
            />
          </div>

          {/* Active status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "var(--bg-app)", borderRadius: "var(--r-md)", border: "1px solid var(--surface-border)" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)" }}>Status Keaktifan Akun</p>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>Staff nonaktif tidak bisa login ke kasir</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--r-pill)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                backgroundColor: isActive ? "#f0fdf4" : "#fef2f2",
                color: isActive ? "#16a34a" : "#dc2626",
              }}
            >
              {isActive ? "Aktif" : "Nonaktif"}
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updateUserMutation.isPending}
              className="btn-primary"
              style={{ flex: 2 }}
            >
              {updateUserMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
