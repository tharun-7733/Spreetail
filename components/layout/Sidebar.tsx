"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, ArrowLeftRight, LogOut, 
  ReceiptText, Banknote, Upload, BarChart3, Settings, ShieldCheck 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/balances", label: "Balances", icon: ArrowLeftRight },
  { href: "/settlements", label: "Settlements", icon: Banknote },
  { href: "/import", label: "Import CSV", icon: Upload },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  user: { name: string; email: string };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await api.auth.logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 shadow-sm z-20">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-50">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 leading-tight tracking-tight text-[15px]">Shared Expenses</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase().replace(' ', '-')}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("w-[18px] h-[18px] shrink-0", active ? "text-indigo-600" : "text-gray-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px] text-gray-400" />
          Logout
        </button>
      </div>
    </aside>
  );
}
