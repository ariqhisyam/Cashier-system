import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, isSameDayWib } from "@/lib/store";
import type {
  CartItem,
  Transaction,
  ShiftReport,
  AttendanceRecord,
  Product,
} from "@/lib/types";
import { getCurrentPositionAsync, calculateDistanceMeters, isWithinGeofence } from "@/lib/geo";
import { compressImage } from "@/lib/image-utils";
import { useProducts } from "./useProducts";
import { useGeofence } from "./useGeofence";
import { useQris } from "./useQris";
import { useLogout } from "./useAuth";
import { useUploadStorage } from "./useStorage";
import { useCreateTransaction, useCloseShiftReport } from "./useTransactions";
import { useExpensesQuery } from "./useExpenses";
import {
  useActiveAttendance,
  useClockInAttendance,
  useClockOutAttendance,
} from "./useAttendance";

export type PaymentMethod = "cash" | "qris";
export type CheckoutStep = "method" | "cash" | "qris" | "qris_proof";

export function formatTimeOnly(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function useKaryawanCashier() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const logoutMutation = useLogout();
  const createTransactionMutation = useCreateTransaction();
  const closeShiftMutation = useCloseShiftReport();
  const { data: liveActiveAttendance } = useActiveAttendance();
  const clockInMutation = useClockInAttendance();
  const clockOutMutation = useClockOutAttendance();
  const { data: liveExpenses } = useExpensesQuery();

  // All operational expenses for today (from live backend or store)
  const allExpenses = liveExpenses?.length ? liveExpenses : state.expenses ?? [];
  const todayExpenses = allExpenses.filter((ex) => isSameDayWib(ex.timestamp, new Date()));
  const todayExpenseTotal = todayExpenses.reduce((s, ex) => s + ex.amount, 0);

  // Fetch products from backend or fallback to store
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({
    page: 1,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch geofence settings dynamically from backend
  const { data: geofenceSetting } = useGeofence();

  // Fetch active QRIS image URL dynamically from backend
  const { data: qrisSettingUrl } = useQris();

  const products: Product[] =
    productsData?.products && productsData.products.length > 0
      ? productsData.products
      : state.products;

  const currentOutletLocation = geofenceSetting || state.outletLocation;

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Auto-reconcile cart items when real products from backend are loaded
  useEffect(() => {
    if (!productsData?.products || productsData.products.length === 0) return;
    setCart((prevCart) => {
      let changed = false;
      const reconciled = prevCart.map((item) => {
        const exactMatch = productsData.products.find((p) => p.id === item.productId);
        if (exactMatch) return item;

        const nameMatch = productsData.products.find(
          (p) => p.name.toLowerCase() === (item as any).name?.toLowerCase()
        );
        if (nameMatch && nameMatch.id !== item.productId) {
          changed = true;
          return { ...item, productId: nameMatch.id };
        }
        return item;
      });
      return changed ? reconciled : prevCart;
    });
  }, [productsData]);

  // Checkout modal & payment state
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("method");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashInput, setCashInput] = useState("");
  const [qrisProofUrl, setQrisProofUrl] = useState("");
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  // Close shift modal state
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [shiftNotes, setShiftNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attendance state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isAbsenLoading, setIsAbsenLoading] = useState(false);
  const [absenError, setAbsenError] = useState("");
  const [absenSuccessToast, setAbsenSuccessToast] = useState<string | null>(null);

  // Derived active attendance from Neon PostgreSQL database or local state
  const activeAttendance: AttendanceRecord | undefined = liveActiveAttendance
    ? {
        id: liveActiveAttendance.id,
        employeeId: liveActiveAttendance.userId || state.activeEmployee?.id || "default",
        employeeName: liveActiveAttendance.userName,
        clockIn: new Date(liveActiveAttendance.clockIn).getTime(),
        clockOut: liveActiveAttendance.clockOut
          ? new Date(liveActiveAttendance.clockOut).getTime()
          : undefined,
        latitude: liveActiveAttendance.latitude || 0,
        longitude: liveActiveAttendance.longitude || 0,
        distanceMeters: liveActiveAttendance.distanceMeters || 0,
        dateString: new Date(liveActiveAttendance.clockIn).toISOString().split("T")[0],
      }
    : (state.attendanceRecords || []).find((rec) => {
        const isThisEmp = rec.employeeId === (state.activeEmployee?.id || "default");
        const now = new Date();
        const isSameDay = (ts: number, ref: Date) => {
          const d = new Date(ts);
          return (
            d.getFullYear() === ref.getFullYear() &&
            d.getMonth() === ref.getMonth() &&
            d.getDate() === ref.getDate()
          );
        };
        return isThisEmp && isSameDay(rec.clockIn, now) && !rec.clockOut;
      });

  function getQty(productId: string) {
    return cart.find((c) => c.productId === productId)?.quantity ?? 0;
  }

  function adjustCart(productId: string, delta: number) {
    // ENFORCE MANDATORY CLOCK-IN RULE:
    // If cashier has not clocked in yet, block adding items and open AttendanceModal
    if (delta > 0 && !activeAttendance) {
      setAbsenError("⚠️ Anda belum absen masuk! Silakan lakukan presensi masuk terlebih dahulu.");
      setShowAttendanceModal(true);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      const currentQty = existing?.quantity ?? 0;
      const newQty = Math.max(0, Math.min(currentQty + delta, product.stock));
      if (newQty === 0) return prev.filter((c) => c.productId !== productId);
      if (existing)
        return prev.map((c) =>
          c.productId === productId ? { ...c, quantity: newQty } : c
        );
      return [...prev, { productId, quantity: newQty }];
    });
  }

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const total = cart.reduce((sum, c) => {
    const p = products.find((pr) => pr.id === c.productId);
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
    if (!cashIsEnough || createTransactionMutation.isPending) return;
    finalize();
  }

  async function handleQrisProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    try {
      setIsUploadingProof(true);
      // Fast client-side image compression (<150KB) directly to Base64 Data URL
      const { dataUrl } = await compressImage(rawFile, 1024, 1024, 0.75);
      setQrisProofUrl(dataUrl);
      setCheckoutStep("qris_proof");
    } catch (err) {
      console.error("Gagal kompres foto:", err);
      alert("Gagal memproses foto bukti pembayaran. Silakan coba lagi.");
    } finally {
      setIsUploadingProof(false);
    }
  }

  function handleQrisDirectConfirm() {
    if (createTransactionMutation.isPending) return;
    setQrisProofUrl("");
    finalize();
  }


  function handleRetakePhoto() {
    setQrisProofUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  function finalize() {
    if (cart.length === 0 || createTransactionMutation.isPending) return;

    const payload = {
      items: cart.map((c) => {
        const matched = products.find((p) => p.id === c.productId);
        return {
          productId: matched?.id || c.productId,
          productName: matched?.name,
          quantity: c.quantity,
        };
      }),
      paymentMethod: (paymentMethod === "cash" ? "CASH" : "QRIS") as "CASH" | "QRIS",
      cashPaid: paymentMethod === "cash" ? cashPaid : undefined,
      qrisProofUrl: paymentMethod === "qris" ? qrisProofUrl : undefined,
    };

    createTransactionMutation.mutate(payload, {
      onSuccess: (savedTx) => {
        const tx: Transaction = {
          id: savedTx.id,
          timestamp: new Date(savedTx.createdAt).getTime(),
          total: savedTx.total,
          cashierId: savedTx.cashierId || state.activeEmployee?.id,
          cashierName: savedTx.cashierName || state.activeEmployee?.name || "Kasir Utama",
          paymentMethod: savedTx.paymentMethod === "CASH" ? "cash" : "qris",
          cashPaid: savedTx.cashPaid ?? (paymentMethod === "cash" ? cashPaid : undefined),
          changeAmount: savedTx.changeAmount ?? (paymentMethod === "cash" ? changeAmount : undefined),
          qrisProofUrl: savedTx.qrisProofUrl ?? (paymentMethod === "qris" ? qrisProofUrl : undefined),
          items: savedTx.items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
        };

        dispatch({ type: "ADD_TRANSACTION", payload: tx });
        setLastTransaction(tx);
        setCart([]);
        setShowCheckout(false);
        setShowReceipt(true);
      },
      onError: (err: any) => {
        alert(
          err?.message ||
            "Gagal menyimpan transaksi. Silakan periksa stok produk atau koneksi server."
        );
      },
    });
  }

  const now = new Date();

  // Find the last closed shift for THIS specific active employee today (in WIB)
  const lastClosedShift = (state.shiftReports || []).find((sr) => {
    const isThisEmployee = sr.employeeId
      ? sr.employeeId === state.activeEmployee?.id
      : sr.closedBy === (state.activeEmployee?.name || "Kasir");
    return isThisEmployee && isSameDayWib(sr.closedAt, now);
  });

  const shiftStartTime = lastClosedShift ? new Date(lastClosedShift.closedAt).getTime() : 0;

  // Active shift transactions: made by THIS employee today and AFTER their last closed shift
  const shiftTxs = state.transactions.filter((tx) => {
    const matchCashier = tx.cashierId
      ? tx.cashierId === state.activeEmployee?.id
      : tx.cashierName === (state.activeEmployee?.name || "Kasir Utama");
    return matchCashier && isSameDayWib(tx.timestamp, now) && tx.timestamp > shiftStartTime;
  });

  const todayCups = shiftTxs.reduce(
    (sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0),
    0
  );
  const todayCashCups = shiftTxs
    .filter((tx) => tx.paymentMethod === "cash")
    .reduce((sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0), 0);
  const todayQrisCups = shiftTxs
    .filter((tx) => tx.paymentMethod === "qris")
    .reduce((sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0), 0);

  async function handleDoClockIn(isEmergency = false) {
    setAbsenError("");
    setIsAbsenLoading(true);

    const locationConfig = currentOutletLocation;
    let coords: { latitude?: number; longitude?: number; accuracy?: number; notes?: string } = {};

    if (isEmergency) {
      coords = {
        notes: "[DARURAT] Presensi kasir darurat tanpa geofence GPS",
      };
    } else if (locationConfig?.isEnabled) {
      try {
        const gps = await getCurrentPositionAsync();
        coords = {
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy,
        };

        const check = isWithinGeofence(
          gps.latitude,
          gps.longitude,
          locationConfig.latitude,
          locationConfig.longitude,
          locationConfig.radiusMeters,
          gps.accuracy
        );

        if (!check.isWithin) {
          setIsAbsenLoading(false);
          setAbsenError(
            `📍 Anda berada di luar area outlet (Jarak: ${check.distanceMeters}m dari toko, akurasi GPS: ±${Math.round(gps.accuracy)}m). Batas radius presensi: ${locationConfig.radiusMeters}m.`
          );
          return;
        }
      } catch (err: unknown) {
        setIsAbsenLoading(false);
        const msg =
          err instanceof Error ? err.message : "Gagal mengambil lokasi GPS.";
        setAbsenError(msg);
        return;
      }
    }

    try {
      const saved = await clockInMutation.mutateAsync(coords);
      const clockInTime = new Date(saved.clockIn).getTime();
      const attendance: AttendanceRecord = {
        id: saved.id,
        employeeId: saved.userId || state.activeEmployee?.id || "default",
        employeeName: saved.userName,
        clockIn: clockInTime,
        latitude: saved.latitude || 0,
        longitude: saved.longitude || 0,
        distanceMeters: saved.distanceMeters || 0,
        dateString: new Date(saved.clockIn).toISOString().split("T")[0],
      };
      dispatch({ type: "RECORD_CLOCK_IN", payload: attendance });
      setAbsenSuccessToast(
        `✅ Presensi Masuk Berhasil (${formatTimeOnly(clockInTime)} WIB · ${saved.distanceMeters}m dari toko)`
      );
      setTimeout(() => setAbsenSuccessToast(null), 3000);
      setShowAttendanceModal(false);
    } catch (err: any) {
      console.warn("Server clock-in failed, checking fallback:", err);
      // If user selected Emergency Bypass, or server error occurred, ensure cashier is not blocked
      const nowMs = Date.now();
      const fallbackAttendance: AttendanceRecord = {
        id: `att-local-${nowMs}`,
        employeeId: state.activeEmployee?.id || "default",
        employeeName: state.activeEmployee?.name || "Kasir",
        clockIn: nowMs,
        latitude: coords.latitude || 0,
        longitude: coords.longitude || 0,
        distanceMeters: 0,
        dateString: new Date(nowMs).toISOString().split("T")[0],
      };

      if (isEmergency) {
        dispatch({ type: "RECORD_CLOCK_IN", payload: fallbackAttendance });
        setAbsenSuccessToast(`⚠️ Presensi Masuk Darurat Tercatat (${formatTimeOnly(nowMs)} WIB)`);
        setTimeout(() => setAbsenSuccessToast(null), 3000);
        setShowAttendanceModal(false);
      } else {
        // Show the error message, and if they click emergency bypass next, fallback will activate
        setAbsenError(
          err?.message || "Gagal mencatat presensi ke server. Gunakan Presensi Darurat jika perlu membuka kasir segera."
        );
      }
    } finally {
      setIsAbsenLoading(false);
    }
  }

  function handleConfirmCloseShift() {
    const shiftGross = shiftTxs.reduce((s, tx) => s + tx.total, 0);
    const shiftCash = shiftTxs
      .filter((tx) => tx.paymentMethod === "cash")
      .reduce((s, tx) => s + tx.total, 0);
    const shiftQris = shiftTxs
      .filter((tx) => tx.paymentMethod === "qris")
      .reduce((s, tx) => s + tx.total, 0);
    const cashCount = shiftTxs.filter((tx) => tx.paymentMethod === "cash").length;
    const qrisCount = shiftTxs.filter((tx) => tx.paymentMethod === "qris").length;

    const shiftHpp = shiftTxs.reduce((sum, tx) => {
      return (
        sum +
        tx.items.reduce((s, item) => {
          if ((item as any).rawMaterialCost) {
            return s + (item as any).rawMaterialCost * item.quantity;
          }
          const product = products.find((p) => p.name === item.name);
          return s + (product ? product.rawMaterialCost * item.quantity : 0);
        }, 0)
      );
    }, 0);

    let empSalary = state.activeEmployee?.monthlySalary;
    if (!empSalary || empSalary <= 0) {
      const matched = (state.employees || []).find(
        (e) => e.id === state.activeEmployee?.id || e.name === state.activeEmployee?.name
      );
      empSalary = matched?.monthlySalary;
    }
    const employeeSalaryCost = Math.round((empSalary ?? 0) / 30);
    // Individual shift reports do not bear store operational expenses (deducted at store daily/period summary level)
    const shiftExpenseTotal = 0;

    // Shift Cashier Formula: Gross - HPP - Gaji Karyawan
    const netProfit = shiftGross - shiftHpp - employeeSalaryCost;

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

    // 1. Submit to backend PostgreSQL database & trigger Telegram notification
    closeShiftMutation.mutate({
      shiftName: report.shiftName,
      totalGrossRevenue: report.totalGrossRevenue,
      totalCups: report.totalCups,
      totalTransactions: report.totalTransactions,
      cashRevenue: report.cashRevenue,
      qrisRevenue: report.qrisRevenue,
      cashCups: report.cashCups,
      qrisCups: report.qrisCups,
      totalHpp: report.totalHpp,
      dailySalaryCost: report.dailySalaryCost,
      totalExpenses: report.totalExpenses,
      cashCount: report.cashCount,
      qrisCount: report.qrisCount,
      netProfit: report.netProfit,
      closedBy: report.closedBy,
      employeeId: report.employeeId,
      notes: report.notes,
    });

    // 2. Automatically record clock out on backend
    clockOutMutation.mutate({});

    dispatch({
      type: "RECORD_CLOCK_OUT",
      payload: {
        employeeId: state.activeEmployee?.id || "default",
        clockOut: Date.now(),
      },
    });
    dispatch({ type: "CLOSE_SHIFT", payload: report });
    setShowCloseShiftModal(false);
    setShiftNotes("");
    setCart([]);
    setAbsenSuccessToast("✅ Tutup Shift Berhasil! Laporan shift tersimpan & terkirim ke Telegram.");
    setTimeout(() => setAbsenSuccessToast(null), 3500);
  }

  function handleLogout() {
    logoutMutation.mutate();
  }

  return {
    activeEmployee: state.activeEmployee,
    products,
    cart,
    cartCount,
    total,
    getQty,
    adjustCart,
    // Checkout
    showCheckout,
    setShowCheckout,
    checkoutStep,
    setCheckoutStep,
    paymentMethod,
    setPaymentMethod,
    cashInput,
    setCashInput,
    cashPaid,
    changeAmount,
    cashIsEnough,
    qrisProofUrl,
    isUploadingProof,
    isSubmitting: createTransactionMutation.isPending,
    fileInputRef,
    openCheckout,
    handleSelectMethod,
    handleCashConfirm,
    handleQrisProofUpload,
    handleQrisDirectConfirm,
    handleRetakePhoto,
    finalize,
    showReceipt,
    setShowReceipt,
    lastTransaction,
    qrisImageUrl: qrisSettingUrl || state.qrisImageUrl || "/qris.jpg",
    // Attendance
    activeAttendance,
    showAttendanceModal,
    setShowAttendanceModal,
    isAbsenLoading,
    absenError,
    setAbsenError,
    absenSuccessToast,
    handleDoClockIn,
    outletLocation: currentOutletLocation,
    // Close Shift
    showCloseShiftModal,
    setShowCloseShiftModal,
    shiftNotes,
    setShiftNotes,
    shiftTxs,
    todayCups,
    todayCashCups,
    todayQrisCups,
    todayExpenses,
    todayExpenseTotal,
    handleConfirmCloseShift,
    handleLogout,
    isLoadingProducts,
  };
}
