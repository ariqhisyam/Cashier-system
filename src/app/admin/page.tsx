"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, formatRupiah, isSameDayWib, getWibDateString, calculateDailySalary } from "@/lib/store";
import BottomNav from "@/components/BottomNav";
import BarChart from "@/components/BarChart";
import { SignOut, TrendUp, Money, ChartBar, CreditCard, Coins, Plus, Trash, X, Receipt } from "@phosphor-icons/react";
import { useLogout, useTransactions, useUsers, useExpensesQuery, useCreateExpenseMutation, useDeleteExpenseMutation } from "@/hooks";
import type { Transaction } from "@/lib/types";

type ChartFilter = "harian" | "bulanan" | "tahunan";

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function AdminPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const logoutMutation = useLogout();
  const { data: liveTransactionsData } = useTransactions({ limit: 500 });
  const { data: usersData } = useUsers({ limit: 100 });
  const { data: liveExpensesData } = useExpensesQuery();
  const createExpenseMutation = useCreateExpenseMutation();
  const deleteExpenseMutation = useDeleteExpenseMutation();

  const [chartFilter, setChartFilter] = useState<ChartFilter>("harian");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePresets] = useState(["Es Batu", "Listrik", "Gas", "Transportasi", "Lainnya"]);

  const now = new Date();

  // Prefer live backend transactions from database when available, fallback to local store
  const allTxs: Transaction[] = liveTransactionsData?.items?.length
    ? liveTransactionsData.items.map((it) => ({
        id: it.id,
        timestamp: new Date(it.createdAt).getTime(),
        total: it.total,
        cashierId: it.cashierId,
        cashierName: it.cashierName,
        paymentMethod: it.paymentMethod === "CASH" ? "cash" : "qris",
        cashPaid: it.cashPaid,
        changeAmount: it.changeAmount,
        qrisProofUrl: it.qrisProofUrl,
        items: it.items.map((i) => ({
          name: i.productName,
          quantity: i.quantity,
          price: i.price,
          subtotal: i.subtotal,
          rawMaterialCost: i.rawMaterialCost,
        })),
      }))
    : state.transactions;

  const todayTxs = allTxs.filter((tx) => isSameDayWib(tx.timestamp, now));

  const grossRevenue = todayTxs.reduce((s, tx) => s + tx.total, 0);
  const totalHpp = todayTxs.reduce((sum, tx) => {
    const cost = tx.items.reduce((s, item) => {
      if ((item as any).rawMaterialCost) {
        return s + (item as any).rawMaterialCost * item.quantity;
      }
      const product = state.products.find((p) => p.name === item.name);
      return s + (product ? product.rawMaterialCost * item.quantity : 0);
    }, 0);
    return sum + cost;
  }, 0);

  // Live active employees from backend PostgreSQL (fallback to local state)
  const allStaff = usersData?.users?.length ? usersData.users : state.employees;
  const activeEmployeesWithSalary = allStaff.filter(
    (e: any) => e.isActive && (e.monthlySalary ?? 0) > 0
  );

  // Daily salary cost: Monthly salary / 30 days (per business requirement)
  const dailySalaryCost = activeEmployeesWithSalary.reduce(
    (s: number, e: any) => s + calculateDailySalary(e.monthlySalary),
    0
  );

  // Today's additional expenses from backend + local state
  const allExpenses = liveExpensesData?.length ? liveExpensesData : state.expenses ?? [];
  const todayExpenses = allExpenses.filter((ex) => isSameDayWib(ex.timestamp, now));
  const totalExpenses = todayExpenses.reduce((s, ex) => s + ex.amount, 0);

  // Exact Business Formula: Gross - Total HPP - Daily Salary - Total Expenses (Supports minus!)
  const netRevenue = grossRevenue - totalHpp - dailySalaryCost - totalExpenses;

  const cashRevenue = todayTxs.filter((tx) => tx.paymentMethod === "cash").reduce((s, tx) => s + tx.total, 0);
  const qrisRevenue = todayTxs.filter((tx) => tx.paymentMethod === "qris").reduce((s, tx) => s + tx.total, 0);
  const cashCount = todayTxs.filter((tx) => tx.paymentMethod === "cash").length;
  const qrisCount = todayTxs.filter((tx) => tx.paymentMethod === "qris").length;

  async function handleAddExpense() {
    const amount = parseInt(expenseAmount.replace(/\D/g, ""), 10);
    if (!expenseDesc.trim() || !amount || amount <= 0) return;
    const newExp = {
      id: crypto.randomUUID(),
      description: expenseDesc.trim(),
      amount,
      timestamp: Date.now(),
    };
    dispatch({
      type: "ADD_EXPENSE",
      payload: newExp,
    });
    try {
      createExpenseMutation.mutate({
        description: newExp.description,
        amount: newExp.amount,
        timestamp: newExp.timestamp,
      });
    } catch {
      // ignore
    }
    setExpenseDesc("");
    setExpenseAmount("");
    setShowExpenseModal(false);
  }

  function handleDeleteExpense(id: string) {
    dispatch({ type: "DELETE_EXPENSE", payload: id });
    try {
      deleteExpenseMutation.mutate(id);
    } catch {
      // ignore
    }
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
        const targetWib = getWibDateString(d);
        const [wibY, m, day] = targetWib.split("-");
        const label = `${day}/${m}`;
        const value = allTxs
          .filter((tx) => getWibDateString(tx.timestamp) === targetWib)
          .reduce((s, tx) => s + tx.total, 0);
        return { label, value };
      });
    }
    if (chartFilter === "bulanan") {
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const ym = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
        }).format(d);
        const [y, m] = ym.split("-");
        const label = `${m}/${y.slice(2)}`;
        const value = allTxs
          .filter((tx) => {
            const txYm = new Intl.DateTimeFormat("en-CA", {
              timeZone: "Asia/Jakarta",
              year: "numeric",
              month: "2-digit",
            }).format(new Date(tx.timestamp));
            return txYm === ym;
          })
          .reduce((s, tx) => s + tx.total, 0);
        return { label, value };
      });
    }
    return Array.from({ length: 4 }, (_, i) => {
      const year = String(now.getFullYear() - (3 - i));
      const value = allTxs
        .filter((tx) => {
          const txYear = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
          }).format(new Date(tx.timestamp));
          return txYear === year;
        })
        .reduce((s, tx) => s + tx.total, 0);
      return { label: year, value };
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
            <div className="stat-card" style={{ borderLeft: netRevenue < 0 ? "4px solid #dc2626" : "4px solid var(--accent)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "12px", color: netRevenue < 0 ? "#dc2626" : "var(--ink-muted)", fontWeight: 700 }}>
                  {netRevenue < 0 ? "Rugi Bersih" : "Keuntungan Bersih"}
                </p>
                <Money size={18} color={netRevenue < 0 ? "#dc2626" : "var(--accent)"} weight="fill" />
              </div>
              <p style={{ fontSize: "16px", fontWeight: 800, color: netRevenue >= 0 ? "var(--primary)" : "#dc2626", marginTop: "6px" }}>
                {formatRupiah(netRevenue)}
              </p>
              <p style={{ fontSize: "10px", color: "var(--ink-muted)", marginTop: "2px", lineHeight: 1.3 }}>
                Gross {formatRupiah(grossRevenue)} - HPP {formatRupiah(totalHpp)}{dailySalaryCost > 0 ? ` - Gaji ${formatRupiah(dailySalaryCost)}` : ""}{totalExpenses > 0 ? ` - Beban ${formatRupiah(totalExpenses)}` : ""}
              </p>
            </div>

            {/* Daily Salary Cost Card — ALWAYS visible on dashboard */}
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 700 }}>Beban Gaji Hari Ini</p>
                <p style={{ fontSize: "11px", color: "#d97706", fontWeight: 700 }}>{activeEmployeesWithSalary.length} org</p>
              </div>
              <p style={{ fontSize: "16px", fontWeight: 800, color: "#d97706", marginTop: "6px" }}>
                {formatRupiah(dailySalaryCost)}
              </p>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>disisihkan/hari (gaji/30)</p>
            </div>

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
              {state.transactions.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--ink-muted)", fontSize: "13px", padding: "20px 0" }}>
                  Belum ada transaksi
                </p>
              ) : state.transactions.slice(0, 4).map((tx) => {
                const d = new Date(tx.timestamp);
                return (
                  <div key={tx.id} className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)" }}>
                          #{tx.id.slice(-6).toUpperCase()}
                        </p>
                        <span style={{
                          fontSize: "10px", padding: "1px 5px", borderRadius: "9999px", fontWeight: 700,
                          backgroundColor: tx.paymentMethod === "cash" ? "#f0fdf4" : "#eff6ff",
                          color: tx.paymentMethod === "cash" ? "#16a34a" : "#2563eb",
                        }}>
                          {tx.paymentMethod === "cash" ? "💵" : "📱"}
                        </span>
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
                        {pad(d.getDate())}/{pad(d.getMonth()+1)} {pad(d.getHours())}:{pad(d.getMinutes())} · {tx.items.length} item
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
