"use client";

import { useState } from "react";
import { Save, Building2, User, Shield, Bell, Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Tab = "salon" | "account" | "gdpr" | "notifications" | "appearance";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "salon", label: "Salon", icon: <Building2 className="h-4 w-4" /> },
  { id: "account", label: "Account", icon: <User className="h-4 w-4" /> },
  { id: "gdpr", label: "GDPR & Privacy", icon: <Shield className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
];

const TIMEZONES = [
  "UTC", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Rome",
  "Europe/Madrid", "Europe/Amsterdam", "Europe/Brussels", "Europe/Zurich",
  "Europe/Warsaw", "Europe/Lisbon", "America/New_York", "America/Chicago",
  "America/Denver", "America/Los_Angeles", "America/Toronto", "America/Sao_Paulo",
  "Asia/Dubai", "Asia/Tokyo", "Asia/Shanghai", "Asia/Singapore", "Asia/Kolkata",
  "Australia/Sydney", "Pacific/Auckland",
];

const COUNTRIES = [
  "Australia", "Austria", "Belgium", "Brazil", "Canada", "Denmark",
  "Finland", "France", "Germany", "Greece", "India", "Ireland",
  "Italy", "Japan", "Luxembourg", "Netherlands", "New Zealand",
  "Norway", "Poland", "Portugal", "Singapore", "South Africa",
  "Spain", "Sweden", "Switzerland", "United Arab Emirates",
  "United Kingdom", "United States",
];

const THEMES = [
  { id: "default", label: "Default", primary: "#1A1A2E", accent: "#C9A96E" },
  { id: "rose", label: "Rosé", primary: "#2D1B1B", accent: "#E8A0A0" },
  { id: "sage", label: "Sage", primary: "#1B2D1E", accent: "#8EC3A7" },
  { id: "slate", label: "Slate", primary: "#1A2030", accent: "#8EB3C9" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("salon");
  const [saved, setSaved] = useState(false);

  // Salon fields
  const [salonName, setSalonName] = useState("Salon Lumière");
  const [slug, setSlug] = useState("salon-lumiere");
  const [country, setCountry] = useState("France");
  const [timezone, setTimezone] = useState("Europe/Paris");

  // Account fields
  const [email, setEmail] = useState("admin@salon-lumiere.fr");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Notification toggles
  const [notifications, setNotifications] = useState({
    checkpointReminders: true,
    protocolCompletions: true,
    newConsultation: true,
    redFlagAlerts: true,
  });

  // Appearance
  const [activeTheme, setActiveTheme] = useState("default");

  // GDPR retention
  const [clientRetention, setClientRetention] = useState("7");
  const [auditRetention, setAuditRetention] = useState("5");

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (activeTab === "account") {
      if (newPassword && newPassword !== confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      }
      if (newPassword && newPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters");
        return;
      }
      setPasswordError("");
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    const token = typeof window !== "undefined" ? localStorage.getItem("hc_token") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      if (activeTab === "salon") {
        // TODO: replace with real endpoint once PUT /settings/salon is implemented on the Fastify API
        await fetch(`${apiUrl}/settings/salon`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ salonName, slug, country, timezone }),
        });
      } else if (activeTab === "account") {
        // TODO: replace with real endpoint once PATCH /auth/me is implemented on the Fastify API
        await fetch(`${apiUrl}/auth/me`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            email,
            ...(currentPassword && newPassword ? { currentPassword, newPassword } : {}),
          }),
        });
      } else if (activeTab === "notifications") {
        // TODO: replace with real endpoint once PUT /settings/notifications is implemented on the Fastify API
        await fetch(`${apiUrl}/settings/notifications`, {
          method: "PUT",
          headers,
          body: JSON.stringify(notifications),
        });
      }
    } catch {
      // Non-fatal: fall through to save locally as a fallback
    }

    // Also persist to localStorage as a fallback / offline cache
    localStorage.setItem("hc_settings", JSON.stringify({
      salon: { salonName, slug, country, timezone },
      notifications,
      appearance: { activeTheme },
      gdpr: { clientRetention, auditRetention },
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your salon and account preferences</p>
        </div>
        <Button
          onClick={() => { void handleSave(); }}
          className="bg-[#1A1A2E] hover:bg-[#1A1A2E]/90 text-white gap-2 w-full sm:w-auto"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved!" : "Save changes"}
        </Button>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#C9A96E] text-[#1A1A2E] font-medium"
                : "border-transparent text-muted-foreground hover:text-[#1A1A2E]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Salon ──────────────────────────────────────────────────────── */}
      {activeTab === "salon" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Salon Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Salon Name</label>
                <Input value={salonName} onChange={(e) => setSalonName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Slug</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replaceAll("_", " ")}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Data Residency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Region</span>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">EU West</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">DPA Signed</span>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Yes</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Account ────────────────────────────────────────────────────── */}
      {activeTab === "account" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                placeholder="Repeat new password"
              />
            </div>
            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          </CardContent>
        </Card>
      )}

      {/* ── GDPR ───────────────────────────────────────────────────────── */}
      {activeTab === "gdpr" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">GDPR Compliance Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ["Data Processing Agreement", "Signed 2026-01-01", "emerald"],
                ["Right to Erasure", "Enabled", "emerald"],
                ["Consent Records", "Active", "emerald"],
                ["Audit Logging", "Active", "emerald"],
                ["Biometric Processing", "On-device only (GDPR compliant)", "emerald"],
              ].map(([label, value, color]) => (
                <div key={label as string} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{label}</span>
                  <Badge className={`bg-${color}-100 text-${color}-800 hover:bg-${color}-100`}>{value}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
                  Client data retention (years)
                </label>
                <Input
                  type="number"
                  value={clientRetention}
                  onChange={(e) => setClientRetention(e.target.value)}
                  min="1"
                  max="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
                  Audit log retention (years)
                </label>
                <Input
                  type="number"
                  value={auditRetention}
                  onChange={(e) => setAuditRetention(e.target.value)}
                  min="1"
                  max="10"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Notifications ──────────────────────────────────────────────── */}
      {activeTab === "notifications" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                { key: "checkpointReminders", label: "Checkpoint reminders", description: "Get notified when a client checkpoint is due" },
                { key: "protocolCompletions", label: "Protocol completions", description: "Alert when a client completes a phase" },
                { key: "newConsultation", label: "New consultation booked", description: "Notify when a new consultation is scheduled" },
                { key: "redFlagAlerts", label: "Red flag alerts", description: "Immediate alert when a red flag is detected" },
              ] as const
            ).map(({ key, label, description }) => {
              const enabled = notifications[key];
              return (
                <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A2E]">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => toggleNotification(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      enabled ? "bg-[#1A1A2E]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Appearance ─────────────────────────────────────────────────── */}
      {activeTab === "appearance" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map(({ id, label, primary, accent }) => {
                const isActive = activeTheme === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTheme(id)}
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      isActive ? "border-[#C9A96E]" : "border-transparent hover:border-gray-200"
                    }`}
                  >
                    <div className="flex gap-2 mb-2">
                      <div className="h-6 w-6 rounded" style={{ backgroundColor: primary }} />
                      <div className="h-6 w-6 rounded" style={{ backgroundColor: accent }} />
                    </div>
                    <p className="text-sm font-medium">{label}</p>
                    {isActive && <p className="text-xs text-muted-foreground">Active</p>}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Theme preference is saved locally. Full CSS variable switching coming soon.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
