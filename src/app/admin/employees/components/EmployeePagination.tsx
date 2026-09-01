"use client";
import React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface EmployeePaginationProps {
  page: number;
  totalPages: number;
  totalUsers: number;
  limit?: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPageChange: (newPage: number) => void;
  isPlaceholderData?: boolean;
}

export default function EmployeePagination({
  page,
  totalPages,
  totalUsers,
  limit = 4,
  hasPrevPage,
  hasNextPage,
  onPageChange,
  isPlaceholderData = false,
}: EmployeePaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalUsers);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        backgroundColor: "var(--surface)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--surface-border)",
        marginTop: "2px",
      }}
    >
      {/* Items Range Info */}
      <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600 }}>
        {startItem}-{endItem} dari {totalUsers} staff
      </p>

      {/* Pagination Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {/* Previous Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage || isPlaceholderData}
          className="btn-icon"
          style={{
            width: "30px",
            height: "30px",
            opacity: !hasPrevPage ? 0.4 : 1,
            cursor: !hasPrevPage ? "not-allowed" : "pointer",
          }}
          title="Halaman Sebelumnya"
        >
          <CaretLeft size={14} weight="bold" />
        </button>

        {/* Page Numbers */}
        <div style={{ display: "flex", gap: "4px" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              disabled={isPlaceholderData}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--r-xs)",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: p === page ? "var(--primary)" : "var(--bg-app)",
                color: p === page ? "#ffffff" : "var(--ink-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage || isPlaceholderData}
          className="btn-icon"
          style={{
            width: "30px",
            height: "30px",
            opacity: !hasNextPage ? 0.4 : 1,
            cursor: !hasNextPage ? "not-allowed" : "pointer",
          }}
          title="Halaman Berikutnya"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}
