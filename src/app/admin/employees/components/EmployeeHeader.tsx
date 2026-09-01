"use client";
import React from "react";
import { Users, Compass, Clock, ArrowsClockwise } from "@phosphor-icons/react";
import type { AdminStaffTab } from "@/hooks/useAdminEmployees";

interface EmployeeHeaderProps {
  activeTab: AdminStaffTab;
  onTabChange: (tab: AdminStaffTab) => void;
  onRefresh?: () => void;
}

export default function EmployeeHeader({
  activeTab,
  onTabChange,
  onRefresh,
}: EmployeeHeaderProps) {
  return (
    <header
      style={{
        backgroundColor: "var(--surface)",
        padding: "20px 20px 14px",
        borderBottom: "1px solid var(--surface-border)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <p
            style={{
              fontSize: "11px",
              color: "var(--ink-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            4rq cashier system
          </p>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--ink-primary)",
              letterSpacing: "-0.5px",
            }}
          >
            Manajemen Staff &amp; Presensi
          </h1>
        </div>

        {onRefresh && activeTab === "employees" && (
          <button
            type="button"
            className="btn-icon"
            onClick={onRefresh}
            title="Muat Ulang Data"
            style={{ width: "32px", height: "32px" }}
          >
            <ArrowsClockwise size={16} />
          </button>
        )}
      </div>

      {/* 3-Tab Pill Switcher */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          backgroundColor: "var(--bg-app)",
          borderRadius: "var(--r-pill)",
          padding: "3px",
          gap: "2px",
        }}
      >
        <button
          type="button"
          onClick={() => onTabChange("employees")}
          style={{
            padding: "7px 0",
            fontSize: "11px",
            fontWeight: 700,
            borderRadius: "var(--r-pill)",
            border: "none",
            cursor: "pointer",
            backgroundColor: activeTab === "employees" ? "#ffffff" : "transparent",
            color: activeTab === "employees" ? "var(--primary)" : "var(--ink-secondary)",
            boxShadow: activeTab === "employees" ? "var(--shadow-sm)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            transition: "all 0.15s ease",
          }}
        >
          <Users size={14} weight={activeTab === "employees" ? "fill" : "bold"} />
          <span>Karyawan</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("geofencing")}
          style={{
            padding: "7px 0",
            fontSize: "11px",
            fontWeight: 700,
            borderRadius: "var(--r-pill)",
            border: "none",
            cursor: "pointer",
            backgroundColor: activeTab === "geofencing" ? "#ffffff" : "transparent",
            color: activeTab === "geofencing" ? "var(--primary)" : "var(--ink-secondary)",
            boxShadow: activeTab === "geofencing" ? "var(--shadow-sm)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            transition: "all 0.15s ease",
          }}
        >
          <Compass size={14} weight={activeTab === "geofencing" ? "fill" : "bold"} />
          <span>Geofence</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("attendance")}
          style={{
            padding: "7px 0",
            fontSize: "11px",
            fontWeight: 700,
            borderRadius: "var(--r-pill)",
            border: "none",
            cursor: "pointer",
            backgroundColor: activeTab === "attendance" ? "#ffffff" : "transparent",
            color: activeTab === "attendance" ? "var(--primary)" : "var(--ink-secondary)",
            boxShadow: activeTab === "attendance" ? "var(--shadow-sm)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            transition: "all 0.15s ease",
          }}
        >
          <Clock size={14} weight={activeTab === "attendance" ? "fill" : "bold"} />
          <span>Presensi</span>
        </button>
      </div>
    </header>
  );
}
