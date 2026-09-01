"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, generateEmployeeKey } from "@/lib/store";
import type { Employee, OutletLocation, AttendanceRecord } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import { getCurrentPositionAsync } from "@/lib/geo";
import {
  Plus,
  Key,
  Copy,
  Check,
  ArrowsClockwise,
  Trash,
  UserPlus,
  X,
  ShieldCheck,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  NavigationArrow,
  SlidersHorizontal,
  Users,
  Compass,
  ArrowSquareOut,
} from "@phosphor-icons/react";

function formatDate(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEmployeesPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();

  // Active Tab: "employees" | "geofencing" | "attendance"
  const [activeTab, setActiveTab] = useState<"employees" | "geofencing" | "attendance">("employees");

  // Employee Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Geofencing state
  const [geoEnabled, setGeoEnabled] = useState(state.outletLocation?.isEnabled ?? true);
  const [geoAddress, setGeoAddress] = useState(state.outletLocation?.addressName ?? "Outlet 4rq Cashier - Pontianak");
  const [geoLat, setGeoLat] = useState(String(state.outletLocation?.latitude ?? -0.026330));
  const [geoLng, setGeoLng] = useState(String(state.outletLocation?.longitude ?? 109.342503));
  const [geoRadius, setGeoRadius] = useState(state.outletLocation?.radiusMeters ?? 100);
  const [isGettingCurrentGps, setIsGettingCurrentGps] = useState(false);
  const [geoSavedToast, setGeoSavedToast] = useState(false);

  useEffect(() => {
    if (state.session !== "admin") router.replace("/");
  }, [state.session, router]);

  useEffect(() => {
    if (state.outletLocation) {
      setGeoEnabled(state.outletLocation.isEnabled);
      setGeoAddress(state.outletLocation.addressName ?? "Outlet 4rq Cashier - Pontianak");
      setGeoLat(String(state.outletLocation.latitude));
      setGeoLng(String(state.outletLocation.longitude));
      setGeoRadius(state.outletLocation.radiusMeters);
    }
  }, [state.outletLocation]);

  if (state.session !== "admin") return null;

  function openAddModal() {
    setName("");
    setMonthlySalary("");
    setGeneratedKey(generateEmployeeKey());
    setShowAddModal(true);
  }

  function handleRegenerateModalKey() {
    setGeneratedKey(generateEmployeeKey());
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Kunci akses "${text}" berhasil disalin!`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleSaveEmployee() {
    if (!name.trim()) return;
    const salary = parseInt(monthlySalary.replace(/\D/g, ""), 10) || 0;
    const newEmp: Employee = {
      id: crypto.randomUUID(),
      name: name.trim(),
      key: generatedKey,
      createdAt: Date.now(),
      isActive: true,
      monthlySalary: salary > 0 ? salary : undefined,
    };
    dispatch({ type: "ADD_EMPLOYEE", payload: newEmp });
    setShowAddModal(false);
    copyToClipboard(newEmp.key, newEmp.id);
    showToast(`Karyawan "${newEmp.name}" berhasil dibuat & kunci disalin!`);
  }

  function handleRegenerateExistingKey(emp: Employee) {
    const newKey = generateEmployeeKey();
    const updated = { ...emp, key: newKey };
    dispatch({ type: "UPDATE_EMPLOYEE", payload: updated });
    copyToClipboard(newKey, emp.id);
    showToast(`Kunci baru "${newKey}" untuk ${emp.name} berhasil dibuat & disalin!`);
  }

  function handleToggleStatus(id: string) {
    dispatch({ type: "TOGGLE_EMPLOYEE_STATUS", payload: id });
  }

  function handleDelete(id: string, empName: string) {
    if (confirm(`Hapus akses karyawan "${empName}"?`)) {
      dispatch({ type: "DELETE_EMPLOYEE", payload: id });
      showToast(`Karyawan "${empName}" dihapus.`);
    }
  }

  // Geofencing Actions
  async function handleGetCurrentGps() {
    setIsGettingCurrentGps(true);
    try {
      const coords = await getCurrentPositionAsync();
      setGeoLat(coords.latitude.toFixed(6));
      setGeoLng(coords.longitude.toFixed(6));
      showToast(`📍 Koordinat GPS perangkat Anda berhasil diambil (Akurasi: ±${Math.round(coords.accuracy)}m)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengambil lokasi GPS.";
      showToast(`⚠️ ${msg}`);
    } finally {
      setIsGettingCurrentGps(false);
    }
  }

  function handleSaveGeofencing() {
    const lat = parseFloat(geoLat);
    const lng = parseFloat(geoLng);
    if (isNaN(lat) || isNaN(lng)) {
      showToast("⚠️ Format Latitude atau Longitude tidak valid.");
      return;
    }
    const updatedLocation: OutletLocation = {
      latitude: lat,
      longitude: lng,
      radiusMeters: geoRadius,
      isEnabled: geoEnabled,
      addressName: geoAddress.trim() || "Outlet 4rq Cashier",
    };
    dispatch({ type: "SET_OUTLET_LOCATION", payload: updatedLocation });
    setGeoSavedToast(true);
    showToast("✅ Pengaturan Lokasi Outlet & Geofencing berhasil disimpan!");
    setTimeout(() => setGeoSavedToast(false), 2000);
  }

  function handleDeleteAttendance(id: string) {
    if (confirm("Hapus catatan presensi ini?")) {
      dispatch({ type: "DELETE_ATTENDANCE_RECORD", payload: id });
      showToast("Catatan presensi dihapus.");
    }
  }

  return (
    <div className="page-root">
      <div className="page-content">
        {/* Header */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            padding: "20px 20px 14px",
            borderBottom: "1px solid var(--surface-border)",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            4rq cashier system
          </p>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.5px", marginBottom: "12px" }}>
            Manajemen Staff &amp; Presensi
          </h1>

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
              onClick={() => setActiveTab("employees")}
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
              onClick={() => setActiveTab("geofencing")}
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
              onClick={() => setActiveTab("attendance")}
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
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Toast Notification */}
          {toastMessage && (
            <div
              style={{
                backgroundColor: "var(--ink-primary)",
                color: "#ffffff",
                padding: "10px 14px",
                borderRadius: "var(--r-md)",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.15)",
                animation: "slideUp 0.2s ease",
              }}
            >
              <CheckCircle size={18} color="#52b788" weight="fill" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* TAB 1: KARYAWAN & ACCESS KEYS */}
          {activeTab === "employees" && (
            <>
              {/* Hero Action Card */}
              <div
                style={{
                  backgroundColor: "var(--primary)",
                  borderRadius: "var(--r-lg)",
                  padding: "18px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 8px 20px rgba(30,112,72,0.25)",
                }}
              >
                <div>
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", fontWeight: 600 }}>
                    Total Karyawan Aktif
                  </p>
                  <p style={{ color: "#ffffff", fontSize: "28px", fontWeight: 800, marginTop: "2px" }}>
                    {state.employees.filter((e) => e.isActive).length}
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.7)", marginLeft: "6px" }}>
                      / {state.employees.length} terdaftar
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddModal}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "var(--primary)",
                    border: "none",
                    borderRadius: "var(--r-pill)",
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <Plus size={16} weight="bold" />
                  <span>Buat Baru</span>
                </button>
              </div>

              {/* List Section Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
                  Daftar Karyawan &amp; Kunci Akses
                </h3>
                <span style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                  Klik salin untuk membagikan key
                </span>
              </div>

              {/* Employee Cards List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "20px" }}>
                {state.employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="card"
                    style={{
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      border: emp.isActive ? "1px solid var(--surface-border)" : "1px dashed #cbd5e1",
                      opacity: emp.isActive ? 1 : 0.75,
                    }}
                  >
                    {/* Top Info Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            backgroundColor: emp.isActive ? "var(--primary-light)" : "#f1f5f9",
                            color: emp.isActive ? "var(--primary)" : "#64748b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "14px",
                          }}
                        >
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)" }}>
                              {emp.name}
                            </p>
                            {!emp.isActive && (
                              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "9999px", backgroundColor: "#fee2e2", color: "#dc2626", fontWeight: 700 }}>
                                Nonaktif
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
                            Dibuat: {formatDate(emp.createdAt)}
                          </p>
                          {emp.monthlySalary ? (
                            <p style={{ fontSize: "11px", marginTop: "1px", color: "var(--primary)", fontWeight: 700 }}>
                              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(emp.monthlySalary)}/bln
                              <span style={{ color: "var(--ink-muted)", fontWeight: 500 }}>{" · Rp "}{Math.round(emp.monthlySalary / 30).toLocaleString("id-ID")}{"/hari"}</span>
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Toggle Active Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(emp.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: emp.isActive ? "var(--primary)" : "#64748b",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title={emp.isActive ? "Nonaktifkan karyawan" : "Aktifkan karyawan"}
                      >
                        {emp.isActive ? (
                          <CheckCircle size={18} weight="fill" color="var(--primary)" />
                        ) : (
                          <XCircle size={18} weight="fill" color="#94a3b8" />
                        )}
                        <span>{emp.isActive ? "Aktif" : "Nonaktif"}</span>
                      </button>
                    </div>

                    {/* Key Chip & Actions Row */}
                    <div
                      style={{
                        backgroundColor: "var(--bg-app)",
                        borderRadius: "var(--r-md)",
                        padding: "8px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Key size={16} color="var(--ink-muted)" weight="bold" />
                        <div>
                          <p style={{ fontSize: "10px", color: "var(--ink-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                            Kunci Login Kasir
                          </p>
                          <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "1px", fontFamily: "var(--font-geist-mono)" }}>
                            {emp.key}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(emp.key, emp.id)}
                          className="btn-icon"
                          style={{
                            width: "32px",
                            height: "32px",
                            backgroundColor: copiedId === emp.id ? "var(--primary)" : "var(--surface)",
                            color: copiedId === emp.id ? "#ffffff" : "var(--ink-primary)",
                          }}
                          title="Salin Kunci"
                        >
                          {copiedId === emp.id ? <Check size={14} weight="bold" /> : <Copy size={14} />}
                        </button>

                        {/* Regenerate Key Button */}
                        <button
                          type="button"
                          onClick={() => handleRegenerateExistingKey(emp)}
                          className="btn-icon"
                          style={{ width: "32px", height: "32px" }}
                          title="Generate Ulang Kunci Acak"
                        >
                          <ArrowsClockwise size={14} weight="bold" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(emp.id, emp.name)}
                          className="btn-icon"
                          style={{ width: "32px", height: "32px", color: "#ef4444", borderColor: "#fecaca" }}
                          title="Hapus Karyawan"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TAB 2: GEOFENCING & LOKASI OUTLET */}
          {activeTab === "geofencing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingBottom: "20px" }}>
              {/* Geofence Status Toggle Card */}
              <div
                className="card"
                style={{
                  padding: "16px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: geoEnabled ? "1.5px solid var(--primary)" : "1px solid var(--surface-border)",
                  backgroundColor: geoEnabled ? "var(--primary-light)" : "var(--surface)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      backgroundColor: geoEnabled ? "var(--primary)" : "#e2e8f0",
                      color: geoEnabled ? "#ffffff" : "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Compass size={22} weight="fill" />
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
                      Pembatasan Lokasi GPS
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
                      {geoEnabled ? "Kasir hanya bisa login di area outlet" : "Login kasir bebas dari lokasi mana saja"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setGeoEnabled(!geoEnabled)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--r-pill)",
                    fontSize: "12px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: geoEnabled ? "var(--primary)" : "#cbd5e1",
                    color: "#ffffff",
                    transition: "all 0.15s ease",
                  }}
                >
                  {geoEnabled ? "AKTIF" : "NONAKTIF"}
                </button>
              </div>

              {/* Location Configuration Card */}
              <div className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
                  Titik Koordinat Outlet
                </h4>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                    Nama Outlet / Toko
                  </label>
                  <input
                    type="text"
                    value={geoAddress}
                    onChange={(e) => setGeoAddress(e.target.value)}
                    className="input"
                    style={{ fontSize: "13px" }}
                    placeholder="Contoh: Outlet 4rq Cashier - Pontianak"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={geoLat}
                      onChange={(e) => setGeoLat(e.target.value)}
                      className="input"
                      style={{ fontSize: "13px", fontFamily: "var(--font-geist-mono)" }}
                      placeholder="-0.026330"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "4px" }}>
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={geoLng}
                      onChange={(e) => setGeoLng(e.target.value)}
                      className="input"
                      style={{ fontSize: "13px", fontFamily: "var(--font-geist-mono)" }}
                      placeholder="109.342503"
                    />
                  </div>
                </div>

                {/* Auto Pick Location Button */}
                <button
                  type="button"
                  onClick={handleGetCurrentGps}
                  disabled={isGettingCurrentGps}
                  className="btn-ghost"
                  style={{ fontSize: "12px", padding: "10px 14px", display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }}
                >
                  <NavigationArrow size={16} weight="fill" color="var(--primary)" />
                  <span>{isGettingCurrentGps ? "Mengambil GPS Perangkat..." : "Gunakan Lokasi Perangkat Saya Saat Ini"}</span>
                </button>

                {/* Radius Selector */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                    Radius Toleransi Presensi
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
                    {[50, 100, 200, 500].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setGeoRadius(r)}
                        style={{
                          padding: "8px 0",
                          borderRadius: "var(--r-md)",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          border: geoRadius === r ? "2px solid var(--primary)" : "1px solid var(--surface-border)",
                          backgroundColor: geoRadius === r ? "var(--primary-light)" : "var(--surface)",
                          color: geoRadius === r ? "var(--primary)" : "var(--ink-secondary)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {r}m
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: "10px", color: "var(--ink-muted)", marginTop: "4px" }}>
                    *Rekomendasi: 100m untuk mengantisipasi deviasi sinyal GPS saat di dalam ruko.
                  </p>
                </div>

                {/* View on Google Maps Link */}
                {geoLat && geoLng && (
                  <a
                    href={`https://www.google.com/maps?q=${geoLat},${geoLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11px",
                      color: "var(--primary)",
                      fontWeight: 700,
                      textDecoration: "none",
                      padding: "8px 10px",
                      backgroundColor: "var(--bg-app)",
                      borderRadius: "var(--r-md)",
                    }}
                  >
                    <ArrowSquareOut size={16} />
                    <span>Lihat Titik Koordinat di Google Maps</span>
                  </a>
                )}

                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSaveGeofencing}
                  className="btn-primary"
                  style={{ marginTop: "4px" }}
                >
                  <Check size={16} weight="bold" />
                  <span>Simpan Pengaturan Lokasi</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: LOG PRESENSI & KEHADIRAN KARYAWAN */}
          {activeTab === "attendance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
                  Riwayat Presensi Masuk &amp; Pulang
                </h3>
                <span style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                  {state.attendanceRecords?.length || 0} catatan
                </span>
              </div>

              {(!state.attendanceRecords || state.attendanceRecords.length === 0) ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-muted)" }}>
                  <Clock size={36} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                  <p style={{ fontSize: "14px", fontWeight: 600 }}>Belum ada riwayat presensi</p>
                  <p style={{ fontSize: "11px", marginTop: "2px" }}>Catatan jam masuk &amp; pulang kasir akan muncul di sini saat karyawan login dan tutup shift.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {state.attendanceRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="card"
                      style={{
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink-primary)" }}>
                              {rec.employeeName}
                            </p>
                            <span style={{
                              fontSize: "10px", padding: "1px 6px", borderRadius: "9999px", fontWeight: 700,
                              backgroundColor: rec.clockOut ? "#f1f5f9" : "#dcfce7",
                              color: rec.clockOut ? "#475569" : "#15803d",
                            }}>
                              {rec.clockOut ? "Shift Selesai" : "🟢 Sedang Bertugas"}
                            </span>
                          </div>
                          <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "1px" }}>
                            {formatDate(rec.clockIn)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAttendance(rec.id)}
                          className="btn-icon"
                          style={{ width: "26px", height: "26px", color: "#94a3b8" }}
                          title="Hapus log"
                        >
                          <Trash size={12} />
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                        <div style={{ backgroundColor: "#f8fafc", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--surface-border)" }}>
                          <p style={{ fontSize: "9px", color: "var(--ink-muted)", textTransform: "uppercase", fontWeight: 700 }}>Jam Masuk (Clock-in)</p>
                          <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--primary)", marginTop: "1px" }}>{formatTime(rec.clockIn)} WIB</p>
                        </div>
                        <div style={{ backgroundColor: "#f8fafc", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--surface-border)" }}>
                          <p style={{ fontSize: "9px", color: "var(--ink-muted)", textTransform: "uppercase", fontWeight: 700 }}>Jam Pulang (Clock-out)</p>
                          <p style={{ fontSize: "13px", fontWeight: 800, color: rec.clockOut ? "var(--ink-primary)" : "#94a3b8", marginTop: "1px" }}>
                            {rec.clockOut ? `${formatTime(rec.clockOut)} WIB` : "Belum Tutup"}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "var(--ink-muted)", paddingTop: "2px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <MapPin size={12} color="var(--primary)" weight="fill" />
                          <span>Jarak: {rec.distanceMeters}m dari outlet</span>
                        </span>
                        {rec.latitude && rec.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}
                          >
                            Cek Peta
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Generate Karyawan Baru Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="drag-handle" />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                  <UserPlus size={20} weight="fill" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)" }}>
                    Generate Karyawan Baru
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                    Buat akun kasir dengan kunci akses unik
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-icon"
                style={{ width: "30px", height: "30px" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Nama Input */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                  Nama Lengkap Karyawan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Siti Rahma, Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  autoFocus
                />
              </div>

              {/* Gaji Bulanan */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                  Gaji Bulanan <span style={{ fontWeight: 500, color: "var(--ink-muted)" }}>(Opsional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontWeight: 700, color: "var(--ink-muted)" }}>
                    Rp
                  </span>
                  <input
                    type="number"
                    placeholder="1500000"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    className="input"
                    style={{ paddingLeft: "38px" }}
                    min={0}
                  />
                </div>
                {monthlySalary && parseInt(monthlySalary, 10) > 0 && (
                  <p style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600, marginTop: "4px" }}>
                    ≈ Rp {Math.round(parseInt(monthlySalary, 10) / 30).toLocaleString("id-ID")}/hari (÷30 hari)
                  </p>
                )}
              </div>

              {/* Random Key Display & Regenerate Box */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                  Kunci Akses Kasir (Random Key)
                </label>
                <div
                  style={{
                    backgroundColor: "#f0faf5",
                    borderRadius: "var(--r-md)",
                    padding: "12px 14px",
                    border: "1.5px solid #a7f3d0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Key size={20} color="var(--primary)" weight="fill" />
                    <div>
                      <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--primary-hover)", letterSpacing: "2px", fontFamily: "var(--font-geist-mono)" }}>
                        {generatedKey}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegenerateModalKey}
                    style={{
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--surface-border)",
                      borderRadius: "var(--r-pill)",
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <ArrowsClockwise size={14} weight="bold" />
                    <span>Acak Ulang</span>
                  </button>
                </div>
                <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "4px" }}>
                  Kunci ini akan digunakan karyawan untuk masuk ke menu kasir.
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveEmployee}
                disabled={!name.trim()}
                style={{ marginTop: "10px" }}
              >
                <Check size={18} weight="bold" />
                <span>Simpan &amp; Salin Kunci Akses</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="admin" />
    </div>
  );
}
