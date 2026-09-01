"use client";
import React from "react";
import {
  Key,
  Copy,
  Check,
  ArrowsClockwise,
  Trash,
  PencilSimple,
  ShieldCheck,
  User as UserIcon,
} from "@phosphor-icons/react";
import type { User } from "@/lib/types";
import { formatRupiah } from "@/lib/store";

interface EmployeeCardProps {
  user: User;
  copiedId: string | null;
  onCopyKey: (key: string, id: string) => void;
  onRegenerateKey: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (id: string, name: string) => void;
  isDeleting?: boolean;
}

export default function EmployeeCard({
  user,
  copiedId,
  onCopyKey,
  onRegenerateKey,
  onToggleStatus,
  onEdit,
  onDelete,
  isDeleting = false,
}: EmployeeCardProps) {
  const isCopied = copiedId === user.id;
  const isAdmin = user.role === "ADMIN";

  return (
    <div
      className="card"
      style={{
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        border: user.isActive
          ? "1px solid var(--surface-border)"
          : "1px dashed #cbd5e1",
        opacity: user.isActive ? 1 : 0.75,
        transition: "all 0.2s ease",
      }}
    >
      {/* Top row: Avatar, Info & Status Toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: isAdmin
                ? "#eff6ff"
                : user.isActive
                ? "var(--primary-light)"
                : "#f1f5f9",
              color: isAdmin
                ? "#2563eb"
                : user.isActive
                ? "var(--primary)"
                : "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isAdmin ? (
              <ShieldCheck size={22} weight="fill" />
            ) : (
              <UserIcon size={22} weight="fill" />
            )}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "var(--ink-primary)",
                  lineHeight: 1.2,
                }}
              >
                {user.name}
              </h4>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "9999px",
                  backgroundColor: isAdmin ? "#dbeafe" : "#e2ebe7",
                  color: isAdmin ? "#1d4ed8" : "var(--primary)",
                  textTransform: "uppercase",
                }}
              >
                {user.role}
              </span>
            </div>

            <p
              style={{
                fontSize: "12px",
                color: "var(--primary)",
                fontWeight: 700,
                marginTop: "2px",
              }}
            >
              {user.monthlySalary && user.monthlySalary > 0
                ? `${formatRupiah(user.monthlySalary)} / bln`
                : "Gaji belum diatur"}
            </p>
          </div>
        </div>

        {/* Status Badge & Toggle */}
        <button
          type="button"
          onClick={() => onToggleStatus(user)}
          style={{
            padding: "4px 8px",
            borderRadius: "var(--r-pill)",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            backgroundColor: user.isActive ? "#f0fdf4" : "#fef2f2",
            color: user.isActive ? "#16a34a" : "#dc2626",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          title={user.isActive ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: user.isActive ? "#16a34a" : "#dc2626",
            }}
          />
          <span>{user.isActive ? "Aktif" : "Nonaktif"}</span>
        </button>
      </div>

      {/* Middle row: Access Key Box */}
      <div
        style={{
          backgroundColor: "var(--bg-app)",
          borderRadius: "var(--r-md)",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: "1px solid var(--surface-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Key size={16} color="var(--ink-muted)" weight="bold" />
          <span
            style={{
              fontSize: "13px",
              fontFamily: "var(--font-geist-mono)",
              fontWeight: 700,
              color: "var(--ink-primary)",
              letterSpacing: "0.5px",
            }}
          >
            {user.key}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {/* Copy button */}
          <button
            type="button"
            onClick={() => onCopyKey(user.key, user.id)}
            style={{
              backgroundColor: isCopied ? "var(--primary)" : "var(--surface)",
              color: isCopied ? "#ffffff" : "var(--ink-secondary)",
              border: "1px solid var(--surface-border)",
              borderRadius: "var(--r-xs)",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Salin Kunci Akses"
          >
            {isCopied ? (
              <>
                <Check size={12} weight="bold" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy size={12} weight="bold" />
                <span>Salin</span>
              </>
            )}
          </button>

          {/* Regenerate Key button */}
          <button
            type="button"
            onClick={() => onRegenerateKey(user)}
            className="btn-icon"
            style={{ width: "26px", height: "26px" }}
            title="Buat Kunci Baru"
          >
            <ArrowsClockwise size={13} weight="bold" />
          </button>
        </div>
      </div>

      {/* Bottom row: Edit and Delete actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "8px",
          borderTop: "1px solid var(--surface-border)",
          paddingTop: "10px",
        }}
      >
        <button
          type="button"
          onClick={() => onEdit(user)}
          style={{
            backgroundColor: "transparent",
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--r-pill)",
            padding: "5px 10px",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--ink-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <PencilSimple size={13} weight="bold" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(user.id, user.name)}
          disabled={isDeleting}
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fecaca",
            borderRadius: "var(--r-pill)",
            padding: "5px 10px",
            fontSize: "11px",
            fontWeight: 700,
            color: "#dc2626",
            cursor: isDeleting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Trash size={13} weight="bold" />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
}
