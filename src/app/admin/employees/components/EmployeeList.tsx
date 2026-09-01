"use client";
import React from "react";
import { Users, WarningCircle, ArrowsClockwise } from "@phosphor-icons/react";
import type { User } from "@/lib/types";
import EmployeeCard from "./EmployeeCard";

interface EmployeeListProps {
  users: User[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  copiedId: string | null;
  onCopyKey: (key: string, id: string) => void;
  onRegenerateKey: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
  onRetry: () => void;
}

export default function EmployeeList({
  users,
  isLoading,
  isError,
  error,
  copiedId,
  onCopyKey,
  onRegenerateKey,
  onToggleStatus,
  onEdit,
  onDelete,
  isDeleting,
  onRetry,
}: EmployeeListProps) {
  // Loading skeleton
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
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "var(--surface-border)",
                  animation: "pulse 1.5s infinite ease-in-out",
                }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <div
                  style={{
                    width: "40%",
                    height: "14px",
                    borderRadius: "4px",
                    backgroundColor: "var(--surface-border)",
                    animation: "pulse 1.5s infinite ease-in-out",
                  }}
                />
                <div
                  style={{
                    width: "25%",
                    height: "12px",
                    borderRadius: "4px",
                    backgroundColor: "var(--surface-border)",
                    animation: "pulse 1.5s infinite ease-in-out",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: "36px",
                borderRadius: "var(--r-md)",
                backgroundColor: "var(--surface-border)",
                animation: "pulse 1.5s infinite ease-in-out",
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div
        className="card"
        style={{
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#dc2626",
          }}
        >
          <WarningCircle size={24} weight="fill" />
        </div>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
          Gagal Memuat Daftar Karyawan
        </p>
        <p style={{ fontSize: "12px", color: "var(--ink-muted)", maxWidth: "260px" }}>
          {error?.message || "Terjadi kesalahan saat menghubungi server."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary"
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            marginTop: "6px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <ArrowsClockwise size={14} weight="bold" />
          <span>Coba Lagi</span>
        </button>
      </div>
    );
  }

  // Empty state
  if (users.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "32px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "var(--bg-app)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-muted)",
          }}
        >
          <Users size={24} weight="duotone" />
        </div>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
          Tidak Ada Data Karyawan
        </p>
        <p style={{ fontSize: "12px", color: "var(--ink-muted)", maxWidth: "240px" }}>
          Belum ada staff yang cocok dengan pencarian Anda.
        </p>
      </div>
    );
  }

  // Users list
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {users.map((user) => (
        <EmployeeCard
          key={user.id}
          user={user}
          copiedId={copiedId}
          onCopyKey={onCopyKey}
          onRegenerateKey={onRegenerateKey}
          onToggleStatus={onToggleStatus}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      ))}
    </div>
  );
}
