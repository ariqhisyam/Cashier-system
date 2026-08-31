"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, formatRupiah } from "@/lib/store";
import BottomNav from "@/components/BottomNav";
import BarChart from "@/components/BarChart";
import { SignOut, TrendUp, Money, ChartBar } from "@phosphor-icons/react";

type ChartFilter = "harian" | "bulanan" | "tahunan";

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function AdminPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [chartFilter, setChartFilter] = useState<ChartFilter>("harian");

  useEffect(() => {
    if (state.session !== "admin") router.replace("/");
  }, [state.session, router]);
  if (state.session !== "admin") return null;

  const now = new Date();

  const todayTxs = state.transactions.filter((tx) => {
    const d = new Date(tx.timestamp);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });

  const grossRevenue = todayTxs.reduce((s, tx) => s + tx.total, 0);
  const netRevenue = todayTxs.reduce((sum, tx) => {
    const cost = tx.items.reduce((s, item) => {
      const product = state.products.find((p) => p.name === item.name);
      return s + (product ? product.rawMaterialCost * item.quantity : 0);
    }, 0);
    return sum + tx.total - cost;
  }, 0);

  function buildChartData() {
    if (chartFilter === "harian") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        const label = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
        const value = state.transactions.filter((tx) => {
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
        const value = state.transactions.filter((tx) => {
          const txd = new Date(tx.timestamp);
          return txd.getFullYear() === d.getFullYear() && txd.getMonth() === d.getMonth();
        }).reduce((s, tx) => s + tx.total, 0);
        return { label, value };
      });
    }
    return Array.from({ length: 4 }, (_, i) => {
      const year = now.getFullYear() - (3 - i);
      const value = state.transactions.filter((tx) => new Date(tx.timestamp).getFullYear() === year).reduce((s, tx) => s + tx.total, 0);
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
              Matcha Kyoto
            </p>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.5px" }}>
              Dashboard Admin
            </h1>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => {
              dispatch({ type: "LOGOUT" });
              router.replace("/");
            }}
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
                <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 700 }}>Pendapatan Bersih</p>
                <Money size={18} color="var(--accent)" weight="fill" />
              </div>
              <p style={{ fontSize: "16px", fontWeight: 800, color: "var(--primary)", marginTop: "6px" }}>
                {formatRupiah(netRevenue)}
              </p>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>setelah HPP</p>
            </div>
          </div>

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
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-primary)" }}>
                        #{tx.id.slice(-6).toUpperCase()}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>
                        {pad(d.getDate())}/{pad(d.getMonth()+1)} {pad(d.getHours())}:{pad(d.getMinutes())} &middot; {tx.items.length} item
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

      <BottomNav role="admin" />
    </div>
  );
}
