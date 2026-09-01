"use client";
import React from "react";
import {
  Compass,
  MapPin,
  NavigationArrow,
  SlidersHorizontal,
  SpinnerGap,
  CheckCircle,
} from "@phosphor-icons/react";

interface GeofencingTabProps {
  geoEnabled: boolean;
  setGeoEnabled: (val: boolean) => void;
  geoAddress: string;
  setGeoAddress: (val: string) => void;
  geoLat: string;
  setGeoLat: (val: string) => void;
  geoLng: string;
  setGeoLng: (val: string) => void;
  geoRadius: number;
  setGeoRadius: (val: number) => void;
  isGettingGps: boolean;
  onGetCurrentGps: () => void;
  onSaveGeofencing: () => void;
}

export default function GeofencingTab({
  geoEnabled,
  setGeoEnabled,
  geoAddress,
  setGeoAddress,
  geoLat,
  setGeoLng,
  geoLng,
  setGeoLat,
  geoRadius,
  setGeoRadius,
  isGettingGps,
  onGetCurrentGps,
  onSaveGeofencing,
}: GeofencingTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Geofence Status Card */}
      <div
        className="card"
        style={{
          padding: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: geoEnabled ? "var(--primary-light)" : "var(--surface)",
          border: `1.5px solid ${geoEnabled ? "var(--primary)" : "var(--surface-border)"}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              backgroundColor: geoEnabled ? "var(--primary)" : "var(--bg-app)",
              color: geoEnabled ? "#ffffff" : "var(--ink-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Compass size={22} weight="bold" />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
              Presensi Berbasis Radius Geofencing
            </p>
            <p style={{ fontSize: "11px", color: "var(--ink-secondary)", marginTop: "2px" }}>
              {geoEnabled
                ? "Karyawan hanya bisa absen masuk saat berada di sekitar outlet."
                : "Geofencing dinonaktifkan (karyawan bisa absen di mana saja)."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setGeoEnabled(!geoEnabled)}
          style={{
            padding: "8px 14px",
            borderRadius: "var(--r-pill)",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            backgroundColor: geoEnabled ? "var(--primary)" : "#64748b",
            color: "#ffffff",
          }}
        >
          {geoEnabled ? "Aktif" : "Nonaktif"}
        </button>
      </div>

      {/* Outlet Location Config */}
      <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>
          Pengaturan Titik Koordinat Outlet
        </h3>

        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
            Nama Lokasi / Alamat Toko
          </label>
          <input
            type="text"
            value={geoAddress}
            onChange={(e) => setGeoAddress(e.target.value)}
            className="input"
            placeholder="Contoh: Outlet Matcha Kyoto - Pontianak"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
              Latitude
            </label>
            <input
              type="text"
              value={geoLat}
              onChange={(e) => setGeoLat(e.target.value)}
              className="input"
              placeholder="-0.026330"
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
              Longitude
            </label>
            <input
              type="text"
              value={geoLng}
              onChange={(e) => setGeoLng(e.target.value)}
              className="input"
              placeholder="109.342503"
            />
          </div>
        </div>

        {/* GPS Auto Detect button */}
        <button
          type="button"
          onClick={onGetCurrentGps}
          disabled={isGettingGps}
          style={{
            padding: "10px 14px",
            borderRadius: "var(--r-md)",
            border: "1.5px solid var(--primary)",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary)",
            fontSize: "12px",
            fontWeight: 700,
            cursor: isGettingGps ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isGettingGps ? (
            <>
              <SpinnerGap size={16} className="animate-spin" />
              <span>Mengambil Koordinat GPS...</span>
            </>
          ) : (
            <>
              <NavigationArrow size={16} weight="bold" />
              <span>Gunakan Lokasi GPS Saya Saat Ini</span>
            </>
          )}
        </button>

        {/* Radius selector */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)" }}>
              Batas Radius Kehadiran
            </label>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--primary)" }}>
              {geoRadius} meter
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="500"
            step="10"
            value={geoRadius}
            onChange={(e) => setGeoRadius(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--ink-muted)", marginTop: "2px" }}>
            <span>20m (Sangat Ketat)</span>
            <span>100m (Rekomendasi)</span>
            <span>500m (Luas)</span>
          </div>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={onSaveGeofencing}
          className="btn-primary"
          style={{ marginTop: "4px" }}
        >
          Simpan Pengaturan Geofencing
        </button>
      </div>
    </div>
  );
}
