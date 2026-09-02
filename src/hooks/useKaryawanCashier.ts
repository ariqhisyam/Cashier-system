import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type {
  CartItem,
  Transaction,
  ShiftReport,
  AttendanceRecord,
  Product,
} from "@/lib/types";
import { getCurrentPositionAsync, calculateDistanceMeters } from "@/lib/geo";
import { useProducts } from "./useProducts";
import { useGeofence } from "./useGeofence";
import { useQris } from "./useQris";
import { useLogout } from "./useAuth";
import { useUploadStorage } from "./useStorage";
import {
  useTransactions,
  useCreateTransaction,
  useSubmitCloseShift,
} from "./useTransactions";
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

export function isSameDay(ts: number, ref: Date): boolean {
  const d = new Date(ts);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function useKaryawanCashier() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const logoutMutation = useLogout();
  const uploadStorageMutation = useUploadStorage();
  const createTransactionMutation = useCreateTransaction();
  const submitCloseShiftMutation = useSubmitCloseShift();
  const { data: liveActiveAttendance } = useActiveAttendance();
  const clockInMutation = useClockInAttendance();
  const clockOutMutation = useClockOutAttendance();

  // Fetch live transactions from backend
  const { data: transactionsData } = useTransactions({ limit: 100 });

  // Fetch products from backend or fallback to store
  const { data: productsData } = useProducts({
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
    const file = e.target.files?.[0];
    if (!file) return;

    // Show immediate local preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQrisProofUrl(ev.target?.result as string);
      setCheckoutStep("qris_proof");
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Object Storage bucket in background
    try {
      setIsUploadingProof(true);
      const res = await uploadStorageMutation.mutateAsync({
        file,
        folder: "qris_proofs",
      });
      if (res?.url) {
        setQrisProofUrl(res.url);
      }
    } catch (err) {
      console.error("Gagal mengunggah foto bukti ke Supabase Storage:", err);
    } finally {
      setIsUploadingProof(false);
    }
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
      items: cart.map((c) => ({
        productId: c.productId,
        quantity: c.quantity,
      })),
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
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Find the last closed shift for THIS specific active employee today
  const lastClosedShift = (state.shiftReports || []).find((sr) => {
    const isThisEmployee = sr.employeeId
      ? sr.employeeId === state.activeEmployee?.id
      : (sr.closedBy || "").toLowerCase() === (state.activeEmployee?.name || "Kasir").toLowerCase();
    return isThisEmployee && isSameDay(sr.closedAt, now);
  });

  const shiftStartTime = liveActiveAttendance?.clockIn
    ? new Date(liveActiveAttendance.clockIn).getTime()
    : lastClosedShift
    ? lastClosedShift.closedAt
    : startOfDay;

  // Map backend database transactions to frontend Transaction model
  const liveTransactions: Transaction[] = transactionsData?.items
    ? transactionsData.items.map((tx) => ({
        id: tx.id,
        items: (tx.items || []).map((it) => ({
          name: it.productName,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.subtotal,
        })),
        total: tx.total,
        timestamp: new Date(tx.createdAt).getTime(),
        cashierId: tx.cashierId,
        cashierName: tx.cashierName,
        paymentMethod: (tx.paymentMethod ? tx.paymentMethod.toLowerCase() : "cash") as "cash" | "qris",
        cashPaid: tx.cashPaid ?? undefined,
        changeAmount: tx.changeAmount ?? undefined,
        qrisProofUrl: tx.qrisProofUrl ?? undefined,
      }))
    : state.transactions || [];

  // All transactions today for this cashier
  const todayTxs = liveTransactions.filter((tx) => {
    const matchCashier = !state.activeEmployee?.id
      ? true
      : tx.cashierId === state.activeEmployee.id ||
        (tx.cashierName || "").toLowerCase() === (state.activeEmployee.name || "Kasir Utama").toLowerCase();
    return matchCashier && isSameDay(tx.timestamp, now);
  });

  // Active shift transactions: filter by shift start time, or show today's transactions if within same shift
  const shiftTxsFiltered = todayTxs.filter((tx) => tx.timestamp >= (shiftStartTime - 60000));
  const shiftTxs = shiftTxsFiltered.length > 0 ? shiftTxsFiltered : todayTxs;

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

  async function handleDoClockIn() {
    setAbsenError("");
    setIsAbsenLoading(true);

    const locationConfig = currentOutletLocation;
    let coords: { latitude?: number; longitude?: number } = {};

    if (locationConfig?.isEnabled) {
      try {
        const gps = await getCurrentPositionAsync();
        coords = { latitude: gps.latitude, longitude: gps.longitude };
        const distance = calculateDistanceMeters(
          gps.latitude,
          gps.longitude,
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
      setAbsenError(err?.message || "Gagal mencatat presensi masuk ke server.");
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
          const product = products.find((p) => p.name === item.name);
          return s + (product ? product.rawMaterialCost * item.quantity : 0);
        }, 0)
      );
    }, 0);

    const employeeSalaryCost = Math.round(
      (state.activeEmployee?.monthlySalary ?? 0) / 30
    );
    const shiftExpenses = (state.expenses ?? []).filter(
      (ex) => isSameDay(ex.timestamp, now) && ex.timestamp > shiftStartTime
    );
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

    // Send shift report summary to Telegram Bot via backend
    submitCloseShiftMutation.mutate({
      shiftName: report.shiftName,
      totalGrossRevenue: shiftGross,
      totalCups: todayCups,
      totalTransactions: shiftTxs.length,
      cashRevenue: shiftCash,
      qrisRevenue: shiftQris,
      cashCups: todayCashCups,
      qrisCups: todayQrisCups,
      totalHpp: shiftHpp,
      netProfit: netProfit,
      notes: shiftNotes.trim() || undefined,
    });

    // Automatically record clock out on backend
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
    setAbsenSuccessToast("✅ Tutup Shift Berhasil! Laporan shift telah tercatat.");
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
    handleConfirmCloseShift,
    handleLogout,
  };
}
