"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  Storefront,
  ClockCounterClockwise,
  Package,
  Users,
  SignOut,
  SpinnerGap,
} from "@phosphor-icons/react";
import { useLogout } from "@/hooks";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const KARYAWAN_ITEMS: NavItem[] = [
  { label: "Kasir", icon: <Storefront size={20} />, href: "/karyawan" },
  { label: "History", icon: <ClockCounterClockwise size={20} />, href: "/karyawan/history" },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: <Storefront size={20} />, href: "/admin" },
  { label: "Produk", icon: <Package size={20} />, href: "/admin/products" },
  { label: "Karyawan", icon: <Users size={20} />, href: "/admin/employees" },
  { label: "History", icon: <ClockCounterClockwise size={20} />, href: "/admin/history" },
];

export default function BottomNav({ role }: { role: "karyawan" | "admin" }) {
  const pathname = usePathname();
  const router = useRouter();
  const logoutMutation = useLogout();
  const items = role === "karyawan" ? KARYAWAN_ITEMS : ADMIN_ITEMS;

  function handleLogoutClick() {
    if (confirm("Apakah Anda yakin ingin keluar dari akun?")) {
      logoutMutation.mutate();
    }
  }

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <button
            key={item.href}
            type="button"
            className={`nav-item${active ? " active" : ""}`}
            onClick={() => router.push(item.href)}
          >
            <div className="nav-icon-wrap">{item.icon}</div>
            <span>{item.label}</span>
          </button>
        );
      })}

      {/* Logout Navigation Item */}
      <button
        type="button"
        className="nav-item"
        onClick={handleLogoutClick}
        disabled={logoutMutation.isPending}
        title="Keluar / Logout"
      >
        <div
          className="nav-icon-wrap"
          style={{
            backgroundColor: logoutMutation.isPending ? "#fee2e2" : "transparent",
          }}
        >
          {logoutMutation.isPending ? (
            <SpinnerGap size={20} className="animate-spin" color="#dc2626" />
          ) : (
            <SignOut size={20} color="#dc2626" />
          )}
        </div>
        <span style={{ color: "#dc2626" }}>Keluar</span>
      </button>
    </nav>
  );
}
