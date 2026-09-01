import { useState, useEffect, useRef } from "react";
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
import { useLogout } from "./useAuth";

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

  // Fetch products from backend or fallback to store
  const { data: productsData } = useProducts({
    page: 1,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch geofence settings dynamically from backend
  const { data: geofenceSetting } = useGeofence();

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

  // Session guard
  useEffect(() => {
    if (state.session !== "karyawan") {
      router.replace("/");
    }
  }, [state.session, router]);

  function getQty(productId: string) {
    return cart.find((c) => c.productId === productId)?.quantity ?? 0;
  }

  function adjustCart(productId: string, delta: number) {
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
        const p = products.find((pr) => pr.id === c.productId)!;
        return {
          name: p.name,
          quantity: c.quantity,
          price: p.price,
          subtotal: p.price * c.quantity,
        };
      }),
    };
    dispatch({ type: "ADD_TRANSACTION", payload: tx });
    setLastTransaction(tx);
    setCart([]);
    setShowCheckout(false);
    setShowReceipt(true);
  }

  const now = new Date();
  const isSameDay = (ts: number, ref: Date) => {
    const d = new Date(ts);
    return (
      d.getFullYear() === ref.getFullYear() &&
      d.getMonth() === ref.getMonth() &&
      d.getDate() === ref.getDate()
    );
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

  // Active attendance record for this employee today
  const activeAttendance = (state.attendanceRecords || []).find((rec) => {
    const isThisEmp = rec.employeeId === (state.activeEmployee?.id || "default");
    return isThisEmp && isSameDay(rec.clockIn, now) && !rec.clockOut;
  });

  async function handleDoClockIn() {
    setAbsenError("");
    setIsAbsenLoading(true);

    const locationConfig = currentOutletLocation;
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
        setAbsenSuccessToast(
          `✅ Presensi Masuk Berhasil (${formatTimeOnly(
            attendance.clockIn
          )} WIB · ${distance}m dari toko)`
        );
        setTimeout(() => setAbsenSuccessToast(null), 3000);
        setShowAttendanceModal(false);
      } catch (err: unknown) {
        setIsAbsenLoading(false);
        const msg =
          err instanceof Error ? err.message : "Gagal mengambil lokasi GPS.";
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
      setAbsenSuccessToast(
        `✅ Presensi Masuk Berhasil (${formatTimeOnly(attendance.clockIn)} WIB)`
      );
      setTimeout(() => setAbsenSuccessToast(null), 3000);
      setShowAttendanceModal(false);
    }
    setIsAbsenLoading(false);
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

    dispatch({
      type: "RECORD_CLOCK_OUT",
      payload: {
        employeeId: state.activeEmployee?.id || "default",
        clockOut: Date.now(),
      },
    });
    dispatch({ type: "CLOSE_SHIFT", payload: report });
    router.replace("/");
  }

  function handleLogout() {
    logoutMutation.mutate();
  }

  return {
    isAuthorized: state.session === "karyawan",
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
    qrisImageUrl: state.qrisImageUrl || "/qris.jpg",
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
