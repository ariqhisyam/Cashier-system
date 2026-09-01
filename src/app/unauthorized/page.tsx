"use client";
import React from "react";
import Link from "next/link";
import { ShieldWarning, ArrowLeft, SignOut, Storefront, UserSquare } from "@phosphor-icons/react";
import { useCurrentUser, useLogout } from "@/hooks";

export default function UnauthorizedPage() {
  const { user, isLoading } = useCurrentUser();
  const logoutMutation = useLogout();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-app)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "440px",
          width: "100%",
          padding: "32px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.08)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--surface-border)",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: "#fef2f2",
            border: "2px solid #fecaca",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#dc2626",
          }}
        >
          <ShieldWarning size={38} weight="duotone" />
        </div>

        <div>
          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "var(--r-pill)",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            403 · Akses Ditolak
          </span>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--ink-primary)",
              lineHeight: 1.3,
            }}
          >
            Izin Akses Tidak Mencukupi
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--ink-secondary)",
              marginTop: "8px",
              lineHeight: 1.5,
            }}
          >
            Halaman yang Anda coba tuju dibatasi untuk role tertentu.
            {user ? (
              <>
                {" "}
                Role akun Anda saat ini adalah{" "}
                <strong style={{ color: "var(--primary)" }}>{user.role}</strong>.
              </>
            ) : (
              " Silakan masuk dengan kunci akses yang memiliki hak akses yang sesuai."
            )}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
            marginTop: "6px",
          }}
        >
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="btn-primary"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px",
              }}
            >
              <Storefront size={18} weight="bold" />
              <span>Kembali ke Panel Admin</span>
            </Link>
          )}

          {user?.role === "KARYAWAN" && (
            <Link
              href="/karyawan"
              className="btn-primary"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px",
              }}
            >
              <UserSquare size={18} weight="bold" />
              <span>Kembali ke Kasir POS</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            style={{
              padding: "12px",
              borderRadius: "var(--r-md)",
              border: "1.5px solid var(--surface-border)",
              backgroundColor: "var(--surface)",
              color: "var(--ink-primary)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <SignOut size={16} weight="bold" />
            <span>Ganti Akun / Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
