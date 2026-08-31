"use client";
import { usePathname, useRouter } from "next/navigation";
import { Storefront, ClockCounterClockwise, Package, Users } from "@phosphor-icons/react";

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
  const items = role === "karyawan" ? KARYAWAN_ITEMS : ADMIN_ITEMS;

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
            <div className="nav-icon-wrap">
              {item.icon}
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
