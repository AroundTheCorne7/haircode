"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Users, ClipboardList, Settings, LogOut, X
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/protocols", icon: ClipboardList, label: "Protocols" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem("hc_token");
    document.cookie = "hc_token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <aside
      className={`w-56 bg-brand flex flex-col h-full flex-shrink-0 fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto ${
        open ? "flex" : "hidden lg:flex"
      }`}
    >
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-lg font-light text-white tracking-wide">HairCode™</h1>
        <button
          onClick={onClose}
          className="lg:hidden p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors w-full min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
