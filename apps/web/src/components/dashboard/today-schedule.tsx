"use client";

export function TodaySchedule() {
  const appointments = [
    { time: "10:00", name: "Isabelle Martin", type: "Hair + Scalp", status: "upcoming" },
    { time: "11:30", name: "Camille Dubois", type: "Full Consultation", status: "active" },
    { time: "14:00", name: "Léa Fontaine", type: "Follow-up", status: "upcoming" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900">Today's Schedule</h2>
        <span className="text-sm text-gray-400">{appointments.length} clients</span>
      </div>
      <div className="space-y-3">
        {appointments.map((appt) => (
          <div key={appt.time} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${appt.status === "active" ? "bg-accent" : "bg-gray-200"}`} />
            <span className="text-sm text-gray-400 w-14 flex-shrink-0">{appt.time}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{appt.name}</p>
              <p className="text-xs text-gray-400">{appt.type}</p>
            </div>
            <button className="text-xs text-brand font-medium hover:underline flex-shrink-0">
              {appt.status === "active" ? "Resume" : "View"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
