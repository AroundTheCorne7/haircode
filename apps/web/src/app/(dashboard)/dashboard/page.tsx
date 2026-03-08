import { StatsCard } from "@/components/dashboard/stats-card";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { RecentClients } from "@/components/dashboard/recent-clients";
import { Users, ClipboardList, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-light text-gray-900">Good morning</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <a
          href="/consultation/new"
          className="bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
        >
          + New Consultation
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="Clients This Week" value="12" icon={Users} />
        <StatsCard label="Pending Protocols" value="3" icon={ClipboardList} />
        <StatsCard label="Completion Rate" value="94%" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodaySchedule />
        </div>
        <div className="lg:col-span-1">
          <RecentClients />
        </div>
      </div>
    </div>
  );
}
