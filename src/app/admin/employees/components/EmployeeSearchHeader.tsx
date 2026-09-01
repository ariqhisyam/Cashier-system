"use client";
import React from "react";
import { MagnifyingGlass, UserPlus, X } from "@phosphor-icons/react";

interface EmployeeSearchHeaderProps {
  totalUsers: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
}

export default function EmployeeSearchHeader({
  totalUsers,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
}: EmployeeSearchHeaderProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Top action row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: "var(--ink-primary)",
              lineHeight: 1.2,
            }}
          >
            Daftar Karyawan
          </h2>
          <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
            Total {totalUsers} staff terdaftar
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          style={{
            backgroundColor: "var(--primary)",
            color: "#ffffff",
            border: "none",
            borderRadius: "var(--r-pill)",
            padding: "8px 14px",
            fontSize: "12px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(30,112,72,0.25)",
            transition: "transform 0.15s ease",
          }}
        >
          <UserPlus size={15} weight="bold" />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: "relative", width: "100%" }}>
        <div
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--ink-muted)",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <MagnifyingGlass size={16} weight="bold" />
        </div>

        <input
          type="text"
          placeholder="Cari nama karyawan atau kunci akses..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input"
          style={{
            paddingLeft: "36px",
            paddingRight: searchQuery ? "34px" : "12px",
            height: "40px",
            fontSize: "13px",
            backgroundColor: "var(--surface)",
          }}
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-muted)",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Hapus pencarian"
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}
