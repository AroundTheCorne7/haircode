"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, LogOut, Settings, User, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "red_flag",
    title: "Red flag detected",
    body: "Sophie Laurent — RF_SCALP_006 triggered",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    type: "checkpoint",
    title: "Checkpoint due",
    body: "Marie Dubois — Week 6 re-assessment",
    time: "1 hr ago",
    read: false,
  },
  {
    id: "3",
    type: "complete",
    title: "Protocol completed",
    body: "Claire Bernard — Integration phase reached",
    time: "Yesterday",
    read: true,
  },
];

const notifIcon = (type: string) => {
  if (type === "red_flag") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  if (type === "complete") return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  return <Clock className="w-4 h-4 text-blue-500" />;
};

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  // Read user identity from localStorage (stored on login); fall back to defaults
  const [salonName, setSalonName] = useState("HairCode™");
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    const storedName = localStorage.getItem("hc_salon_name");
    const storedEmail = localStorage.getItem("hc_user_email");
    if (storedName) setSalonName(storedName);
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  // Derive avatar initials from salon name
  const avatarInitials = salonName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler as EventListener);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler as EventListener);
    };
  }, []);

  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, read: true })));

  const handleLogout = () => {
    localStorage.removeItem("hc_token");
    document.cookie = "hc_token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <header className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      {/* Hamburger menu — mobile/tablet only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-3 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Open sidebar"
      >
        <div className="w-5 h-0.5 bg-gray-600 mb-1" />
        <div className="w-5 h-0.5 bg-gray-600 mb-1" />
        <div className="w-5 h-0.5 bg-gray-600" />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">

        {/* Notification Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => { setBellOpen((v) => !v); setUserOpen(false); }}
            className="relative p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-400" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-100 rounded-xl shadow-lg z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-medium text-gray-900">Notifications</p>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-brand hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}
                  >
                    <div className="mt-0.5 flex-shrink-0">{notifIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? "font-medium text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 truncate">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-50">
                <button className="text-xs text-brand hover:underline w-full text-center">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setUserOpen((v) => !v); setBellOpen(false); }}
            className="w-10 h-10 rounded-full bg-brand flex items-center justify-center hover:ring-2 hover:ring-brand/30 transition-all"
            aria-label="User menu"
          >
            <span className="text-xs font-medium text-white">{avatarInitials || "HC"}</span>
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white border border-gray-100 rounded-xl shadow-lg z-50">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-medium text-gray-900">{salonName}</p>
                {userEmail && <p className="text-xs text-gray-500">{userEmail}</p>}
              </div>
              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </Link>
                <Link
                  href="/settings?tab=account"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Account
                </Link>
              </div>
              <div className="py-1 border-t border-gray-50">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
