"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, generateEmployeeKey } from "@/lib/store";
import type { Employee } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
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
} from "@phosphor-icons/react";

function formatDate(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function AdminEmployeesPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (state.session !== "admin") router.replace("/");
  }, [state.session, router]);
  if (state.session !== "admin") return null;

  function openAddModal() {
    setName("");
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
    const newEmp: Employee = {
      id: crypto.randomUUID(),
      name: name.trim(),
      key: generatedKey,
      createdAt: Date.now(),
      isActive: true,
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

  return (
    <div className="page-root">
      <div className="page-content">
        {/* Header */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--surface-border)",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Matcha Kyoto
          </p>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.5px" }}>
            Akses &amp; Karyawan
          </h1>
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
