"use client";
import { useState } from "react";
import Image from "next/image";
import { Key, Sparkle, ArrowRight, SpinnerGap, User, ShieldCheck } from "@phosphor-icons/react";
import { useLogin } from "@/hooks";

type RoleSelection = "karyawan" | "admin";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<RoleSelection>("karyawan");
  const [keyInput, setKeyInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const loginMutation = useLogin();

  async function handleLoginSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErrorMessage("");

    const trimmedKey = keyInput.trim();
    if (!trimmedKey) {
      setErrorMessage(
        selectedRole === "admin"
          ? "Silakan masukkan Kunci Akses Admin Anda."
          : "Silakan masukkan Kunci Akses Karyawan Anda."
      );
      return;
    }

    loginMutation.mutate(
      {
        key: trimmedKey,
        role: selectedRole === "admin" ? "ADMIN" : "KARYAWAN",
      },
      {
        onSuccess: () => {
          setKeyInput("");
        },
        onError: (err: any) => {
          setErrorMessage(
            err?.message || "Kunci akses tidak valid untuk peran yang dipilih."
          );
        },
      }
    );
  }

  return (
    <div className="page-root">
      {/* Top Banner Image with Japanese aesthetic overlay */}
      <div
        style={{
          position: "relative",
          height: "260px",
          width: "100%",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Image
          src="https://llyeovbymplgfalfxbrd.supabase.co/storage/v1/object/public/Cashier-system-img/products/25ea66fc-e203-405f-9484-8783069a9bd4.webp"
          alt="Matcha Kyoto Cafe"
          fill
          priority
          style={{ objectFit: "cover" }}
        />
        {/* Soft gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(13,26,19,0.3) 0%, rgba(13,26,19,0.9) 100%)",
          }}
        />

        {/* Brand Tag & Title */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            right: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1.5px solid rgba(255,255,255,0.3)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                backgroundColor: "#0d1a13",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.png"
                alt="Logo"
                width={36}
                height={36}
                style={{ objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "9999px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                color: "#eaf7f0",
                fontSize: "12px",
                fontWeight: 600,
                width: "fit-content",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <Sparkle size={14} weight="fill" color="#52b788" />
              <span>4rq Cashier System</span>
            </div>
          </div>

          <h1
            style={{
              color: "#ffffff",
              fontSize: "22px",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
            }}
          >
            Point Of Sale By 4rq
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px" }}>
            Sistem Kasir &amp; Manajemen Penjualan
          </p>
        </div>
      </div>

      {/* Main Form Sheet */}
      <form
        onSubmit={handleLoginSubmit}
        style={{
          flex: 1,
          backgroundColor: "var(--bg-app)",
          padding: "20px 20px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* Role Selector Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--ink-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Pilih Peran Masuk
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {/* Karyawan Card */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole("karyawan");
                setErrorMessage("");
              }}
              style={{
                backgroundColor:
                  selectedRole === "karyawan" ? "#ffffff" : "var(--surface)",
                border:
                  selectedRole === "karyawan"
                    ? "2px solid #1e7048"
                    : "1px solid var(--surface-border)",
                borderRadius: "16px",
                padding: "16px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "8px",
                cursor: "pointer",
                textAlign: "left",
                boxShadow:
                  selectedRole === "karyawan"
                    ? "0 4px 14px rgba(30, 112, 72, 0.12)"
                    : "none",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor:
                    selectedRole === "karyawan" ? "#eaf7f0" : "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: selectedRole === "karyawan" ? "#1e7048" : "#64748b",
                }}
              >
                <User size={20} weight="fill" />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--ink-primary)",
                  }}
                >
                  Karyawan
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--ink-muted)",
                    marginTop: "2px",
                  }}
                >
                  Akses Kasir &amp; Shift
                </p>
              </div>
            </button>

            {/* Admin Card */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole("admin");
                setErrorMessage("");
              }}
              style={{
                backgroundColor:
                  selectedRole === "admin" ? "#ffffff" : "var(--surface)",
                border:
                  selectedRole === "admin"
                    ? "2px solid #1e7048"
                    : "1px solid var(--surface-border)",
                borderRadius: "16px",
                padding: "16px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "8px",
                cursor: "pointer",
                textAlign: "left",
                boxShadow:
                  selectedRole === "admin"
                    ? "0 4px 14px rgba(30, 112, 72, 0.12)"
                    : "none",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor:
                    selectedRole === "admin" ? "#eaf7f0" : "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: selectedRole === "admin" ? "#1e7048" : "#64748b",
                }}
              >
                <ShieldCheck size={20} weight="bold" />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--ink-primary)",
                  }}
                >
                  Administrator
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--ink-muted)",
                    marginTop: "2px",
                  }}
                >
                  Kelola Toko &amp; Staff
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Access Key Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            htmlFor="key-input"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--ink-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {selectedRole === "admin"
              ? "Kunci Akses Admin *"
              : "Kunci Akses Karyawan (Random Key) *"}
          </label>

          <div style={{ position: "relative" }}>
            <Key
              size={18}
              color="var(--ink-muted)"
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              id="key-input"
              type="password"
              placeholder={
                selectedRole === "admin"
                  ? "Masukkan kunci akses admin"
                  : "Masukkan kunci akses (contoh: MK-8842)"
              }
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setErrorMessage("");
              }}
              className={`input ${errorMessage ? "error" : ""}`}
              style={{
                paddingLeft: "42px",
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "1px",
              }}
              autoFocus
              autoComplete="off"
            />
          </div>

          {errorMessage && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "var(--r-md)",
                padding: "10px 12px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#dc2626",
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {errorMessage}
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary"
          disabled={loginMutation.isPending}
          style={{
            marginTop: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loginMutation.isPending ? (
            <>
              <SpinnerGap size={18} className="animate-spin" />
              <span>Memverifikasi Akses...</span>
            </>
          ) : (
            <>
              <span>
                {selectedRole === "admin" ? "Masuk ke Admin" : "Masuk ke Kasir"}
              </span>
              <ArrowRight size={18} weight="bold" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
