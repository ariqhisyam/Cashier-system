"use client";
import React from "react";
import { useKaryawanCashier } from "@/hooks/useKaryawanCashier";
import BottomNav from "@/components/BottomNav";
import Receipt from "@/components/Receipt";
import CashierHeader from "./components/CashierHeader";
import CashierMenuGrid from "./components/CashierMenuGrid";
import FloatingCartBar from "./components/FloatingCartBar";
import CheckoutModal from "./components/CheckoutModal";
import AttendanceModal from "./components/AttendanceModal";
import CloseShiftModal from "./components/CloseShiftModal";

export default function KaryawanPage() {
  const {
    activeEmployee,
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
    cashInput,
    setCashInput,
    cashPaid,
    changeAmount,
    cashIsEnough,
    qrisProofUrl,
    isUploadingProof,
    isSubmitting,
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
    qrisImageUrl,
    // Attendance
    activeAttendance,
    showAttendanceModal,
    setShowAttendanceModal,
    isAbsenLoading,
    absenError,
    absenSuccessToast,
    handleDoClockIn,
    outletLocation,
    // Close Shift
    showCloseShiftModal,
    setShowCloseShiftModal,
    shiftNotes,
    setShiftNotes,
    shiftTxs,
    todayCups,
    todayCashCups,
    todayQrisCups,
    todayExpenseTotal,
    handleConfirmCloseShift,
    handleLogout,
  } = useKaryawanCashier();

  return (
    <div className="page-root">
      <div className="page-content">
        {/* Header with attendance & shift actions */}
        <CashierHeader
          activeEmployee={activeEmployee}
          activeAttendance={activeAttendance}
          absenSuccessToast={absenSuccessToast}
          onOpenAttendanceModal={() => setShowAttendanceModal(true)}
          onOpenCloseShiftModal={() => setShowCloseShiftModal(true)}
          onLogout={handleLogout}
        />

        {/* Product Menu Grid */}
        <CashierMenuGrid
          products={products}
          getQty={getQty}
          adjustCart={adjustCart}
        />
      </div>

      {/* Floating Checkout Button */}
      <FloatingCartBar
        cartCount={cartCount}
        total={total}
        onOpenCheckout={openCheckout}
      />

      {/* Checkout Modal (Cash & QRIS) */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          products={products}
          total={total}
          checkoutStep={checkoutStep}
          setCheckoutStep={setCheckoutStep}
          cashInput={cashInput}
          setCashInput={setCashInput}
          cashPaid={cashPaid}
          changeAmount={changeAmount}
          cashIsEnough={cashIsEnough}
          qrisProofUrl={qrisProofUrl}
          qrisImageUrl={qrisImageUrl}
          fileInputRef={fileInputRef}
          onSelectMethod={handleSelectMethod}
          onCashConfirm={handleCashConfirm}
          onQrisProofUpload={handleQrisProofUpload}
          onQrisDirectConfirm={handleQrisDirectConfirm}
          onRetakePhoto={handleRetakePhoto}
          onFinalize={finalize}
          onClose={() => setShowCheckout(false)}
          isSubmitting={isSubmitting}
          isUploadingProof={isUploadingProof}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <Receipt
          transaction={lastTransaction}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Close Shift Modal */}
      {showCloseShiftModal && (
        <CloseShiftModal
          activeEmployee={activeEmployee}
          shiftTxs={shiftTxs}
          todayCups={todayCups}
          todayCashCups={todayCashCups}
          todayQrisCups={todayQrisCups}
          todayExpenseTotal={todayExpenseTotal}
          shiftNotes={shiftNotes}
          setShiftNotes={setShiftNotes}
          onConfirmCloseShift={handleConfirmCloseShift}
          onClose={() => setShowCloseShiftModal(false)}
        />
      )}

      {/* Attendance / Presensi Modal */}
      {showAttendanceModal && (
        <AttendanceModal
          activeEmployee={activeEmployee}
          activeAttendance={activeAttendance}
          outletLocation={outletLocation}
          isAbsenLoading={isAbsenLoading}
          absenError={absenError}
          onClockIn={handleDoClockIn}
          onClose={() => setShowAttendanceModal(false)}
        />
      )}

      <BottomNav role="karyawan" />
    </div>
  );
}
