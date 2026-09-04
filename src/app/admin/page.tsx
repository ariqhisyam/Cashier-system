"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, formatRupiah } from "@/lib/store";
import type { Transaction, Product, User, Expense } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import BarChart from "@/components/BarChart";
import ReceiptModal from "@/components/Receipt";
import { SignOut, TrendUp, Money, ChartBar, CreditCard, Coins, Plus, Trash, X, Receipt } from "@phosphor-icons/react";
import { useLogout } from "@/hooks";
import { useTransactions } from "@/hooks/useTransactions";
import { useProducts } from "@/hooks/useProducts";
import { useUsers } from "@/hooks/useUsers";
import { useExpenses, useCreateExpense, useDeleteExpense } from "@/hooks/useExpenses";

type ChartFilter = "harian" | "bulanan" | "tahunan";

function pad(n: number) { return String(n).padStart(2, "0"); }
function isSameDay(ts: number, ref: Date) {
  const d = new Date(ts);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

export default function AdminPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const logoutMutation = useLogout();
  const [chartFilter, setChartFilter] = useState<ChartFilter>("harian");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePresets] = useState(["Es Batu", "Listrik", "Gas", "Transportasi", "Lainnya"]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Live queries from backend
  const { data: transactionsData } = useTransactions({ limit: 100 });
  const { data: productsData } = useProducts({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });
  const { data: backendExpenses } = useExpenses();
  const createExpenseMutation = useCreateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const now = new Date();

  // Map backend database transactions
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

  // Map backend products for HPP
  const liveProducts: Product[] = productsData?.products
    ? productsData.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        imageUrl: p.imageUrl || "/matcha-latte.jpg",
        rawMaterialCost: p.rawMaterialCost || 0,
      }))
    : state.products || [];

  // Map backend employees for salary
  const liveEmployees = usersData?.users
    ? usersData.users.filter((u) => u.role === "KARYAWAN")
    : state.employees || [];

  // Map backend expenses (fallback to state.expenses)
  const liveExpenses: Expense[] = backendExpenses
    ? backendExpenses.map((ex) => ({
        id: ex.id,
        description: ex.description,
        amount: ex.amount,
        timestamp: new Date(ex.date).getTime(),
      }))
    : state.expenses || [];

  const todayTxs = liveTransactions.filter((tx) => isSameDay(tx.timestamp, now));

  const grossRevenue = todayTxs.reduce((s, tx) => s + tx.total, 0);
  const revenueAfterHpp = todayTxs.reduce((sum, tx) => {
    const cost = tx.items.reduce((s, item) => {
      const product = liveProducts.find((p) => p.name === item.name);
      return s + (product ? product.rawMaterialCost * item.quantity : 0);
    }, 0);
    return sum + tx.total - cost;
  }, 0);

  // Daily salary cost (beban gaji harian karyawan aktif selalu dialokasikan per hari)
  const dailySalaryCost = liveEmployees
    .filter((e: any) => e.isActive && e.monthlySalary)
    .reduce((s: number, e: any) => s + Math.round((e.monthlySalary ?? 0) / 30), 0);

  // Today's additional expenses (khusus hari ini antara 00:00 s/d 23:59)
  const todayExpenses = liveExpenses.filter((ex) => isSameDay(ex.timestamp, now));
  const totalExpenses = todayExpenses.reduce((s, ex) => s + ex.amount, 0);

  // Net revenue: gross - HPP - salary - additional expenses (bisa minus / nombok)
  const netRevenue = revenueAfterHpp - dailySalaryCost - totalExpenses;

  const cashRevenue = todayTxs.filter((tx) => tx.paymentMethod === "cash").reduce((s, tx) => s + tx.total, 0);
  const qrisRevenue = todayTxs.filter((tx) => tx.paymentMethod === "qris").reduce((s, tx) => s + tx.total, 0);
  const cashCount = todayTxs.filter((tx) => tx.paymentMethod === "cash").length;
  const qrisCount = todayTxs.filter((tx) => tx.paymentMethod === "qris").length;

  const activeEmployeesWithSalary = liveEmployees.filter((e: any) => e.isActive && e.monthlySalary);

  function handleAddExpense() {
    const amount = parseInt(expenseAmount.replace(/\D/g, ""), 10);
    if (!expenseDesc.trim() || !amount || amount <= 0) return;
    const newId = crypto.randomUUID();
    const nowTs = Date.now();
    dispatch({
      type: "ADD_EXPENSE",
      payload: { id: newId, description: expenseDesc.trim(), amount, timestamp: nowTs },
    });
    createExpenseMutation.mutate({
      description: expenseDesc.trim(),
      amount,
      date: new Date().toISOString(),
    });
    setExpenseDesc("");
    setExpenseAmount("");
    setShowExpenseModal(false);
  }

  function handleDeleteExpense(id: string) {
    dispatch({ type: "DELETE_EXPENSE", payload: id });
    deleteExpenseMutation.mutate(id);
  }

  function openExpenseModal(preset?: string) {
    setExpenseDesc(preset ?? "");
    setExpenseAmount("");
    setShowExpenseModal(true);
  }

  function buildChartData() {
    if (chartFilter === "harian") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        const label = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
        const value = liveTransactions.filter((tx) => {
          const txd = new Date(tx.timestamp);
          return txd.getFullYear() === d.getFullYear() && txd.getMonth() === d.getMonth() && txd.getDate() === d.getDate();
        }).reduce((s, tx) => s + tx.total, 0);
        return { label, value };
      });
    }
    if (chartFilter === "bulanan") {
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const label = `${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
        const value = liveTransactions.filter((tx) => {
          const txd = new Date(tx.timestamp);
          return txd.getFullYear() === d.getFullYear() && txd.getMonth() === d.getMonth();
        }).reduce((s, tx) => s + tx.total, 0);
        return { label, value };
      });
    }
    return Array.from({ length: 4 }, (_, i) => {
      const year = now.getFullYear() - (3 - i);
      const value = liveTransactions.filter((tx) => new Date(tx.timestamp).getFullYear() === year).reduce((s, tx) => s + tx.total, 0);
      return { label: String(year), value };
    });
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div>
            <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              4rq Cashier System
            </p>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.5px" }}>
              Dashboard Admin
            </h1>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            title="Keluar"
          >
            <SignOut size={18} />
          </button>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Dark Hero Card */}
            <div
              style={{
                gridColumn: "1 / -1",
                backgroundColor: "var(--ink-primary)",
                borderRadius: "var(--r-lg)",
                padding: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 10px 25px rgba(20,31,25,0.2)",
              }}
            >
              <div>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 600 }}>
                  Transaksi Selesai Hari Ini
                </p>
                <p style={{ color: "#ffffff", fontSize: "32px", fontWeight: 800, marginTop: "4px", lineHeight: 1 }}>
                  {todayTxs.length}
                </p>
                <p style={{ color: "#52b788", fontSize: "11px", fontWeight: 600, marginTop: "6px" }}>
                  ● Operasional Aktif
                </p>
              </div>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                }}
              >
                <ChartBar size={26} weight="fill" />
              </div>
            </div>

            {/* Gross Revenue Card */}
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 700 }}>Pendapatan Kotor</p>
                <TrendUp size={18} color="var(--primary)" weight="bold" />
              </div>
              <p style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)", marginTop: "6px" }}>
                {formatRupiah(grossRevenue)}
              </p>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>hari ini</p>
            </div>

            {/* Net Revenue Card */}
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 700 }}>Keuntungan Bersih</p>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: "999px",
                  backgroundColor: netRevenue >= 0 ? "#f0fdf4" : "#fef2f2",
                  color: netRevenue >= 0 ? "#16a34a" : "#dc2626",
                  border: `1px solid ${netRevenue >= 0 ? "#86efac" : "#fecaca"}`,
                }}>
                  {netRevenue >= 0 ? "Surplus" : "Nombok"}
                </span>
              </div>
              <p style={{ fontSize: "16px", fontWeight: 800, color: netRevenue >= 0 ? "var(--primary)" : "#dc2626", marginTop: "6px" }}>
                {formatRupiah(netRevenue)}
              </p>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
                setelah HPP{dailySalaryCost > 0 ? " & gaji" : ""}{totalExpenses > 0 ? " & pengeluaran" : ""}
              </p>
            </div>

            {/* Daily Salary Cost Card — only show if any active employee has salary set */}
            {dailySalaryCost > 0 && (
              <div className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 700 }}> Gaji Hari Ini</p>
                  <p style={{ fontSize: "11px", color: "#d97706", fontWeight: 700 }}>{activeEmployeesWithSalary.length} org</p>
                </div>
                <p style={{ fontSize: "16px", fontWeight: 800, color: "#d97706", marginTop: "6px" }}>
                  {formatRupiah(dailySalaryCost)}
                </p>
                <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>disisihkan/hari</p>
              </div>
            )}

            {/* Additional Expenses Card */}
            <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => openExpenseModal()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 700 }}> Pengeluaran</p>
                <p style={{ fontSize: "11px", color: "#dc2626", fontWeight: 700, background: "#fee2e2", padding: "2px 7px", borderRadius: "999px" }}>+ Tambah</p>
              </div>
              <p style={{ fontSize: "16px", fontWeight: 800, color: totalExpenses > 0 ? "#dc2626" : "var(--ink-muted)", marginTop: "6px" }}>
                {totalExpenses > 0 ? formatRupiah(totalExpenses) : "Rp 0"}
              </p>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>{todayExpenses.length} item hari ini</p>
            </div>

            {/* Cash Revenue Card */}
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 700 }}> Pendapatan Cash</p>
                <Coins size={18} color="#16a34a" weight="fill" />
              </div>
              <p style={{ fontSize: "16px", fontWeight: 800, color: "#16a34a", marginTop: "6px" }}>
                {formatRupiah(cashRevenue)}
              </p>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>{cashCount} transaksi</p>
            </div>

            {/* QRIS Revenue Card */}
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 700 }}> Pendapatan QRIS</p>
                <CreditCard size={18} color="#2563eb" weight="fill" />
              </div>
              <p style={{ fontSize: "16px", fontWeight: 800, color: "#2563eb", marginTop: "6px" }}>
                {formatRupiah(qrisRevenue)}
              </p>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>{qrisCount} transaksi</p>
            </div>
          </div>

          {/* Today's Expenses List */}
          {todayExpenses.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>Pengeluaran Hari Ini</h3>
                <button
                  type="button"
                  onClick={() => openExpenseModal()}
                  style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Plus size={13} weight="bold" />
                  Tambah
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {todayExpenses.map((ex) => {
                  const d = new Date(ex.timestamp);
                  return (
                    <div key={ex.id} className="card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Receipt size={16} color="#dc2626" weight="fill" />
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)" }}>{ex.description}</p>
                          <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "1px" }}>{pad(d.getHours())}:{pad(d.getMinutes())}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#dc2626" }}>{formatRupiah(ex.amount)}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(ex.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", display: "flex", alignItems: "center" }}
                          title="Hapus"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sales Chart */}
          <div className="card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>Grafik Penjualan</h3>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["harian", "bulanan", "tahunan"] as ChartFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setChartFilter(f)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--r-pill)",
                      border: chartFilter === f ? "none" : "1px solid var(--surface-border)",
                      backgroundColor: chartFilter === f ? "var(--ink-primary)" : "var(--surface)",
                      color: chartFilter === f ? "#ffffff" : "var(--ink-secondary)",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <BarChart data={buildChartData()} color="var(--primary)" />
          </div>

          {/* Recent Transactions List */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink-primary)" }}>Transaksi Terbaru</h3>
              <button
                type="button"
                onClick={() => router.push("/admin/history")}
                style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                Lihat Semua
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {liveTransactions.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--ink-muted)", fontSize: "13px", padding: "20px 0" }}>
                  Belum ada transaksi
                </p>
              ) : liveTransactions.slice(0, 5).map((tx) => {
                const d = new Date(tx.timestamp);
                const totalCups = (tx.items || []).reduce((s, it) => s + it.quantity, 0);
                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="card"
                    style={{
                      padding: "12px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)" }}>
                          #{tx.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span style={{
                          fontSize: "10px", padding: "1px 6px", borderRadius: "9999px", fontWeight: 700,
                          backgroundColor: tx.paymentMethod === "cash" ? "#f0fdf4" : "#eff6ff",
                          color: tx.paymentMethod === "cash" ? "#16a34a" : "#2563eb",
                          border: `1px solid ${tx.paymentMethod === "cash" ? "#86efac" : "#93c5fd"}`,
                        }}>
                          {tx.paymentMethod === "cash" ? "💵 Cash" : "📱 QRIS"}
                        </span>
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
                        {pad(d.getDate())}/{pad(d.getMonth()+1)} {pad(d.getHours())}:{pad(d.getMinutes())} · {tx.cashierName || "Kasir"} · {totalCups} Cup
                      </p>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary)" }}>
                      {formatRupiah(tx.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Transaction Receipt Modal */}
      {selectedTx && (
        <ReceiptModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drag-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink-primary)" }}>Tambah Pengeluaran</h3>
                <p style={{ fontSize: "11px", color: "var(--ink-muted)" }}>Catat biaya operasional harian</p>
              </div>
              <button type="button" onClick={() => setShowExpenseModal(false)} className="btn-icon" style={{ width: "30px", height: "30px" }}>
                <X size={16} />
              </button>
            </div>

            {/* Quick presets */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
              {expensePresets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setExpenseDesc(p)}
                  style={{
                    padding: "5px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600,
                    border: expenseDesc === p ? "none" : "1.5px solid var(--surface-border)",
                    backgroundColor: expenseDesc === p ? "var(--ink-primary)" : "var(--surface)",
                    color: expenseDesc === p ? "#ffffff" : "var(--ink-secondary)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>Keterangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Es Batu, Listrik, dll"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="input"
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", display: "block", marginBottom: "6px" }}>Jumlah</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontWeight: 700, color: "var(--ink-muted)" }}>Rp</span>
                  <input
                    type="number"
                    placeholder="50000"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="input"
                    style={{ paddingLeft: "38px" }}
                    min={0}
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddExpense}
                disabled={!expenseDesc.trim() || !expenseAmount || parseInt(expenseAmount, 10) <= 0}
                style={{ marginTop: "4px" }}
              >
                <Plus size={16} weight="bold" />
                <span>Simpan Pengeluaran</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="admin" />
    </div>
  );
}
