"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Image from "next/image";
import { User, ShieldCheck, ArrowRight, Key, Sparkle } from "@phosphor-icons/react";
import type { Employee } from "@/lib/types";

export default function LoginPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"karyawan" | "admin">("karyawan");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    setError("");

    if (selectedRole === "admin") {
      if (password !== "admin123") {
        setError("Password Admin salah, silakan coba lagi.");
        return;
      }
      dispatch({ type: "LOGIN", payload: { role: "admin" } });
      router.push("/admin");
      return;
    }

    // Role Karyawan
    let targetEmployee: Employee | null = null;
    const matchedEmployee = state.employees.find(
      (emp) => emp.key.trim().toLowerCase() === password.trim().toLowerCase()
    );

    if (matchedEmployee) {
      if (!matchedEmployee.isActive) {
        setError("Akun kasir ini sedang dinonaktifkan oleh Admin.");
        return;
      }
      targetEmployee = matchedEmployee;
    } else if (password === "kyoto123") {
      targetEmployee = { id: "default", name: "Kasir Utama", key: "kyoto123", createdAt: Date.now(), isActive: true };
    }

    if (!targetEmployee) {
      setError("Kunci akses karyawan tidak ditemukan atau salah.");
      return;
    }

    dispatch({ type: "LOGIN", payload: { role: "karyawan", employee: targetEmployee } });
    router.push("/karyawan");
  }

  const activeEmployeesCount = state.employees.filter((e) => e.isActive).length;

  return (
    <div className="page-root">
      {/* Top Banner Image with Japanese aesthetic overlay */}
      <div style={{ position: "relative", height: "300px", width: "100%", overflow: "hidden", flexShrink: 0 }}>
        <Image
          src="/matcha-latte.jpg"
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
            background: "linear-gradient(180deg, rgba(13,26,19,0.3) 0%, rgba(13,26,19,0.85) 100%)",
          }}
        />

        {/* Brand Tag & Title */}
        <div
          style={{
            position: "absolute",
            bottom: "28px",
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
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1.5px solid rgba(255,255,255,0.3)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                backgroundColor: "#0d1a13",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.png" alt="Logo" width={38} height={38} style={{ objectFit: "cover" }} />
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
              fontSize: "26px",
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
      <div
        style={{
          flex: 1,
          backgroundColor: "var(--bg-app)",
          padding: "24px 20px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Role Toggle Selector */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--ink-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "10px",
            }}
          >
            Pilih Peran Masuk
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            {/* Karyawan Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole("karyawan");
                setPassword("");
                setError("");
              }}
              style={{
                padding: "16px 14px",
                borderRadius: "var(--r-lg)",
                backgroundColor: selectedRole === "karyawan" ? "#ffffff" : "var(--surface-subtle)",
                border: selectedRole === "karyawan" ? "2px solid var(--primary)" : "1.5px solid var(--surface-border)",
                boxShadow: selectedRole === "karyawan" ? "var(--shadow-md)" : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "8px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: selectedRole === "karyawan" ? "var(--primary-light)" : "#e6ece8",
                  color: selectedRole === "karyawan" ? "var(--primary)" : "var(--ink-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User size={20} weight={selectedRole === "karyawan" ? "fill" : "regular"} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: selectedRole === "karyawan" ? "var(--ink-primary)" : "var(--ink-secondary)",
                  }}
                >
                  Karyawan
                </p>
                <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
                  {activeEmployeesCount} akun aktif
                </p>
              </div>
            </button>

            {/* Admin Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole("admin");
                setPassword("");
                setError("");
              }}
              style={{
                padding: "16px 14px",
                borderRadius: "var(--r-lg)",
                backgroundColor: selectedRole === "admin" ? "#ffffff" : "var(--surface-subtle)",
                border: selectedRole === "admin" ? "2px solid var(--primary)" : "1.5px solid var(--surface-border)",
                boxShadow: selectedRole === "admin" ? "var(--shadow-md)" : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "8px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: selectedRole === "admin" ? "var(--primary-light)" : "#e6ece8",
                  color: selectedRole === "admin" ? "var(--primary)" : "var(--ink-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheck size={20} weight={selectedRole === "admin" ? "fill" : "regular"} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: selectedRole === "admin" ? "var(--ink-primary)" : "var(--ink-secondary)",
                  }}
                >
                  Administrator
                </p>
                <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
                  Kelola Toko &amp; Staff
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Password / Access Key Input Box */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            htmlFor="password-input"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--ink-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {selectedRole === "admin" ? "Password Administrator" : "Kunci Akses Karyawan (Random Key)"}
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
              id="password-input"
              type="text"
              placeholder={
                selectedRole === "admin"
                  ? "Masukkan password admin (admin123)"
                  : "Masukkan kunci akses (contoh: MK-8842 atau kyoto123)"
              }
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className={`input ${error ? "error" : ""}`}
              style={{
                paddingLeft: "42px",
                fontFamily: selectedRole === "karyawan" ? "var(--font-geist-mono)" : "inherit",
              }}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
              <p style={{ fontSize: "12px", color: "#dc2626", fontWeight: 600, lineHeight: 1.4 }}>
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Login Action Button */}
        <button
          type="button"
          className="btn-primary"
          onClick={handleLogin}
          style={{ marginTop: "4px" }}
        >
          <span>Masuk ke {selectedRole === "admin" ? "Admin" : "Kasir"}</span>
          <ArrowRight size={18} weight="bold" />
        </button>

        </div>
      </div>
  );
}
