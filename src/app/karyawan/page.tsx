"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Minus, SignOut, ShoppingCart, X, Money, QrCode, Camera, CheckCircle, ClockAfternoon, NotePencil, MapPin, Clock, SpinnerGap, Compass } from "@phosphor-icons/react";
import { useStore, formatRupiah } from "@/lib/store";
import type { CartItem, Transaction, ShiftReport, AttendanceRecord } from "@/lib/types";
import { getCurrentPositionAsync, calculateDistanceMeters } from "@/lib/geo";
import BottomNav from "@/components/BottomNav";
import Receipt from "@/components/Receipt";

type PaymentMethod = "cash" | "qris";
type CheckoutStep = "method" | "cash" | "qris" | "qris_proof";

function formatTimeOnly(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function KaryawanPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("method");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashInput, setCashInput] = useState("");
  const [qrisProofUrl, setQrisProofUrl] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [shiftNotes, setShiftNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attendance state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isAbsenLoading, setIsAbsenLoading] = useState(false);
  const [absenError, setAbsenError] = useState("");
  const [absenSuccessToast, setAbsenSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (state.session !== "karyawan") router.replace("/");
  }, [state.session, router]);
  if (state.session !== "karyawan") return null;

  function getQty(productId: string) {
    return cart.find((c) => c.productId === productId)?.quantity ?? 0;
  }

  function adjustCart(productId: string, delta: number) {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      const currentQty = existing?.quantity ?? 0;
      const newQty = Math.max(0, Math.min(currentQty + delta, product.stock));
      if (newQty === 0) return prev.filter((c) => c.productId !== productId);
      if (existing) return prev.map((c) => c.productId === productId ? { ...c, quantity: newQty } : c);
      return [...prev, { productId, quantity: newQty }];
    });
  }

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const total = cart.reduce((sum, c) => {
    const p = state.products.find((pr) => pr.id === c.productId);
    return sum + (p ? p.price * c.quantity : 0);
  }, 0);

  const cashPaid = Number(cashInput.replace(/\D/g, "")) || 0;
  const changeAmount = Math.max(0, cashPaid - total);
  const cashIsEnough = cashPaid >= total;

  function openCheckout() {
    setCheckoutStep("method");
    setPaymentMethod("cash");
    setCashInput("");
    setQrisProofUrl("");
    setShowCheckout(true);
  }

  function handleSelectMethod(m: PaymentMethod) {
    setPaymentMethod(m);
    setCheckoutStep(m);
  }

  function handleCashConfirm() {
    if (!cashIsEnough) return;
    finalize();
  }

  function handleQrisProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQrisProofUrl(ev.target?.result as string);
      setCheckoutStep("qris_proof");
    };
    reader.readAsDataURL(file);
  }

  function handleRetakePhoto() {
    setQrisProofUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  function finalize() {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      total,
      cashierId: state.activeEmployee?.id,
      cashierName: state.activeEmployee?.name || "Kasir Utama",
      paymentMethod,
      cashPaid: paymentMethod === "cash" ? cashPaid : undefined,
      changeAmount: paymentMethod === "cash" ? changeAmount : undefined,
      qrisProofUrl: paymentMethod === "qris" ? qrisProofUrl : undefined,
      items: cart.map((c) => {
        const p = state.products.find((pr) => pr.id === c.productId)!;
        return { name: p.name, quantity: c.quantity, price: p.price, subtotal: p.price * c.quantity };
      }),
    };
    dispatch({ type: "ADD_TRANSACTION", payload: tx });
    setLastTransaction(tx);
    setCart([]);
    setShowCheckout(false);
    setShowReceipt(true);
  }

  const qrisUrl = `https://chart.googleapis.com/chart?cht=qr&chs=220x220&chl=${encodeURIComponent(
    state.qrisImageUrl || `MATCHA-KYOTO-PAY-${total}`
  )}&choe=UTF-8`;

  const now = new Date();
  const isSameDay = (ts: number, ref: Date) => {
    const d = new Date(ts);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
  };

  // Find the last closed shift for THIS specific active employee today
  const lastClosedShift = (state.shiftReports || []).find((sr) => {
    const isThisEmployee = sr.employeeId
      ? sr.employeeId === state.activeEmployee?.id
      : sr.closedBy === (state.activeEmployee?.name || "Kasir");
    return isThisEmployee && isSameDay(sr.closedAt, now);
  });

  const shiftStartTime = lastClosedShift ? lastClosedShift.closedAt : 0;

  // Active shift transactions: made by THIS employee today and AFTER their last closed shift
  const shiftTxs = state.transactions.filter((tx) => {
    const matchCashier = tx.cashierId
      ? tx.cashierId === state.activeEmployee?.id
      : tx.cashierName === (state.activeEmployee?.name || "Kasir Utama");
    return matchCashier && isSameDay(tx.timestamp, now) && tx.timestamp > shiftStartTime;
  });

  const todayCups = shiftTxs.reduce((sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0), 0);
  const todayCashCups = shiftTxs
    .filter((tx) => tx.paymentMethod === "cash")
    .reduce((sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0), 0);
  const todayQrisCups = shiftTxs
    .filter((tx) => tx.paymentMethod === "qris")
    .reduce((sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0), 0);

  // Active attendance record for this employee today
  const activeAttendance = (state.attendanceRecords || []).find((rec) => {
    const isThisEmp = rec.employeeId === (state.activeEmployee?.id || "default");
    return isThisEmp && isSameDay(rec.clockIn, now) && !rec.clockOut;
  });

  async function handleDoClockIn() {
    setAbsenError("");
    setIsAbsenLoading(true);

    const locationConfig = state.outletLocation;
    const employeeId = state.activeEmployee?.id || "default";
    const employeeName = state.activeEmployee?.name || "Kasir";

    if (locationConfig?.isEnabled) {
      try {
        const coords = await getCurrentPositionAsync();
        const distance = calculateDistanceMeters(
          coords.latitude,
          coords.longitude,
          locationConfig.latitude,
          locationConfig.longitude
        );

        if (distance > locationConfig.radiusMeters) {
          setIsAbsenLoading(false);
          setAbsenError(
            `📍 Anda berada di luar area outlet (Jarak: ${distance}m dari toko). Batas radius presensi: ${locationConfig.radiusMeters}m.`
          );
          return;
        }

        const attendance: AttendanceRecord = {
          id: crypto.randomUUID(),
          employeeId,
          employeeName,
          clockIn: Date.now(),
          latitude: coords.latitude,
          longitude: coords.longitude,
          distanceMeters: distance,
          dateString: new Date().toISOString().split("T")[0],
        };
        dispatch({ type: "RECORD_CLOCK_IN", payload: attendance });
        setAbsenSuccessToast(`✅ Presensi Masuk Berhasil (${formatTimeOnly(attendance.clockIn)} WIB · ${distance}m dari toko)`);
        setTimeout(() => setAbsenSuccessToast(null), 3000);
        setShowAttendanceModal(false);
      } catch (err: unknown) {
        setIsAbsenLoading(false);
        const msg = err instanceof Error ? err.message : "Gagal mengambil lokasi GPS.";
        setAbsenError(msg);
        return;
      }
    } else {
      const attendance: AttendanceRecord = {
        id: crypto.randomUUID(),
        employeeId,
        employeeName,
        clockIn: Date.now(),
        latitude: locationConfig?.latitude ?? 0,
        longitude: locationConfig?.longitude ?? 0,
        distanceMeters: 0,
        dateString: new Date().toISOString().split("T")[0],
      };
      dispatch({ type: "RECORD_CLOCK_IN", payload: attendance });
      setAbsenSuccessToast(`✅ Presensi Masuk Berhasil (${formatTimeOnly(attendance.clockIn)} WIB)`);
      setTimeout(() => setAbsenSuccessToast(null), 3000);
      setShowAttendanceModal(false);
    }
    setIsAbsenLoading(false);
  }

  function handleConfirmCloseShift() {
    const shiftGross = shiftTxs.reduce((s, tx) => s + tx.total, 0);
    const shiftCash = shiftTxs.filter((tx) => tx.paymentMethod === "cash").reduce((s, tx) => s + tx.total, 0);
    const shiftQris = shiftTxs.filter((tx) => tx.paymentMethod === "qris").reduce((s, tx) => s + tx.total, 0);
    const cashCount = shiftTxs.filter((tx) => tx.paymentMethod === "cash").length;
    const qrisCount = shiftTxs.filter((tx) => tx.paymentMethod === "qris").length;

    const shiftHpp = shiftTxs.reduce((sum, tx) => {
      return sum + tx.items.reduce((s, item) => {
        const product = state.products.find((p) => p.name === item.name);
        return s + (product ? product.rawMaterialCost * item.quantity : 0);
      }, 0);
    }, 0);

    const employeeSalaryCost = Math.round((state.activeEmployee?.monthlySalary ?? 0) / 30);
    const shiftExpenses = (state.expenses ?? []).filter((ex) => isSameDay(ex.timestamp, now) && ex.timestamp > shiftStartTime);
    const shiftExpenseTotal = shiftExpenses.reduce((s, ex) => s + ex.amount, 0);

    const netProfit = shiftGross - shiftHpp - employeeSalaryCost - shiftExpenseTotal;

    const report: ShiftReport = {
      id: crypto.randomUUID(),
      shiftName: `Shift ${state.activeEmployee?.name || "Kasir"}`,
      closedAt: Date.now(),
      closedBy: state.activeEmployee?.name || "Kasir",
      employeeId: state.activeEmployee?.id,
      totalGrossRevenue: shiftGross,
      totalCups: todayCups,
      totalTransactions: shiftTxs.length,
      totalHpp: shiftHpp,
      dailySalaryCost: employeeSalaryCost,
      totalExpenses: shiftExpenseTotal,
      netProfit: netProfit,
      cashRevenue: shiftCash,
      qrisRevenue: shiftQris,
      cashCups: todayCashCups,
      qrisCups: todayQrisCups,
      cashCount: cashCount,
      qrisCount: qrisCount,
      notes: shiftNotes.trim() || undefined,
    };

    dispatch({
      type: "RECORD_CLOCK_OUT",
      payload: { employeeId: state.activeEmployee?.id || "default", clockOut: Date.now() },
    });
    dispatch({ type: "CLOSE_SHIFT", payload: report });
    router.replace("/");
  }

  return (
    <div className="page-root">
      <div className="page-content">
        {/* Header */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            padding: "20px 20px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--surface-border)",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                4rq cashier system
              </span>
              <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "9999px", backgroundColor: "var(--primary-light)", color: "var(--primary)", fontWeight: 700 }}>
                {state.activeEmployee?.name || "Kasir"}
              </span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.5px" }}>
              Pilih Menu
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* Tombol Absen */}
            <button
              type="button"
              onClick={() => {
                setAbsenError("");
                setShowAttendanceModal(true);
              }}
              style={{
                backgroundColor: activeAttendance ? "#f0fdf4" : "var(--primary-light)",
                color: activeAttendance ? "#16a34a" : "var(--primary)",
                border: `1px solid ${activeAttendance ? "#86efac" : "#a7f3d0"}`,
                borderRadius: "var(--r-pill)",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Presensi / Absensi Karyawan"
            >
              <MapPin size={14} weight="fill" />
              <span>{activeAttendance ? `${formatTimeOnly(activeAttendance.clockIn)}` : "Absen"}</span>
            </button>

            {/* Tombol Tutup Shift */}
            <button
              type="button"
              onClick={() => setShowCloseShiftModal(true)}
              style={{
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
                borderRadius: "var(--r-pill)",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Tutup Shift Operasional"
            >
              <ClockAfternoon size={14} weight="bold" />
              <span>Tutup Shift</span>
            </button>

            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                dispatch({ type: "LOGOUT" });
                router.replace("/");
              }}
              title="Keluar"
              style={{ width: "32px", height: "32px" }}
            >
              <SignOut size={16} />
            </button>
          </div>
        </div>

        {/* Toast Absen Sukses */}
        {absenSuccessToast && (
          <div style={{ backgroundColor: "#15803d", color: "#ffffff", padding: "10px 16px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", animation: "fadeIn 0.2s ease" }}>
            <CheckCircle size={18} weight="fill" />
            <span>{absenSuccessToast}</span>
          </div>
        )}

        {/* Reminder Banner jika belum absen */}
        {!activeAttendance && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              borderBottom: "1px solid #fde68a",
              padding: "8px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={14} color="#d97706" weight="bold" />
              <p style={{ fontSize: "11px", color: "#92400e", fontWeight: 600 }}>
                Belum absen masuk shift ini
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAbsenError("");
                setShowAttendanceModal(true);
              }}
              style={{
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                border: "none",
                borderRadius: "var(--r-pill)",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Absen Sekarang
            </button>
          </div>
        )}

        {/* Menu grid */}
        <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingBottom: "100px" }}>
          {state.products.map((product) => {
            const qty = getQty(product.id);
            const outOfStock = product.stock === 0;

            return (
              <div key={product.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                {/* Product image */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "1", overflow: "hidden", backgroundColor: "#e2ebe7" }}>
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 430px) 50vw"
                    style={{ objectFit: "cover", filter: outOfStock ? "grayscale(70%)" : "none" }}
                  />
                  <div style={{ position: "absolute", top: "8px", left: "8px" }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: outOfStock ? "#ef4444" : "rgba(255,255,255,0.95)",
                        color: outOfStock ? "#ffffff" : "var(--ink-primary)",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                      }}
                    >
                      {outOfStock ? "Habis" : `Stok ${product.stock}`}
                    </span>
                  </div>
                  {qty > 0 && (
                    <div
                      style={{
                        position: "absolute", top: "8px", right: "8px",
                        width: "26px", height: "26px", borderRadius: "50%",
                        backgroundColor: "var(--primary)", color: "#ffffff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(30,112,72,0.4)",
                      }}
                    >
                      {qty}
                    </div>
                  )}
                </div>

                {/* Info & Action */}
                <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "10px" }}>
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-primary)", lineHeight: 1.3 }}>
                      {product.name}
                    </h3>
                    <p style={{ fontSize: "14px", color: "var(--primary)", fontWeight: 800, marginTop: "4px" }}>
                      {formatRupiah(product.price)}
                    </p>
                  </div>

                  <div>
                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => !outOfStock && adjustCart(product.id, 1)}
                        disabled={outOfStock}
                        style={{
                          width: "100%", padding: "8px 12px",
                          borderRadius: "var(--r-pill)", border: "none",
                          cursor: outOfStock ? "not-allowed" : "pointer",
                          backgroundColor: outOfStock ? "var(--surface-border)" : "var(--primary)",
                          color: outOfStock ? "var(--ink-muted)" : "#ffffff",
                          fontSize: "13px", fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Plus size={14} weight="bold" />
                        <span>Tambah</span>
                      </button>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button type="button" className="qty-btn minus" onClick={() => adjustCart(product.id, -1)}>
                          <Minus size={14} weight="bold" />
                        </button>
                        <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink-primary)" }}>{qty}</span>
                        <button type="button" className="qty-btn plus" onClick={() => adjustCart(product.id, 1)} disabled={qty >= product.stock}>
                          <Plus size={14} weight="bold" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Checkout Bar */}
      {cartCount > 0 && (
        <div
          style={{
            position: "absolute", bottom: "72px", left: "16px", right: "16px",
            zIndex: 45, animation: "slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <button
            type="button"
            onClick={openCheckout}
            style={{
              width: "100%", padding: "12px 16px",
              backgroundColor: "var(--ink-primary)", borderRadius: "var(--r-pill)",
              border: "none", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "space-between",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff" }}>
                <ShoppingCart size={18} weight="fill" />
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: 600 }}>{cartCount} item dipilih</p>
                <p style={{ color: "#ffffff", fontSize: "15px", fontWeight: 800 }}>{formatRupiah(total)}</p>
              </div>
            </div>
            <div style={{ backgroundColor: "var(--primary)", color: "#ffffff", borderRadius: "var(--r-pill)", padding: "8px 18px", fontSize: "13px", fontWeight: 700 }}>
              Bayar
            </div>
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="drag-handle" />

            {/* Hidden persistent Camera Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleQrisProofUpload}
              style={{ display: "none" }}
            />

            {/* Step: Pilih Metode Pembayaran */}
            {checkoutStep === "method" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink-primary)" }}>Metode Pembayaran</h2>
                  <button type="button" onClick={() => setShowCheckout(false)} className="btn-icon" style={{ width: "32px", height: "32px" }}>
                    <X size={16} />
                  </button>
                </div>

                {/* Order summary */}
                <div style={{ backgroundColor: "var(--bg-app)", borderRadius: "var(--r-md)", padding: "12px 14px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {cart.map((c) => {
                    const p = state.products.find((pr) => pr.id === c.productId)!;
                    return (
                      <div key={c.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "var(--ink-secondary)" }}>{p.name} ×{c.quantity}</span>
                        <span style={{ fontWeight: 700 }}>{formatRupiah(p.price * c.quantity)}</span>
                      </div>
                    );
                  })}
                  <div style={{ borderTop: "1px dashed var(--surface-border)", paddingTop: "8px", marginTop: "4px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700 }}>Total Bayar</span>
                    <span style={{ color: "var(--primary)", fontSize: "16px", fontWeight: 800 }}>{formatRupiah(total)}</span>
                  </div>
                </div>

                {/* Method Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => handleSelectMethod("cash")}
                    style={{
                      padding: "20px 14px", borderRadius: "var(--r-lg)",
                      backgroundColor: "var(--bg-app)", border: "2px solid var(--surface-border)",
                      cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Money size={26} color="#16a34a" weight="fill" />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>Cash</p>
                      <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>Hitung kembalian</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMethod("qris")}
                    style={{
                      padding: "20px 14px", borderRadius: "var(--r-lg)",
                      backgroundColor: "var(--bg-app)", border: "2px solid var(--surface-border)",
                      cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <QrCode size={26} color="#2563eb" weight="fill" />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>QRIS</p>
                      <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>Scan & foto bukti</p>
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* Step: Cash - Hitung Kembalian */}
            {checkoutStep === "cash" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink-primary)" }}>Pembayaran Cash</h2>
                  <button type="button" onClick={() => setCheckoutStep("method")} className="btn-icon" style={{ width: "32px", height: "32px" }}>
                    <X size={16} />
                  </button>
                </div>

                {/* Total display */}
                <div style={{ backgroundColor: "var(--primary)", borderRadius: "var(--r-md)", padding: "14px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: 600 }}>Total Tagihan</span>
                  <span style={{ color: "#ffffff", fontSize: "20px", fontWeight: 800 }}>{formatRupiah(total)}</span>
                </div>

                {/* Cash input */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                    Uang yang Diterima
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Contoh: 100000"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    className="input"
                    autoFocus
                  />
                </div>

                {/* Quick amount buttons */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                  {[20000, 50000, 100000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setCashInput(String(Math.ceil(total / amount) * amount))}
                      style={{
                        padding: "6px 12px", borderRadius: "var(--r-pill)",
                        border: "1px solid var(--surface-border)", backgroundColor: "var(--surface)",
                        fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", cursor: "pointer",
                      }}
                    >
                      Rp{amount / 1000}k
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashInput(String(total))}
                    style={{
                      padding: "6px 12px", borderRadius: "var(--r-pill)",
                      border: "1px solid var(--primary)", backgroundColor: "var(--primary-light)",
                      fontSize: "12px", fontWeight: 700, color: "var(--primary)", cursor: "pointer",
                    }}
                  >
                    Pas
                  </button>
                </div>

                {/* Change calculation */}
                {cashPaid > 0 && (
                  <div
                    style={{
                      backgroundColor: cashIsEnough ? "#f0fdf4" : "#fff1f2",
                      border: `1.5px solid ${cashIsEnough ? "#86efac" : "#fca5a5"}`,
                      borderRadius: "var(--r-md)", padding: "12px 14px",
                      marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 700, color: cashIsEnough ? "#16a34a" : "#dc2626" }}>
                      {cashIsEnough ? "💰 Kembalian" : "⚠️ Kurang"}
                    </span>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: cashIsEnough ? "#16a34a" : "#dc2626" }}>
                      {cashIsEnough ? formatRupiah(changeAmount) : formatRupiah(total - cashPaid)}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCashConfirm}
                  disabled={!cashIsEnough}
                  style={{ opacity: cashIsEnough ? 1 : 0.5 }}
                >
                  Selesai & Cetak Struk
                </button>
              </>
            )}

            {/* Step: QRIS - Tampilkan QR */}
            {checkoutStep === "qris" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink-primary)" }}>Pembayaran QRIS</h2>
                  <button type="button" onClick={() => setCheckoutStep("method")} className="btn-icon" style={{ width: "32px", height: "32px" }}>
                    <X size={16} />
                  </button>
                </div>

                {/* Total */}
                <div style={{ backgroundColor: "var(--primary)", borderRadius: "var(--r-md)", padding: "14px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: 600 }}>Total Tagihan</span>
                  <span style={{ color: "#ffffff", fontSize: "20px", fontWeight: 800 }}>{formatRupiah(total)}</span>
                </div>

                {/* QR Code */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "16px", backgroundColor: "#ffffff", borderRadius: "var(--r-lg)", border: "1.5px solid var(--surface-border)", marginBottom: "16px" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink-primary)" }}>MATCHA KYOTO PERDANA 4RQ</p>
                    <p style={{ fontSize: "10px", color: "var(--ink-muted)", fontFamily: "var(--font-geist-mono)" }}>NMID: ID1026582264820 · PNTNK BR</p>
                  </div>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={state.qrisImageUrl || "/qris.jpg"}
                    alt="QRIS Matcha Kyoto Perdana 4RQ"
                    style={{ width: "100%", maxWidth: "260px", height: "auto", borderRadius: "10px", border: "1px solid var(--surface-border)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
                  />

                  <p style={{ fontSize: "11px", color: "var(--ink-muted)", textAlign: "center", lineHeight: 1.3 }}>
                    Scan menggunakan BCA, Mandiri, GoPay, OVO, Dana, ShopeePay, dll.
                  </p>
                </div>

                {/* Upload proof button */}
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleRetakePhoto}
                >
                  <Camera size={18} weight="bold" />
                  <span>Foto Bukti Pembayaran</span>
                </button>
              </>
            )}

            {/* Step: QRIS Proof Preview */}
            {checkoutStep === "qris_proof" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink-primary)" }}>Konfirmasi Bukti</h2>
                  <button type="button" onClick={() => setCheckoutStep("qris")} className="btn-icon" style={{ width: "32px", height: "32px" }}>
                    <X size={16} />
                  </button>
                </div>

                <div
                  style={{ backgroundColor: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <CheckCircle size={18} color="#16a34a" weight="fill" />
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a" }}>Bukti pembayaran berhasil diupload</p>
                </div>

                {/* Proof preview */}
                {qrisProofUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrisProofUrl}
                    alt="Bukti Pembayaran"
                    style={{ width: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "var(--r-lg)", border: "1.5px solid var(--surface-border)", marginBottom: "16px", backgroundColor: "#f8fafc" }}
                  />
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={handleRetakePhoto}
                    style={{
                      flex: 1, padding: "12px", borderRadius: "var(--r-pill)",
                      border: "1.5px solid var(--surface-border)", backgroundColor: "var(--surface)",
                      fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)", cursor: "pointer",
                    }}
                  >
                    Foto Ulang
                  </button>
                  <button type="button" className="btn-primary" onClick={finalize} style={{ flex: 2 }}>
                    Selesai & Cetak Struk
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showReceipt && lastTransaction && (
        <Receipt transaction={lastTransaction} onClose={() => setShowReceipt(false)} />
      )}

      {/* Close Shift Modal */}
      {showCloseShiftModal && (
        <div className="modal-overlay" onClick={() => setShowCloseShiftModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drag-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
                  <ClockAfternoon size={20} weight="fill" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)" }}>
                    Tutup Shift Kasir
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                    Kasir: <strong style={{ color: "var(--ink-primary)" }}>{state.activeEmployee?.name || "Kasir"}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="btn-icon"
                style={{ width: "30px", height: "30px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Summary metrics for employee */}
            <div
              style={{
                backgroundColor: "var(--ink-primary)",
                borderRadius: "var(--r-md)",
                padding: "14px 16px",
                marginBottom: "14px",
                color: "#ffffff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase" }}>
                  Total Cup Terjual Shift Ini
                </p>
                <p style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>
                  {todayCups} <span style={{ fontSize: "12px", fontWeight: 500 }}>Cup</span>
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "6px", padding: "6px 8px" }}>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>💵 Cash</p>
                  <p style={{ fontSize: "12px", fontWeight: 800, color: "#4ade80" }}>{todayCashCups} Cup</p>
                </div>
                <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "6px", padding: "6px 8px" }}>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>📱 QRIS</p>
                  <p style={{ fontSize: "12px", fontWeight: 800, color: "#60a5fa" }}>{todayQrisCups} Cup</p>
                </div>
                <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "6px", padding: "6px 8px" }}>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>🧾 Struk</p>
                  <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--primary)" }}>{shiftTxs.length}</p>
                </div>
              </div>
            </div>

            {/* Notes input */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>
                Catatan Shift Kasir <span style={{ fontWeight: 500, color: "var(--ink-muted)" }}>(Opsional)</span>
              </label>
              <textarea
                placeholder="Contoh: Sisa stok cup 45, laci kasir klop, operasional lancar..."
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                className="input"
                style={{ height: "70px", resize: "none", fontSize: "12px", paddingTop: "8px" }}
              />
            </div>

            <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a", borderRadius: "var(--r-md)", padding: "10px 12px", marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", color: "#92400e", lineHeight: 1.4 }}>
                ℹ️ Laporan shift harian akan otomatis dikirim dan tersimpan ke <strong>Admin History</strong>. Sesi kasir Anda akan otomatis keluar setelah penutupan shift.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "var(--r-pill)",
                  border: "1.5px solid var(--surface-border)",
                  backgroundColor: "var(--surface)",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--ink-primary)",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseShift}
                style={{
                  flex: 2,
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "var(--r-pill)",
                  padding: "12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(220,38,38,0.25)",
                }}
              >
                <ClockAfternoon size={16} weight="bold" />
                <span>Konfirmasi Tutup Shift</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance / Presensi Modal */}
      {showAttendanceModal && (
        <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drag-handle" />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                  <MapPin size={20} weight="fill" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)" }}>
                    Presensi Kehadiran Kasir
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                    {state.activeEmployee?.name || "Kasir"} · {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="btn-icon"
                style={{ width: "30px", height: "30px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Attendance Status Card */}
            <div style={{ backgroundColor: activeAttendance ? "#f0fdf4" : "#f8fafc", border: `1.5px solid ${activeAttendance ? "#86efac" : "var(--surface-border)"}`, borderRadius: "var(--r-md)", padding: "14px 16px", marginBottom: "14px" }}>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase" }}>Status Presensi Hari Ini</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <p style={{ fontSize: "15px", fontWeight: 800, color: activeAttendance ? "#16a34a" : "var(--ink-primary)" }}>
                  {activeAttendance ? "🟢 Sudah Absen Masuk" : "⚪ Belum Absen Masuk"}
                </p>
                {activeAttendance && (
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#166534" }}>
                    {formatTimeOnly(activeAttendance.clockIn)} WIB
                  </span>
                )}
              </div>
              {activeAttendance && (
                <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "4px" }}>
                  📍 Jarak terdeteksi: {activeAttendance.distanceMeters}m dari outlet
                </p>
              )}
            </div>

            {/* Outlet Info */}
            <div style={{ backgroundColor: "var(--bg-app)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>Lokasi Toko:</span>
                <strong style={{ color: "var(--ink-primary)" }}>{state.outletLocation?.addressName || "Outlet Pontianak"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>Status Geofence:</span>
                <span style={{ fontWeight: 700, color: state.outletLocation?.isEnabled ? "var(--primary)" : "#64748b" }}>
                  {state.outletLocation?.isEnabled ? `Aktif (Maks ${state.outletLocation.radiusMeters}m)` : "Nonaktif"}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {absenError && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--r-md)", padding: "10px 12px", marginBottom: "14px" }}>
                <p style={{ fontSize: "12px", color: "#dc2626", fontWeight: 600, lineHeight: 1.4 }}>
                  {absenError}
                </p>
              </div>
            )}

            {/* Action Button */}
            {!activeAttendance ? (
              <button
                type="button"
                className="btn-primary"
                onClick={handleDoClockIn}
                disabled={isAbsenLoading}
                style={{ width: "100%" }}
              >
                {isAbsenLoading ? (
                  <>
                    <SpinnerGap size={18} className="animate-spin" />
                    <span>Memverifikasi Lokasi GPS...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={18} weight="fill" />
                    <span>Klik Untuk Absen Masuk Sekarang</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowAttendanceModal(false)}
                style={{ width: "100%" }}
              >
                <span>Tutup</span>
              </button>
            )}
          </div>
        </div>
      )}

      <BottomNav role="karyawan" />
    </div>
  );
}
