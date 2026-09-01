"use client";
import React, { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks";

export default function KaryawanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const { isAuthorized, isLoading } = useRequireAuth(["KARYAWAN", "ADMIN"]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent SSR hydration mismatch and guard unauthorized access with loading indicator
  if (!isMounted || isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d1a13",
          color: "#52b788",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid rgba(82, 183, 136, 0.2)",
              borderTopColor: "#52b788",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#a3b899" }}>Memuat Kasir...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
